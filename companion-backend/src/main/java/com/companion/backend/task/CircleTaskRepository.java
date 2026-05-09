package com.companion.backend.task;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

public interface CircleTaskRepository extends JpaRepository<CircleTask, Long> {
    List<CircleTask> findByCircleIdAndUserIdOrderByDisplayOrderAsc(Long circleId, Long userId);
    List<CircleTask> findByCircleId(Long circleId);
    void deleteByIdAndUserId(Long taskId, Long userId);
    List<CircleTask> findByUserId(Long userId);
    @Modifying
    @Transactional
    void deleteByCircleId(Long circleId);
}