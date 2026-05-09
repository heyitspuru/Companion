package com.companion.backend.badge;

import com.companion.backend.user.User;
import com.companion.backend.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/badges")
@CrossOrigin(origins = "http://localhost:3000")
public class BadgeController {

    private final BadgeService badgeService;
    private final UserRepository userRepository;

    public BadgeController(BadgeService badgeService,
                           UserRepository userRepository) {
        this.badgeService = badgeService;
        this.userRepository = userRepository;
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
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(badgeService.getMyBadges(user.getId()));
    }

    // Manual trigger for testing (awards badge for current week)
    @PostMapping("/trigger/{circleId}")
    public ResponseEntity<BadgeResponse> triggerBadge(
            @PathVariable Long circleId) {
        return ResponseEntity.ok(badgeService.triggerBadgeForCircle(circleId));
    }
}