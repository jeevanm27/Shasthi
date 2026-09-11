package com.shasthi.order.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Set;

/**
 * JWT filter for order-service.
 * Same shared-secret pattern as catalog-service.
 *
 * Route rules:
 *  GET /api/orders/my    → requires any valid JWT (CUSTOMER or ADMIN)
 *  GET /api/orders       → requires ADMIN
 *  PUT /api/orders/*/status → requires ADMIN
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    private static final String ADMIN = "ADMIN";

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest req,
                                    @NonNull HttpServletResponse res,
                                    @NonNull FilterChain chain)
            throws ServletException, IOException {

        String path   = req.getRequestURI();
        String method = req.getMethod();

        // Determine route requirements
        boolean requiresAnyAuth  = path.startsWith("/api/orders");
        boolean requiresAdmin    = requiresAnyAuth &&
                (path.equals("/api/orders") || path.contains("/status"));

        if (!requiresAnyAuth) {
            chain.doFilter(req, res);
            return;
        }

        String authHeader = req.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            sendError(res, HttpServletResponse.SC_UNAUTHORIZED, "Missing or invalid Authorization header");
            return;
        }

        try {
            Claims claims = Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                    .build()
                    .parseSignedClaims(authHeader.substring(7))
                    .getPayload();

            String role = claims.get("role", String.class);
            req.setAttribute("userId",    claims.getSubject());
            req.setAttribute("userEmail", claims.get("email", String.class));
            req.setAttribute("userRole",  role);

            if (requiresAdmin && !ADMIN.equals(role)) {
                sendError(res, HttpServletResponse.SC_FORBIDDEN, "Forbidden: requires ADMIN role");
                return;
            }

        } catch (JwtException ex) {
            sendError(res, HttpServletResponse.SC_UNAUTHORIZED, "Token expired or invalid");
            return;
        }

        chain.doFilter(req, res);
    }

    private void sendError(HttpServletResponse res, int status, String message) throws IOException {
        res.setStatus(status);
        res.setContentType("application/json");
        res.getWriter().write("{\"message\":\"" + message + "\"}");
    }
}
