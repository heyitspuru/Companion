package com.companion.backend.notification;

import com.companion.backend.common.AppUrls;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * The rally's "away" channel: when a squadmate has your back, you get an email —
 * so the nudge reaches you even when the app is closed. Mirrors the resilient
 * pattern in AuthService (SimpleMailMessage, swallow failures — a flaky mail
 * server must never fail the rally request).
 */
@Service
public class RallyEmailService {

    private final JavaMailSender mailSender;

    public RallyEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendRally(String toEmail, String toUsername, String fromUsername,
                          String squadName, Long circleId, int squadStreak) {
        try {
            String link = AppUrls.frontendBaseUrl() + "/circle/" + circleId;
            String streakLine = squadStreak > 0
                    ? "Your squad is on a " + squadStreak + "-day streak — don't be the one who breaks it.\n\n"
                    : "";

            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(toEmail);
            msg.setSubject(fromUsername + " has your back — get in, " + toUsername);
            msg.setText(toUsername + ",\n\n"
                    + fromUsername + " from \"" + squadName + "\" just rallied you. "
                    + "You haven't reported in yet and the day's running out.\n\n"
                    + streakLine
                    + "Report in now: " + link
                    + "\n\nNo one gets left behind.\n— Companion");
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("Failed to send rally email: " + e.getMessage());
        }
    }
}
