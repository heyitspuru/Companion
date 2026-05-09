package com.companion.backend.checkin;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

public interface StreakRepository extends JpaRepository<Streak, Long> {
    @Modifying
    @Transactional
    void deleteByCircleId(Long circleId);
    Optional<Streak> findByUserIdAndCircleId(Long userId, Long circleId);
    List<Streak> findByUserId(Long userId);
    List<Streak> findByCircleId(Long circleId);
}