package com.companion.backend.checkin;

import com.companion.backend.circle.Circle;
import com.companion.backend.circle.CircleMemberRepository;
import com.companion.backend.circle.CircleRepository;
import com.companion.backend.user.User;
import com.companion.backend.user.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CheckInService {

    private final CheckInRepository checkInRepository;
    private final StreakRepository streakRepository;
    private final CircleRepository circleRepository;
    private final CircleMemberRepository circleMemberRepository;
    private final UserRepository userRepository;

    public CheckInService(CheckInRepository checkInRepository,
                          StreakRepository streakRepository,
                          CircleRepository circleRepository,
                          CircleMemberRepository circleMemberRepository,
                          UserRepository userRepository) {
        this.checkInRepository = checkInRepository;
        this.streakRepository = streakRepository;
        this.circleRepository = circleRepository;
        this.circleMemberRepository = circleMemberRepository;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public CheckInResponse doCheckIn(Long circleId) {
        User currentUser = getCurrentUser();

        Circle circle = circleRepository.findById(circleId)
                .orElseThrow(() -> new RuntimeException("Circle not found"));

        // Verify user is a member
        if (!circleMemberRepository.existsByCircleIdAndUserId(
                circleId, currentUser.getId())) {
            throw new RuntimeException("You are not a member of this circle");
        }

        LocalDate today = LocalDate.now();

        // Check if already checked in today
        if (checkInRepository.findByUserIdAndCircleIdAndCheckinDate(
                currentUser.getId(), circleId, today).isPresent()) {
            throw new RuntimeException("Already checked in today");
        }

        // Save check-in
        CheckIn checkIn = CheckIn.builder()
                .user(currentUser)
                .circle(circle)
                .checkinDate(today)
                .completed(true)
                .build();
        checkInRepository.save(checkIn);

        // Update streak
        Streak streak = updateStreak(currentUser, circle, today);

        return CheckInResponse.builder()
                .id(checkIn.getId())
                .username(currentUser.getUsername())
                .circleId(circleId)
                .checkinDate(today)
                .completed(true)
                .currentStreak(streak.getCurrentStreak())
                .longestStreak(streak.getLongestStreak())
                .build();
    }

    private Streak updateStreak(User user, Circle circle, LocalDate today) {
        Streak streak = streakRepository
                .findByUserIdAndCircleId(user.getId(), circle.getId())
                .orElse(Streak.builder()
                        .user(user)
                        .circle(circle)
                        .currentStreak(0)
                        .longestStreak(0)
                        .build());

        // Check if yesterday was checked in
        LocalDate yesterday = today.minusDays(1);
        boolean checkedInYesterday = checkInRepository
                .findByUserIdAndCircleIdAndCheckinDate(
                        user.getId(), circle.getId(), yesterday)
                .isPresent();

        if (checkedInYesterday) {
            streak.setCurrentStreak(streak.getCurrentStreak() + 1);
        } else {
            streak.setCurrentStreak(1);
        }

        if (streak.getCurrentStreak() > streak.getLongestStreak()) {
            streak.setLongestStreak(streak.getCurrentStreak());
        }

        streakRepository.save(streak);
        return streak;
    }

    public List<CheckInResponse> getCircleCheckIns(Long circleId) {
        LocalDate today = LocalDate.now();
        List<CheckIn> checkIns = checkInRepository
                .findByCircleIdAndCheckinDate(circleId, today);

        return checkIns.stream()
                .map(c -> {
                    Streak streak = streakRepository
                            .findByUserIdAndCircleId(
                                    c.getUser().getId(), circleId)
                            .orElse(null);

                    return CheckInResponse.builder()
                            .id(c.getId())
                            .username(c.getUser().getUsername())
                            .circleId(circleId)
                            .checkinDate(c.getCheckinDate())
                            .completed(c.getCompleted())
                            .currentStreak(streak != null ?
                                    streak.getCurrentStreak() : 0)
                            .longestStreak(streak != null ?
                                    streak.getLongestStreak() : 0)
                            .build();
                })
                .collect(Collectors.toList());
    }

    public List<CheckInResponse> getMyCheckIns(Long circleId) {
        User currentUser = getCurrentUser();
        List<CheckIn> checkIns = checkInRepository
                .findByUserIdAndCircleId(currentUser.getId(), circleId);

        Streak streak = streakRepository
                .findByUserIdAndCircleId(currentUser.getId(), circleId)
                .orElse(null);

        return checkIns.stream()
                .map(c -> CheckInResponse.builder()
                        .id(c.getId())
                        .username(currentUser.getUsername())
                        .circleId(circleId)
                        .checkinDate(c.getCheckinDate())
                        .completed(c.getCompleted())
                        .currentStreak(streak != null ?
                                streak.getCurrentStreak() : 0)
                        .longestStreak(streak != null ?
                                streak.getLongestStreak() : 0)
                        .build())
                .collect(Collectors.toList());
    }
}