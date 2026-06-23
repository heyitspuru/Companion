package com.companion.backend.user;

import com.companion.backend.badge.BadgeRepository;
import com.companion.backend.checkin.StreakRepository;
import com.companion.backend.circle.CircleMemberRepository;
import com.companion.backend.circle.CircleRepository;
import com.companion.backend.goal.GoalRepository;
import com.companion.backend.task.TaskCheckinRepository;
import com.companion.backend.task.CircleTaskRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProfileService {

    private final CurrentUserProvider currentUserProvider;
    private final CircleMemberRepository circleMemberRepository;
    private final BadgeRepository badgeRepository;
    private final StreakRepository streakRepository;
    private final GoalRepository goalRepository;
    private final CircleTaskRepository circleTaskRepository;
    private final TaskCheckinRepository taskCheckinRepository;

    public ProfileService(CurrentUserProvider currentUserProvider,
                          CircleMemberRepository circleMemberRepository,
                          BadgeRepository badgeRepository,
                          StreakRepository streakRepository,
                          GoalRepository goalRepository,
                          CircleTaskRepository circleTaskRepository,
                          TaskCheckinRepository taskCheckinRepository) {
        this.currentUserProvider = currentUserProvider;
        this.circleMemberRepository = circleMemberRepository;
        this.badgeRepository = badgeRepository;
        this.streakRepository = streakRepository;
        this.goalRepository = goalRepository;
        this.circleTaskRepository = circleTaskRepository;
        this.taskCheckinRepository = taskCheckinRepository;
    }

    private User getCurrentUser() {
        return currentUserProvider.getCurrentUser();
    }

    public ProfileResponse getProfile() {
        User user = getCurrentUser();

        // Total circles
        var memberships = circleMemberRepository.findByUserId(user.getId());
        int totalCircles = memberships.size();

        // Total badges
        var badges = badgeRepository.findByUserId(user.getId());
        int totalBadges = badges.size();

        // Longest streak ever across all circles
        var streaks = streakRepository.findByUserId(user.getId());
        int longestStreakEver = streaks.stream()
                .mapToInt(s -> s.getLongestStreak())
                .max().orElse(0);

        // Total tasks completed (all time)
        var allTasks = circleTaskRepository.findByUserId(user.getId());
        List<Long> taskIds = allTasks.stream()
                .map(t -> t.getId()).collect(Collectors.toList());
        int totalTasksCompleted = taskIds.isEmpty() ? 0 :
                (int) taskCheckinRepository.findByUserIdAndTaskIdIn(user.getId(), taskIds)
                        .stream().filter(tc -> tc.getCompleted()).count();

        // Circle stats
        List<ProfileResponse.CircleStat> circleStats = memberships.stream().map(m -> {
            var circle = m.getCircle();
            var goals = goalRepository.findByCircleId(circle.getId());
            var goal = goals.isEmpty() ? null : goals.get(0);

            var streak = streaks.stream()
                    .filter(s -> s.getCircle().getId().equals(circle.getId()))
                    .findFirst().orElse(null);

            int currentStreak = streak != null ? streak.getCurrentStreak() : 0;
            int longestStreak = streak != null ? streak.getLongestStreak() : 0;

            int progressPercent = 0;
            int daysLeft = 0;
            String goalTitle = "";
            String goalCategory = "";

            if (goal != null) {
                LocalDate start = goal.getStartDate();
                LocalDate end = goal.getEndDate();
                LocalDate now = LocalDate.now();
                long total = ChronoUnit.DAYS.between(start, end);
                long elapsed = ChronoUnit.DAYS.between(start, now);
                progressPercent = total > 0 ? (int) Math.min(100,
                        Math.max(0, (elapsed * 100) / total)) : 0;
                daysLeft = (int) Math.max(0, ChronoUnit.DAYS.between(now, end));
                goalTitle = goal.getTitle();
                goalCategory = goal.getCategory().name();
            }

            return new ProfileResponse.CircleStat(
                    circle.getId(), circle.getName(), goalTitle,
                    goalCategory, currentStreak, longestStreak,
                    progressPercent, daysLeft
            );
        }).collect(Collectors.toList());

        // Recent badges
        List<ProfileResponse.BadgeStat> badgeStats = badges.stream()
                .sorted((a, b) -> b.getAwardedAt().compareTo(a.getAwardedAt()))
                .limit(10)
                .map(b -> new ProfileResponse.BadgeStat(
                        b.getCircle().getName(),
                        b.getWeekStart().toString(),
                        b.getCheckinCount()
                ))
                .collect(Collectors.toList());

        return ProfileResponse.builder()
                .username(user.getUsername())
                .email(user.getEmail())
                .memberSince(user.getCreatedAt())
                .totalCircles(totalCircles)
                .totalBadges(totalBadges)
                .longestStreakEver(longestStreakEver)
                .totalTasksCompleted(totalTasksCompleted)
                .circleStats(circleStats)
                .recentBadges(badgeStats)
                .build();
    }
}