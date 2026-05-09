package com.companion.backend.task;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

public interface TaskCheckinRepository extends JpaRepository<TaskCheckin, Long> {
    @Modifying
    @Transactional
    void deleteByTaskIdIn(List<Long> taskIds);
    List<TaskCheckin> findByUserIdAndCheckinDate(Long userId, LocalDate date);
    List<TaskCheckin> findByTaskIdInAndCheckinDate(List<Long> taskIds, LocalDate date);
    Optional<TaskCheckin> findByTaskIdAndUserIdAndCheckinDate(Long taskId, Long userId, LocalDate date);
    List<TaskCheckin> findByUserIdAndTaskIdIn(Long userId, List<Long> taskIds);
}