package com.companion.backend.circle;

import com.companion.backend.goal.GoalRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
public class CircleConclusionScheduler {

    private final CircleRepository circleRepository;
    private final GoalRepository goalRepository;

    public CircleConclusionScheduler(CircleRepository circleRepository,
                                     GoalRepository goalRepository) {
        this.circleRepository = circleRepository;
        this.goalRepository = goalRepository;
    }

    /**
     * Runs at midnight every day.
     * Finds ACTIVE circles whose goal end date has passed and marks them CONCLUDED.
     * The creator sees the conclusion overlay on next visit and chooses archive or extend.
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void markConcludedCircles() {
        LocalDate today = LocalDate.now();

        List<Circle> activeCircles = circleRepository.findByStatus(CircleStatus.ACTIVE);

        for (Circle circle : activeCircles) {
            List<com.companion.backend.goal.Goal> goals = goalRepository.findByCircleId(circle.getId());
            if (goals.isEmpty()) continue;

            LocalDate endDate = goals.get(0).getEndDate();
            if (endDate != null && !endDate.isAfter(today.minusDays(1))) {
                circle.setStatus(CircleStatus.CONCLUDED);
                circleRepository.save(circle);
                System.out.println("Circle concluded: " + circle.getName() + " (id=" + circle.getId() + ")");
            }
        }
    }
}