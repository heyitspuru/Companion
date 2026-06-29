package com.companion.backend.badge;

import com.companion.backend.checkin.CheckInRepository;
import com.companion.backend.circle.Circle;
import com.companion.backend.circle.CircleMember;
import com.companion.backend.circle.CircleMemberRepository;
import com.companion.backend.circle.CircleRepository;
import com.companion.backend.common.NotFoundException;
import com.companion.backend.user.User;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BadgeService {

    private final BadgeRepository badgeRepository;
    private final CircleRepository circleRepository;
    private final CircleMemberRepository circleMemberRepository;
    private final CheckInRepository checkInRepository;

    public BadgeService(BadgeRepository badgeRepository,
                        CircleRepository circleRepository,
                        CircleMemberRepository circleMemberRepository,
                        CheckInRepository checkInRepository) {
        this.badgeRepository = badgeRepository;
        this.circleRepository = circleRepository;
        this.circleMemberRepository = circleMemberRepository;
        this.checkInRepository = checkInRepository;
    }

    // The weekly winner-badge cron was removed in the fireteam pivot (PRODUCT.md):
    // crowning a single "top performer" pits squadmates against each other, which
    // is the opposite of cohesion. The manual trigger + read endpoints remain so
    // historical badges still render; no new winner-badges are minted.

    // Monday of the most recently completed week, relative to the given day.
    // Both the scheduled job and the manual trigger use this so they always
    // evaluate the same date window and dedup against each other correctly.
    private LocalDate lastCompletedWeekStart(LocalDate reference) {
        return reference.with(DayOfWeek.MONDAY).minusWeeks(1);
    }

    // Can also be triggered manually for a specific circle
    public BadgeResponse awardBadgeForCircle(Circle circle,
                                             LocalDate weekStart,
                                             LocalDate weekEnd) {
        // Skip if badge already awarded for this week
        if (badgeRepository.findByCircleIdAndWeekStart(
                circle.getId(), weekStart).isPresent()) {
            return null;
        }

        List<CircleMember> members =
                circleMemberRepository.findByCircleId(circle.getId());

        User winner = null;
        int maxCheckins = 0;

        for (CircleMember member : members) {
            User user = member.getUser();
            List<java.time.LocalDate> dates =
                    checkInRepository
                            .findByUserIdAndCircleId(
                                    user.getId(), circle.getId())
                            .stream()
                            .filter(c -> !c.getCheckinDate().isBefore(weekStart)
                                    && !c.getCheckinDate().isAfter(weekEnd)
                                    && c.getCompleted())
                            .map(c -> c.getCheckinDate())
                            .collect(Collectors.toList());

            if (dates.size() > maxCheckins) {
                maxCheckins = dates.size();
                winner = user;
            }
        }

        if (winner == null || maxCheckins == 0) return null;

        Badge badge = Badge.builder()
                .user(winner)
                .circle(circle)
                .weekStart(weekStart)
                .weekEnd(weekEnd)
                .checkinCount(maxCheckins)
                .build();

        badgeRepository.save(badge);

        return buildBadgeResponse(badge);
    }

    public List<BadgeResponse> getCircleBadges(Long circleId) {
        return badgeRepository.findByCircleId(circleId)
                .stream()
                .map(this::buildBadgeResponse)
                .collect(Collectors.toList());
    }

    public List<BadgeResponse> getMyBadges(Long userId) {
        return badgeRepository.findByUserId(userId)
                .stream()
                .map(this::buildBadgeResponse)
                .collect(Collectors.toList());
    }

    // Manual trigger for testing
    public BadgeResponse triggerBadgeForCircle(Long circleId) {
        Circle circle = circleRepository.findById(circleId)
                .orElseThrow(() -> new NotFoundException("Circle not found"));

        LocalDate weekStart = lastCompletedWeekStart(LocalDate.now());
        LocalDate weekEnd = weekStart.plusDays(6);

        return awardBadgeForCircle(circle, weekStart, weekEnd);
    }

    private BadgeResponse buildBadgeResponse(Badge badge) {
        return BadgeResponse.builder()
                .id(badge.getId())
                .username(badge.getUser().getUsername())
                .circleId(badge.getCircle().getId())
                .circleName(badge.getCircle().getName())
                .weekStart(badge.getWeekStart())
                .weekEnd(badge.getWeekEnd())
                .checkinCount(badge.getCheckinCount())
                .awardedAt(badge.getAwardedAt())
                .build();
    }
}