package com.companion.backend.badge;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

public interface BadgeRepository extends JpaRepository<Badge, Long> {
    @Modifying
    @Transactional
    void deleteByCircleId(Long circleId);
    List<Badge> findByCircleId(Long circleId);
    List<Badge> findByUserId(Long userId);
    Optional<Badge> findByCircleIdAndWeekStart(Long circleId, LocalDate weekStart);
}