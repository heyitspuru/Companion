package com.companion.backend.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    Optional<EmailVerificationToken> findByToken(String token);

    // A derived delete needs an active transaction; without these annotations
    // (matching PasswordResetTokenRepository) every register/verify call would
    // throw TransactionRequiredException.
    @Modifying
    @Transactional
    void deleteByEmail(String email);
}