package com.companion.backend.config;

import com.companion.backend.user.User;
import com.companion.backend.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.username:admin}")
    private String adminUsername;

    @Value("${admin.email:admin@companion.app}")
    private String adminEmail;

    @Value("${admin.password:#{null}}")
    private String adminPassword;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (adminPassword == null || adminPassword.isBlank()) {
            log.warn("ADMIN_PASSWORD env var not set — skipping admin seeding");
            return;
        }

        boolean exists = userRepository.findByEmail(adminEmail).isPresent();
        if (exists) {
            log.info("Admin account already exists — skipping");
            return;
        }

        User admin = new User();
        admin.setUsername(adminUsername);
        admin.setEmail(adminEmail);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setAdmin(true);
        // Seeded directly, so no verification email is ever sent — mark verified
        // up front or the login gate would lock the admin out permanently.
        admin.setVerified(true);
        userRepository.save(admin);

        log.info("Admin account created: {}", adminEmail);
    }
}