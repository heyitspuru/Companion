package com.companion.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory, per-IP fixed-window rate limiter for the public auth endpoints
 * (/api/auth/**) — blunts brute-force, credential stuffing and email-bombing.
 *
 * Per-instance state; fine for the single-replica baseline. If the backend is
 * scaled out, move the counters to a shared store (e.g. Redis).
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 60_000;  // 1 minute
    private static final int MAX_REQUESTS = 30;    // per IP per window
    private static final int MAX_TRACKED_IPS = 50_000;

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    private static final class Window {
        long start;
        int count;
        Window(long start) {
            this.start = start;
            this.count = 1;
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/auth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        final String ip = clientIp(request);
        final long now = System.currentTimeMillis();

        // Bound memory: drop stale entries if the map grows unexpectedly large.
        if (windows.size() > MAX_TRACKED_IPS) {
            windows.entrySet().removeIf(e -> now - e.getValue().start > WINDOW_MS);
        }

        Window w = windows.compute(ip, (k, cur) -> {
            if (cur == null || now - cur.start > WINDOW_MS) {
                return new Window(now); // new window
            }
            cur.count++;
            return cur;
        });

        if (w.count > MAX_REQUESTS) {
            response.setStatus(429); // Too Many Requests
            response.setContentType("application/json");
            response.setHeader("Retry-After", "60");
            response.getWriter().write(
                    "{\"message\":\"Too many requests — please slow down and try again shortly.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest request) {
        // Behind the Azure Container Apps ingress proxy, the real client is the
        // first hop in X-Forwarded-For.
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            int comma = xff.indexOf(',');
            return (comma > 0 ? xff.substring(0, comma) : xff).trim();
        }
        return request.getRemoteAddr();
    }
}
