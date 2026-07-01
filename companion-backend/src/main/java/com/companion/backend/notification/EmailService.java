package com.companion.backend.notification;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Central, fire-and-forget email sender. The actual SMTP round-trip (1–3s to
 * Gmail) runs on a background thread via {@link Async}, so request threads —
 * registration, password reset, the rally — return immediately instead of
 * blocking on the mail server.
 *
 * NOTE on {@code @Async}: it only applies across a bean boundary (Spring proxy).
 * Callers (AuthService, RallyEmailService) are separate beans, so the async
 * dispatch works. Failures are swallowed here on the async thread — a flaky mail
 * server must never surface as a failed request.
 */
@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void send(String to, String subject, String text) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(text);
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
        }
    }
}
