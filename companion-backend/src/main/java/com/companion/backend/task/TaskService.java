package com.companion.backend.task;

import com.companion.backend.circle.Circle;
import com.companion.backend.circle.CircleMemberRepository;
import com.companion.backend.circle.CircleRepository;
import com.companion.backend.common.ForbiddenException;
import com.companion.backend.common.NotFoundException;
import com.companion.backend.user.CurrentUserProvider;
import com.companion.backend.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.companion.backend.checkin.Streak;
import com.companion.backend.checkin.StreakRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TaskService {
    private final CircleTaskRepository circleTaskRepository;
    private final TaskCheckinRepository taskCheckinRepository;
    private final CircleRepository circleRepository;
    private final CircleMemberRepository circleMemberRepository;
    private final CurrentUserProvider currentUserProvider;
    private final StreakRepository streakRepository;
    private final com.companion.backend.circle.RallyRepository rallyRepository;

    public TaskService(CircleTaskRepository circleTaskRepository,
                       TaskCheckinRepository taskCheckinRepository,
                       CircleRepository circleRepository,
                       CircleMemberRepository circleMemberRepository,
                       CurrentUserProvider currentUserProvider,
                       StreakRepository streakRepository,
                       com.companion.backend.circle.RallyRepository rallyRepository) {
        this.circleTaskRepository = circleTaskRepository;
        this.taskCheckinRepository = taskCheckinRepository;
        this.circleRepository = circleRepository;
        this.circleMemberRepository = circleMemberRepository;
        this.currentUserProvider = currentUserProvider;
        this.streakRepository = streakRepository;
        this.rallyRepository = rallyRepository;
    }

    private User getCurrentUser() {
        return currentUserProvider.getCurrentUser();
    }

    // Add a task to a circle
    public TaskResponse addTask(Long circleId, String title) {
        User user = getCurrentUser();
        Circle circle = circleRepository.findById(circleId)
                .orElseThrow(() -> new NotFoundException("Circle not found"));

        if (!circleMemberRepository.existsByCircleIdAndUserId(circleId, user.getId())) {
            throw new ForbiddenException("Not a member of this circle");
        }

        List<CircleTask> existing = circleTaskRepository
                .findByCircleIdAndUserIdOrderByDisplayOrderAsc(circleId, user.getId());

        // Next slot = highest existing order + 1, so deletions (which leave gaps)
        // never cause a new task to collide with a surviving one.
        int nextOrder = existing.stream()
                .map(CircleTask::getDisplayOrder)
                .filter(java.util.Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(0) + 1;

        CircleTask task = CircleTask.builder()
                .circle(circle)
                .user(user)
                .title(title)
                .displayOrder(nextOrder)
                .build();

        circleTaskRepository.save(task);
        return buildTaskResponse(task, false);
    }

    // Delete a task
    @Transactional
    public void deleteTask(Long taskId) {
        User user = getCurrentUser();
        circleTaskRepository.deleteByIdAndUserId(taskId, user.getId());
    }

    // Get my tasks for a circle with today's completion status
    public List<TaskResponse> getMyTasks(Long circleId) {
        User user = getCurrentUser();
        List<CircleTask> tasks = circleTaskRepository
                .findByCircleIdAndUserIdOrderByDisplayOrderAsc(circleId, user.getId());

        Circle circle = circleRepository.findById(circleId)
                .orElseThrow(() -> new NotFoundException("Circle not found"));
        LocalDate today = circle.today();
        List<Long> taskIds = tasks.stream().map(CircleTask::getId).collect(Collectors.toList());
        List<TaskCheckin> todayCheckins = taskCheckinRepository
                .findByUserIdAndTaskIdIn(user.getId(), taskIds)
                .stream()
                .filter(tc -> tc.getCheckinDate().equals(today))
                .collect(Collectors.toList());

        return tasks.stream().map(task -> {
            boolean completed = todayCheckins.stream()
                    .anyMatch(tc -> tc.getTask().getId().equals(task.getId()) && tc.getCompleted());
            return buildTaskResponse(task, completed);
        }).collect(Collectors.toList());
    }

    //Update my Tasks
    public TaskResponse updateTask(Long taskId, String newTitle) {
        User user = getCurrentUser();
        CircleTask task = circleTaskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Task not found"));

        if (!task.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Not your task");
        }

        task.setTitle(newTitle.trim());
        circleTaskRepository.save(task);

        return buildTaskResponse(task, false);
    }

    // Toggle a task completion for today
    public TaskCheckinResponse toggleTask(Long taskId) {
        User user = getCurrentUser();
        CircleTask task = circleTaskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Task not found"));

        if (!task.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Not your task");
        }

        Long circleId = task.getCircle().getId();
        Circle circle = circleRepository.findById(circleId)
                .orElseThrow(() -> new NotFoundException("Circle not found"));

        // "Today" is the squad's day, not the server's.
        LocalDate today = circle.today();
        var existing = taskCheckinRepository
                .findByTaskIdAndUserIdAndCheckinDate(taskId, user.getId(), today);

        TaskCheckin checkin;
        if (existing.isPresent()) {
            checkin = existing.get();
            checkin.setCompleted(!checkin.getCompleted());
            taskCheckinRepository.save(checkin);
        } else {
            checkin = TaskCheckin.builder()
                    .task(task)
                    .user(user)
                    .checkinDate(today)
                    .completed(true)
                    .build();
            taskCheckinRepository.save(checkin);
        }

        List<CircleTask> allTasks = circleTaskRepository
                .findByCircleIdAndUserIdOrderByDisplayOrderAsc(circleId, user.getId());
        List<Long> taskIds = allTasks.stream()
                .map(CircleTask::getId).collect(Collectors.toList());

        long completedCount = taskCheckinRepository
                .findByUserIdAndTaskIdIn(user.getId(), taskIds)
                .stream()
                .filter(tc -> tc.getCheckinDate().equals(today) && tc.getCompleted())
                .count();

        int completionPercent = allTasks.isEmpty() ? 0 :
                (int) ((completedCount * 100) / allTasks.size());

        // Check threshold and update streak
        boolean thresholdMet = !allTasks.isEmpty()
                && circle.isThresholdMet(completedCount, completionPercent);

        updateStreakIfThresholdMet(user, circle, today, thresholdMet);

        // Shared fate: recompute the squad streak after this member's change.
        updateSquadStreak(circle, today);

        return new TaskCheckinResponse(
                taskId,
                checkin.getCompleted(),
                completionPercent,
                (int) completedCount,
                allTasks.size()
        );
    }

    private void updateStreakIfThresholdMet(User user, Circle circle,
                                            LocalDate today, boolean thresholdMet) {
        Streak streak = streakRepository
                .findByUserIdAndCircleId(user.getId(), circle.getId())
                .orElse(Streak.builder()
                        .user(user)
                        .circle(circle)
                        .currentStreak(0)
                        .longestStreak(0)
                        .build());

        // Track "did the task-threshold mechanism already count today?" via a
        // dedicated field — NOT updatedAt, which the daily check-in flow also
        // bumps and would otherwise let this code clobber a check-in streak.
        boolean countedTodayHere = today.equals(streak.getLastThresholdDate());

        if (thresholdMet) {
            if (!countedTodayHere) {
                LocalDate yesterday = today.minusDays(1);
                boolean hadYesterday = yesterday.equals(streak.getLastThresholdDate());

                if (hadYesterday || streak.getCurrentStreak() == 0) {
                    streak.setCurrentStreak(streak.getCurrentStreak() + 1);
                } else {
                    streak.setCurrentStreak(1);
                }

                if (streak.getCurrentStreak() > streak.getLongestStreak()) {
                    streak.setLongestStreak(streak.getCurrentStreak());
                }
                streak.setLastThresholdDate(today);
                streakRepository.save(streak);
            }
        } else {
            // Threshold no longer met — roll back ONLY the increment this
            // mechanism itself applied today (guarded by lastThresholdDate).
            if (countedTodayHere && streak.getCurrentStreak() > 0) {
                streak.setCurrentStreak(Math.max(0, streak.getCurrentStreak() - 1));
                streak.setLastThresholdDate(null);
                streakRepository.save(streak);
            }
        }
    }

    // A "squad day" is complete only when EVERY member hits their threshold
    // (unanimous rule — see PRODUCT.md §9). Mirrors the per-member streak's lazy
    // increment/rollback so toggling a task off the same day reverses today's gain.
    private void updateSquadStreak(Circle circle, LocalDate today) {
        boolean allMet = allMembersMetThreshold(circle, today);

        LocalDate last = circle.getSquadLastCompleteDate();
        boolean countedToday = today.equals(last);

        if (allMet) {
            if (!countedToday) {
                boolean hadYesterday = today.minusDays(1).equals(last);
                if (hadYesterday || circle.getSquadCurrentStreak() == 0) {
                    circle.setSquadCurrentStreak(circle.getSquadCurrentStreak() + 1);
                } else {
                    circle.setSquadCurrentStreak(1);
                }
                if (circle.getSquadCurrentStreak() > circle.getSquadLongestStreak()) {
                    circle.setSquadLongestStreak(circle.getSquadCurrentStreak());
                }
                circle.setSquadLastCompleteDate(today);
                circleRepository.save(circle);
            }
        } else if (countedToday && circle.getSquadCurrentStreak() > 0) {
            // Was complete earlier today, now broken — undo today's increment only.
            circle.setSquadCurrentStreak(circle.getSquadCurrentStreak() - 1);
            circle.setSquadLastCompleteDate(null);
            circleRepository.save(circle);
        }
    }

    private boolean allMembersMetThreshold(Circle circle, LocalDate today) {
        var members = circleMemberRepository.findByCircleId(circle.getId());
        if (members.isEmpty()) return false;

        for (var member : members) {
            User u = member.getUser();
            List<CircleTask> tasks = circleTaskRepository
                    .findByCircleIdAndUserIdOrderByDisplayOrderAsc(circle.getId(), u.getId());
            if (tasks.isEmpty()) return false; // a member with no tasks can't have shown up

            List<Long> taskIds = tasks.stream().map(CircleTask::getId).collect(Collectors.toList());
            long completed = taskCheckinRepository
                    .findByUserIdAndTaskIdIn(u.getId(), taskIds)
                    .stream()
                    .filter(tc -> tc.getCheckinDate().equals(today) && tc.getCompleted())
                    .count();
            int pct = (int) ((completed * 100) / tasks.size());

            if (!circle.isThresholdMet(completed, pct)) return false;
        }
        return true;
    }

    // Get all members' task completion for today in a circle, plus rally state.
    public List<MemberTaskSummary> getCircleTaskSummary(Long circleId) {
        Circle circle = circleRepository.findById(circleId)
                .orElseThrow(() -> new NotFoundException("Circle not found"));

        final LocalDate today = circle.today();
        final boolean dayRunningOut = circle.isPastAtRiskWindow();

        // Today's rallies, grouped by who was backed → drives "X has your back".
        Map<String, List<String>> backersByTarget = rallyRepository
                .findByCircleIdAndRallyDate(circleId, today)
                .stream()
                .collect(Collectors.groupingBy(
                        r -> r.getToUser().getUsername(),
                        Collectors.mapping(r -> r.getFromUser().getUsername(), Collectors.toList())));

        return circleMemberRepository.findByCircleId(circleId).stream()
                .map(member -> {
                    User u = member.getUser();
                    List<CircleTask> tasks = circleTaskRepository
                            .findByCircleIdAndUserIdOrderByDisplayOrderAsc(circleId, u.getId());
                    List<Long> taskIds = tasks.stream().map(CircleTask::getId).collect(Collectors.toList());

                    long completed = taskCheckinRepository
                            .findByUserIdAndTaskIdIn(u.getId(), taskIds)
                            .stream()
                            .filter(tc -> tc.getCheckinDate().equals(today) && tc.getCompleted())
                            .count();

                    int pct = tasks.isEmpty() ? 0 : (int) ((completed * 100) / tasks.size());

                    boolean thresholdMet = circle.isThresholdMet(completed, pct);
                    // At risk = has tasks, hasn't reported in, and the day is running out.
                    boolean atRisk = !tasks.isEmpty() && !thresholdMet && dayRunningOut;

                    List<String> backedBy = backersByTarget.getOrDefault(u.getUsername(), List.of());

                    return new MemberTaskSummary(
                            u.getUsername(),
                            (int) completed,
                            tasks.size(),
                            pct,
                            thresholdMet,
                            atRisk,
                            !backedBy.isEmpty(),
                            backedBy
                    );
                })
                .collect(Collectors.toList());
    }

    private TaskResponse buildTaskResponse(CircleTask task, boolean completedToday) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDisplayOrder(),
                completedToday
        );
    }
}