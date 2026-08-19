package com.shasthi.orders;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import java.time.Duration;

@SpringBootApplication
public class OrderServiceApplication {
  public static void main(String[] args) { SpringApplication.run(OrderServiceApplication.class, args); }
  @Bean
  RestClient catalogRestClient(@Value("${CATALOG_URL:http://localhost:8080}") String catalogUrl) {
    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(Duration.ofSeconds(2));
    factory.setReadTimeout(Duration.ofSeconds(3));
    return RestClient.builder().baseUrl(catalogUrl).requestFactory(factory).build();
  }
}
