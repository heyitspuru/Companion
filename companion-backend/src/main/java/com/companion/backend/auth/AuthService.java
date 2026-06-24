package com.companion.backend.auth;

import com.companion.backend.common.BadRequestException;
import com.companion.backend.common.ConflictException;
import com.companion.backend.common.ForbiddenException;
import com.companion.backend.common.NotFoundException;
import com.companion.backend.config.JwtUtil;
import com.companion.backend.user.User;
import com.companion.backend.user.UserRepository;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final JavaMailSender mailSender;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuthenticationManager authenticationManager,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       EmailVerificationTokenRepository emailVerificationTokenRepository,
                       JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.mailSender = mailSender;
    }

    // ── Register ──

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already in use");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("Username already taken");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();
        // New accounts start unverified (User.verified defaults to false) and
        // cannot log in until they click the emailed verification link.
        userRepository.save(user);

        sendVerificationEmail(user.getEmail());

        // No JWT here — registration is not a login. The client shows a
        // "check your email" screen; the token is issued only after login,
        // which is gated on verification below.
        return AuthResponse.builder()
                .username(user.getUsername())
                .email(user.getEmail())
                .build();
    }

    private void sendVerificationEmail(String email) {
        // Replace any prior tokens so only the newest link is valid.
        emailVerificationTokenRepository.deleteByEmail(email);

        String token = UUID.randomUUID().toString();
        EmailVerificationToken evt = new EmailVerificationToken();
        evt.setToken(token);
        evt.setEmail(email);
        evt.setExpiresAt(LocalDateTime.now().plusHours(24));
        evt.setUsed(false);
        emailVerificationTokenRepository.save(evt);

        try {
            String verifyLink = System.getenv().getOrDefault("FRONTEND_BASE_URL", "http://localhost:3000")
                    + "/verify-email?token=" + token;

            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(email);
            msg.setSubject("Companion — Verify your email");
            msg.setText("Welcome to Companion! Confirm your email using the link below "
                    + "(expires in 24 hours):\n\n"
                    + verifyLink
                    + "\n\nIf you did not create this account, ignore this email.");
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("Failed to send verification email: " + e.getMessage());
        }
    }

    // ── Verify Email ──

    public void verifyEmail(String token) {
        EmailVerificationToken evt = emailVerificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid token"));

        if (evt.getUsed() || evt.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Invalid or expired token");
        }

        User user = userRepository.findByEmail(evt.getEmail())
                .orElseThrow(() -> new NotFoundException("User not found"));

        user.setVerified(true);
        userRepository.save(user);

        // Drop every token for this email; a deleted token fails replay at
        // findByToken, so there's no need to also persist used=true first.
        emailVerificationTokenRepository.deleteByEmail(user.getEmail());
    }

    // ── Login ──

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new NotFoundException("User not found"));

        // Credentials are valid, but unverified accounts may not log in.
        if (!user.isVerified()) {
            throw new ForbiddenException("Please verify your email before logging in");
        }

        var token = jwtUtil.generateToken(
                new org.springframework.security.core.userdetails.User(
                        user.getEmail(),
                        user.getPassword(),
                        new ArrayList<>()
                )
        );

        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .email(user.getEmail())
                .build();
    }

    // ── Forgot Password ──

    public void forgotPassword(String email) {
        // Always respond success — never reveal if email exists
        String token = UUID.randomUUID().toString();

        PasswordResetToken prt = new PasswordResetToken();
        prt.setToken(token);
        prt.setEmail(email);
        prt.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        prt.setUsed(false);
        passwordResetTokenRepository.save(prt);

        try {
            String resetLink = System.getenv().getOrDefault("FRONTEND_BASE_URL", "http://localhost:3000")
                    + "/reset-password?token=" + token;

            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(email);
            msg.setSubject("Companion — Reset your password");
            msg.setText("Reset your Companion password using the link below "
                    + "(expires in 15 minutes):\n\n"
                    + resetLink
                    + "\n\nIf you did not request this, ignore this email.");
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("Failed to send reset email: " + e.getMessage());
        }
    }

    // ── Reset Password ──

    public void resetPassword(String token, String newPassword) {
        PasswordResetToken prt = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid token"));

        if (prt.getUsed() || prt.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Invalid or expired token");
        }

        User user = userRepository.findByEmail(prt.getEmail())
                .orElseThrow(() -> new NotFoundException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Invalidate every reset token for this email (including the one just
        // used). Deleting makes any replay fail at findByToken, so there's no
        // need to also persist used=true first — that save was immediately
        // undone by this delete.
        passwordResetTokenRepository.deleteByEmail(user.getEmail());
    }
}