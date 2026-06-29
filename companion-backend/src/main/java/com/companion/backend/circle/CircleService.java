package com.companion.backend.circle;

import com.companion.backend.goal.Goal;
import com.companion.backend.goal.GoalRepository;
import com.companion.backend.common.BadRequestException;
import com.companion.backend.common.ConflictException;
import com.companion.backend.common.ForbiddenException;
import com.companion.backend.common.NotFoundException;
import com.companion.backend.user.CurrentUserProvider;
import com.companion.backend.user.User;
import com.companion.backend.badge.BadgeRepository;
import com.companion.backend.checkin.StreakRepository;
import com.companion.backend.checkin.CheckInRepository;
import com.companion.backend.task.CircleTaskRepository;
import com.companion.backend.task.TaskCheckinRepository;
import com.companion.backend.task.CircleTask;

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

    // A squad is a fireteam, not a club. Capped small on purpose: big enough for
    // a band, small enough that every absence is felt (no diffusion of
    // responsibility). See PRODUCT.md.
    private static final int MAX_SQUAD_SIZE = 5;

    private final CircleRepository circleRepository;
    private final CircleMemberRepository circleMemberRepository;
    private final GoalRepository goalRepository;
    private final CurrentUserProvider currentUserProvider;
    private final StreakRepository streakRepository;
    private final BadgeRepository badgeRepository;
    private final CircleTaskRepository circleTaskRepository;
    private final TaskCheckinRepository taskCheckinRepository;
    private final CheckInRepository checkinRepository;

    public CircleService(CircleRepository circleRepository,
                         CircleMemberRepository circleMemberRepository,
                         GoalRepository goalRepository,
                         CurrentUserProvider currentUserProvider,
                         StreakRepository streakRepository,
                         BadgeRepository badgeRepository,
                         CircleTaskRepository circleTaskRepository,
                         TaskCheckinRepository taskCheckinRepository,
                         CheckInRepository checkinRepository) {
        this.circleRepository = circleRepository;
        this.circleMemberRepository = circleMemberRepository;
        this.goalRepository = goalRepository;
        this.currentUserProvider = currentUserProvider;
        this.streakRepository = streakRepository;
        this.badgeRepository = badgeRepository;
        this.circleTaskRepository = circleTaskRepository;
        this.taskCheckinRepository = taskCheckinRepository;
        this.checkinRepository = checkinRepository;
    }

    private User getCurrentUser() {
        return currentUserProvider.getCurrentUser();
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
                .orElseThrow(() -> new NotFoundException("Invalid invite code"));

        if (circle.getStatus() != CircleStatus.ACTIVE) {
            throw new ConflictException("This circle is no longer active");
        }

        if (circleMemberRepository.existsByCircleIdAndUserId(
                circle.getId(), currentUser.getId())) {
            throw new ConflictException("You are already a member of this circle");
        }

        // A squad maxes out at MAX_SQUAD_SIZE — once full, the fireteam is closed.
        if (circleMemberRepository.findByCircleId(circle.getId()).size() >= MAX_SQUAD_SIZE) {
            throw new ConflictException(
                    "This squad is full (" + MAX_SQUAD_SIZE + " is the limit).");
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
        User currentUser = getCurrentUser();
        Circle circle = circleRepository.findById(circleId)
                .orElseThrow(() -> new NotFoundException("Circle not found"));

        if (!circleMemberRepository.existsByCircleIdAndUserId(
                circleId, currentUser.getId())) {
            throw new ForbiddenException("You are not a member of this circle");
        }

        return buildCircleResponse(circle);
    }

    // ── Delete (creator only) ──

    public void deleteCircle(Long circleId) {
        User currentUser = getCurrentUser();
        Circle circle = circleRepository.findById(circleId)
                .orElseThrow(() -> new NotFoundException("Circle not found"));

        if (!circle.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Only the circle creator can delete it");
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
                .orElseThrow(() -> new NotFoundException("Circle not found"));

        if (circle.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new BadRequestException("Creator cannot leave — delete the circle instead");
        }

        CircleMember membership = circleMemberRepository
                .findByCircleIdAndUserId(circleId, currentUser.getId())
                .orElseThrow(() -> new ForbiddenException("You are not a member of this circle"));

        circleMemberRepository.delete(membership);
    }

    // ── Conclude (creator only — archive or extend) ──

    public CircleResponse concludeCircle(Long circleId, String action, LocalDate newEndDate) {
        User currentUser = getCurrentUser();
        Circle circle = circleRepository.findById(circleId)
                .orElseThrow(() -> new NotFoundException("Circle not found"));

        if (!circle.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Only the circle creator can conclude it");
        }

        if ("archive".equals(action)) {
            circle.setStatus(CircleStatus.ARCHIVED);
            circleRepository.save(circle);
        } else if ("extend".equals(action)) {
            if (newEndDate == null) {
                throw new BadRequestException("New end date is required for extend");
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
            throw new BadRequestException("Invalid action — must be 'archive' or 'extend'");
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
        Circle circle = circleRepository.findById(circleId)
                .orElseThrow(() -> new NotFoundException("Circle not found"));

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

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCheckins", totalCheckins);
        stats.put("bestStreak", bestStreak);
        stats.put("squadLongestStreak", circle.getSquadLongestStreak());
        stats.put("memberCount", members.size());

        return stats;
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

        // Live squad streak: the stored value is only "alive" if the squad
        // completed today or yesterday; an intervening missed day breaks it.
        LocalDate last = circle.getSquadLastCompleteDate();
        LocalDate today = LocalDate.now();
        boolean completeToday = today.equals(last);
        boolean alive = last != null && (completeToday || today.minusDays(1).equals(last));
        int liveCurrent = alive ? circle.getSquadCurrentStreak() : 0;

        CircleResponse.Builder builder = CircleResponse.builder()
                .id(circle.getId())
                .name(circle.getName())
                .inviteCode(circle.getInviteCode())
                .createdBy(circle.getCreatedBy().getUsername())
                .createdAt(circle.getCreatedAt())
                .status(circle.getStatus())
                .members(memberInfos)
                .completionThreshold(circle.getCompletionThreshold())
                .customThresholdPercent(circle.getCustomThresholdPercent())
                .squadCurrentStreak(liveCurrent)
                .squadLongestStreak(circle.getSquadLongestStreak())
                .squadCompleteToday(completeToday);

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