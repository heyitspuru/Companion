package com.companion.backend.badge;

import com.companion.backend.user.CurrentUserProvider;
import com.companion.backend.user.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/badges")
public class BadgeController {

    private final BadgeService badgeService;
    private final CurrentUserProvider currentUserProvider;

    public BadgeController(BadgeService badgeService,
                           CurrentUserProvider currentUserProvider) {
        this.badgeService = badgeService;
        this.currentUserProvider = currentUserProvider;
    }

    // Get all badges for a circle
    @GetMapping("/circle/{circleId}")
    public ResponseEntity<List<BadgeResponse>> getCircleBadges(
            @PathVariable Long circleId) {
        return ResponseEntity.ok(badgeService.getCircleBadges(circleId));
    }

    // Get my badges across all circles
    @GetMapping("/my")
    public ResponseEntity<List<BadgeResponse>> getMyBadges() {
        User user = currentUserProvider.getCurrentUser();
        return ResponseEntity.ok(badgeService.getMyBadges(user.getId()));
    }

    // Manual trigger for testing (awards badge for current week)
    @PostMapping("/trigger/{circleId}")
    public ResponseEntity<BadgeResponse> triggerBadge(
            @PathVariable Long circleId) {
        return ResponseEntity.ok(badgeService.triggerBadgeForCircle(circleId));
    }
}