package com.companion.backend.notification;

import com.companion.backend.common.AppUrls;
import org.springframework.stereotype.Service;

/**
 * The rally's "away" channel: when a squadmate has your back, you get an email —
 * so the nudge reaches you even when the app is closed. Composes the message and
 * hands it to the async {@link EmailService}, so the rally request returns
 * without waiting on SMTP.
 */
@Service
public class RallyEmailService {

    private final EmailService emailService;

    public RallyEmailService(EmailService emailService) {
        this.emailService = emailService;
    }

    public void sendRally(String toEmail, String toUsername, String fromUsername,
                          String squadName, Long circleId, int squadStreak) {
        String link = AppUrls.frontendBaseUrl() + "/circle/" + circleId;
        String streakLine = squadStreak > 0
                ? "Your squad is on a " + squadStreak + "-day streak — don't be the one who breaks it.\n\n"
                : "";

        emailService.send(toEmail,
                fromUsername + " has your back — get in, " + toUsername,
                toUsername + ",\n\n"
                        + fromUsername + " from \"" + squadName + "\" just rallied you. "
                        + "You haven't reported in yet and the day's running out.\n\n"
                        + streakLine
                        + "Report in now: " + link
                        + "\n\nNo one gets left behind.\n— Companion");
    }
}
