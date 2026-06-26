package com.companion.backend.auth;

import com.companion.backend.config.JwtAuthFilter;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpirationMs;

    // Cross-site (Vercel → Azure) needs SameSite=None; Secure in prod. Local dev
    // over http overrides these to Lax/false so the cookie is still accepted.
    @Value("${cookie.same-site:None}")
    private String cookieSameSite;

    @Value("${cookie.secure:true}")
    private boolean cookieSecure;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse auth = authService.login(request);
        // Deliver the JWT as an httpOnly cookie so it is never exposed to JS
        // (XSS can't read it). The body still carries username/email for the UI.
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, tokenCookie(auth.getToken(), jwtExpirationMs).toString())
                .body(auth);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // Overwrite the cookie with an immediately-expired one.
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, tokenCookie("", 0).toString())
                .build();
    }

    private ResponseCookie tokenCookie(String value, long maxAgeMs) {
        return ResponseCookie.from(JwtAuthFilter.TOKEN_COOKIE, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(Duration.ofMillis(maxAgeMs))
                .build();
    }

    // Hit from the email link via the /verify-email page. Returns 200 on
    // success; an invalid/expired token surfaces as a 4xx through the
    // GlobalExceptionHandler, which the page treats as a failed verification.
    @GetMapping("/verify-email")
    public ResponseEntity<Void> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(
            @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok().build();
    }
}