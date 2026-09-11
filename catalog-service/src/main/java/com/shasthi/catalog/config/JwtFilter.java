package com.shasthi.catalog.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Set;

/**
 * JWT filter for catalog-service.
 *
 * - Verifies Bearer tokens using the shared JWT_SECRET.
 * - Attaches X-User-Id, X-User-Email, X-User-Role request attributes.
 * - Blocks ADMIN-only routes for non-admins (POST/PUT/DELETE on /api/catalog/products).
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtFilter.class);

    // Routes that require ADMIN role
    private static final Set<String> WRITE_METHODS = Set.of("POST", "PUT", "DELETE");

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest req,
                                    @NonNull HttpServletResponse res,
                                    @NonNull FilterChain chain)
            throws ServletException, IOException {

        String path   = req.getRequestURI();
        String method = req.getMethod();

        // Skip JWT verification for public read endpoints and actuator
        boolean isAdminRoute = path.startsWith("/api/catalog/products") && WRITE_METHODS.contains(method);
        boolean needsAuth    = isAdminRoute;

        String authHeader = req.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            if (needsAuth) {
                res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                res.setContentType("application/json");
                res.getWriter().write("{\"message\":\"Missing or invalid Authorization header\"}");
                return;
            }
            chain.doFilter(req, res);
            return;
        }

        String token = authHeader.substring(7);
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String role = claims.get("role", String.class);

            req.setAttribute("userId",    claims.getSubject());
            req.setAttribute("userEmail", claims.get("email", String.class));
            req.setAttribute("userRole",  role);

            // ADMIN-only route check
            if (isAdminRoute && !"ADMIN".equals(role)) {
                res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                res.setContentType("application/json");
                res.getWriter().write("{\"message\":\"Forbidden: requires ADMIN role\"}");
                return;
            }

        } catch (JwtException ex) {
            log.warn("[catalog] JWT validation failed: {}", ex.getMessage());
            if (needsAuth) {
                res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                res.setContentType("application/json");
                res.getWriter().write("{\"message\":\"Token expired or invalid\"}");
                return;
            }
        }

        chain.doFilter(req, res);
    }
}
