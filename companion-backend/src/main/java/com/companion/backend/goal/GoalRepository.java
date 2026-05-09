package com.companion.backend.goal;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GoalRepository extends JpaRepository<Goal, Long> {
    List<Goal> findByCircleId(Long circleId);
    List<Goal> findByCircleIdIn(List<Long> circleIds);
}