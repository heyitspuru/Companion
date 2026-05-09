package com.companion.backend.circle;

import com.companion.backend.goal.Goal;
import com.companion.backend.goal.GoalRepository;
import com.companion.backend.user.User;
import com.companion.backend.user.UserRepository;
import com.companion.backend.badge.BadgeRepository;
import com.companion.backend.checkin.StreakRepository;
import com.companion.backend.checkin.CheckInRepository;
import com.companion.backend.task.CircleTaskRepository;
import com.companion.backend.task.TaskCheckinRepository;
import com.companion.backend.task.CircleTask;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class CircleService {

    private final CircleRepository circleRepository;
    private final CircleMemberRepository circleMemberRepository;
    private final GoalRepository goalRepository;
    private final UserRepository userRepository;
    private final StreakRepository streakRepository;
    private final BadgeRepository badgeRepository;
    private final CircleTaskRepository circleTaskRepository;
    private final TaskCheckinRepository taskCheckinRepository;
    private final CheckInRepository checkinRepository;

    public CircleService(CircleRepository circleRepository,
                         CircleMemberRepository circleMemberRepository,
                         GoalRepository goalRepository,
                         UserRepository userRepository,
                         StreakRepository streakRepository,
                         BadgeRepository badgeRepository,
                         CircleTaskRepository circleTaskRepository,
                         TaskCheckinRepository taskCheckinRepository,
                         CheckInRepository checkinRepository) {
        this.circleRepository = circleRepository;
        this.circleMemberRepository = circleMemberRepository;
        this.goalRepository = goalRepository;
        this.userRepository = userRepository;
        this.streakRepository = streakRepository;
        this.badgeRepository = badgeRepository;
        this.circleTaskRepository = circleTaskRepository;
        this.taskCheckinRepository = taskCheckinRepository;
        this.checkinRepository = checkinRepository;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ── Create ──

    public CircleResponse createCircle(CreateCircleRequest request) {
        User currentUser = getCurrentUser();

        Circle circle = Circle.builder()
                .name(request.getName())
                .createdBy(currentUser)
                .inviteCode(UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .completionThreshold(request.getCompletionThreshold())
                .customThresholdPercent(request.getCustomThresholdPercent())
                .build();

        circleRepository.save(circle);

        CircleMember member = CircleMember.builder()
                .circle(circle)
                .user(currentUser)
                .build();
        circleMemberRepository.save(member);

        Goal goal = Goal.builder()
                .title(request.getGoalTitle())
                .description(request.getGoalDescription())
                .category(request.getGoalCategory())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .circle(circle)
                .build();
        goalRepository.save(goal);

        return buildCircleResponse(circle);
    }

    // ── Join ──

    public CircleResponse joinCircle(String inviteCode) {
        User currentUser = getCurrentUser();

        Circle circle = circleRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new RuntimeException("Invalid invite code"));

        if (circleMemberRepository.existsByCircleIdAndUserId(
                circle.getId(), currentUser.getId())) {
            throw new RuntimeException("You are already a member of this circle");
        }

        CircleMember member = CircleMember.builder()
                .circle(circle)
                .user(currentUser)
                .build();
        circleMemberRepository.save(member);

        return buildCircleResponse(circle);
    }

    // ── Read ──

    public List<CircleResponse> getMyCircles() {
        User currentUser = getCurrentUser();
        List<CircleMember> memberships =
                circleMemberRepository.findByUserId(currentUser.getId());

        return memberships.stream()
                .map(m -> buildCircleResponse(m.getCircle()))
                .collect(Collectors.toList());
    }

    public CircleResponse getCircleById(Long circleId) {
        Circle circle = circleRepository.findById(circleId)
                .orElseThrow(() -> new RuntimeException("Circle not found"));
        return buildCircleResponse(circle);
    }

    // ── Delete (creator only) ──

    public void deleteCircle(Long circleId) {
        User currentUser = getCurrentUser();
        Circle circle = circleRepository.findById(circleId)
                .orElseThrow(() -> new RuntimeException("Circle not found"));

        if (!circle.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only the circle creator can delete it");
        }

        // Delete in dependency order — children before parents

        // 1. task_checkins — references circle_tasks
        List<CircleTask> tasks = circleTaskRepository.findByCircleId(circleId);
        if (!tasks.isEmpty()) {
            List<Long> taskIds = tasks.stream()
                    .map(CircleTask::getId)
                    .collect(Collectors.toList());
            taskCheckinRepository.deleteByTaskIdIn(taskIds);
        }

        // 2. circle_tasks — references circles
        circleTaskRepository.deleteByCircleId(circleId);

        // 3. streaks — references circles
        streakRepository.deleteByCircleId(circleId);

        // 4. badges — references circles
        badgeRepository.deleteByCircleId(circleId);

        // 5. checkins — references circles
        checkinRepository.deleteByCircleId(circleId);

        // 6. goals + circle_members handled by CascadeType.ALL on Circle entity
        circleRepository.delete(circle);
    }

    // ── Leave (non-creator members only) ──

    public void leaveCircle(Long circleId) {
        User currentUser = getCurrentUser();
        Circle circle = circleRepository.findById(circleId)
                .orElseThrow(() -> new RuntimeException("Circle not found"));

        if (circle.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Creator cannot leave — delete the circle instead");
        }

        CircleMember membership = circleMemberRepository
                .findByCircleIdAndUserId(circleId, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("You are not a member of this circle"));

        circleMemberRepository.delete(membership);
    }

    // ── Conclude (creator only — archive or extend) ──

    public CircleResponse concludeCircle(Long circleId, String action, LocalDate newEndDate) {
        User currentUser = getCurrentUser();
        Circle circle = circleRepository.findById(circleId)
                .orElseThrow(() -> new RuntimeException("Circle not found"));

        if (!circle.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only the circle creator can conclude it");
        }

        if ("archive".equals(action)) {
            circle.setStatus(CircleStatus.ARCHIVED);
            circleRepository.save(circle);
        } else if ("extend".equals(action)) {
            if (newEndDate == null) {
                throw new RuntimeException("New end date is required for extend");
            }
            List<Goal> goals = goalRepository.findByCircleId(circleId);
            if (!goals.isEmpty()) {
                Goal goal = goals.get(0);
                goal.setEndDate(newEndDate);
                goalRepository.save(goal);
            }
            circle.setStatus(CircleStatus.ACTIVE);
            circleRepository.save(circle);
        } else {
            throw new RuntimeException("Invalid action — must be 'archive' or 'extend'");
        }

        return buildCircleResponse(circle);
    }

    // ── Archived circles for current user ──

    public List<CircleResponse> getArchivedCircles() {
        User currentUser = getCurrentUser();
        List<CircleMember> memberships =
                circleMemberRepository.findByUserId(currentUser.getId());

        return memberships.stream()
                .map(m -> m.getCircle())
                .filter(c -> c.getStatus() == CircleStatus.ARCHIVED)
                .map(this::buildCircleResponse)
                .collect(Collectors.toList());
    }

    // ── Circle stats (for conclusion overlay) ──

    public Map<String, Object> getCircleStats(Long circleId) {
        circleRepository.findById(circleId)
                .orElseThrow(() -> new RuntimeException("Circle not found"));

        List<CircleMember> members = circleMemberRepository.findByCircleId(circleId);

        // Total check-ins across all members — derived from existing findByCircleId queries
        long totalCheckins = members.stream()
                .mapToLong(m -> checkinRepository
                        .findByUserIdAndCircleId(m.getUser().getId(), circleId).size())
                .sum();

        // Best streak across all members
        int bestStreak = members.stream()
                .mapToInt(m -> {
                    var streak = streakRepository
                            .findByUserIdAndCircleId(m.getUser().getId(), circleId)
                            .orElse(null);
                    return streak != null ? streak.getLongestStreak() : 0;
                })
                .max()
                .orElse(0);

        // Total badges awarded
        long badgesAwarded = badgeRepository.findByCircleId(circleId).size();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCheckins", totalCheckins);
        stats.put("bestStreak", bestStreak);
        stats.put("badgesAwarded", badgesAwarded);
        stats.put("memberCount", members.size());

        return stats;
    }

    // ── Leaderboard ──

    public List<LeaderboardEntry> getLeaderboard(Long circleId) {
        Circle circle = circleRepository.findById(circleId)
                .orElseThrow(() -> new RuntimeException("Circle not found"));

        List<CircleMember> members = circleMemberRepository.findByCircleId(circleId);
        LocalDate today = LocalDate.now();

        List<LeaderboardEntry> entries = members.stream().map(member -> {
            var user = member.getUser();

            var streak = streakRepository.findByUserIdAndCircleId(user.getId(), circleId)
                    .orElse(null);
            int currentStreak = streak != null ? streak.getCurrentStreak() : 0;
            int longestStreak = streak != null ? streak.getLongestStreak() : 0;

            var tasks = circleTaskRepository
                    .findByCircleIdAndUserIdOrderByDisplayOrderAsc(circleId, user.getId());
            List<Long> taskIds = tasks.stream()
                    .map(t -> t.getId()).collect(Collectors.toList());
            long completedToday = taskIds.isEmpty() ? 0 :
                    taskCheckinRepository.findByUserIdAndTaskIdIn(user.getId(), taskIds)
                            .stream()
                            .filter(tc -> tc.getCheckinDate().equals(today) && tc.getCompleted())
                            .count();
            int completionPct = tasks.isEmpty() ? 0 :
                    (int) ((completedToday * 100) / tasks.size());

            boolean thresholdMet = tasks.isEmpty() ? false : switch (circle.getCompletionThreshold()) {
                case ANY_TASK -> completedToday > 0;
                case HALF -> completionPct >= 50;
                case ALL_TASKS -> completionPct == 100;
                case CUSTOM -> completionPct >= (circle.getCustomThresholdPercent() != null ?
                        circle.getCustomThresholdPercent() : 100);
            };

            int badgeCount = (int) badgeRepository.findByCircleId(circleId)
                    .stream()
                    .filter(b -> b.getUser().getId().equals(user.getId()))
                    .count();

            return new LeaderboardEntry(0, user.getUsername(), currentStreak,
                    longestStreak, completionPct, badgeCount, thresholdMet);
        }).collect(Collectors.toList());

        entries.sort((a, b) -> {
            if (!b.getCurrentStreak().equals(a.getCurrentStreak()))
                return b.getCurrentStreak() - a.getCurrentStreak();
            if (!b.getTodayCompletionPercent().equals(a.getTodayCompletionPercent()))
                return b.getTodayCompletionPercent() - a.getTodayCompletionPercent();
            return b.getLongestStreak() - a.getLongestStreak();
        });

        for (int i = 0; i < entries.size(); i++) {
            entries.set(i, new LeaderboardEntry(
                    i + 1,
                    entries.get(i).getUsername(),
                    entries.get(i).getCurrentStreak(),
                    entries.get(i).getLongestStreak(),
                    entries.get(i).getTodayCompletionPercent(),
                    entries.get(i).getTotalBadges(),
                    entries.get(i).getThresholdMetToday()
            ));
        }

        return entries;
    }

    // ── Internal builder ──

    private CircleResponse buildCircleResponse(Circle circle) {
        List<CircleMember> members =
                circleMemberRepository.findByCircleId(circle.getId());

        List<CircleResponse.MemberInfo> memberInfos = members.stream()
                .map(m -> new CircleResponse.MemberInfo(
                        m.getUser().getUsername(),
                        m.getUser().getEmail(),
                        m.getJoinedAt()
                ))
                .collect(Collectors.toList());

        List<Goal> goals = circle.getGoals();
        if (goals == null || goals.isEmpty()) {
            goals = goalRepository.findByCircleId(circle.getId());
        }
        Goal goal = goals.isEmpty() ? null : goals.get(0);

        CircleResponse.Builder builder = CircleResponse.builder()
                .id(circle.getId())
                .name(circle.getName())
                .inviteCode(circle.getInviteCode())
                .createdBy(circle.getCreatedBy().getUsername())
                .createdAt(circle.getCreatedAt())
                .status(circle.getStatus())
                .members(memberInfos)
                .completionThreshold(circle.getCompletionThreshold())
                .customThresholdPercent(circle.getCustomThresholdPercent());

        if (goal != null) {
            builder.goalTitle(goal.getTitle())
                    .goalDescription(goal.getDescription())
                    .goalCategory(goal.getCategory())
                    .goalStartDate(goal.getStartDate())
                    .goalEndDate(goal.getEndDate());
        }

        return builder.build();
    }
}