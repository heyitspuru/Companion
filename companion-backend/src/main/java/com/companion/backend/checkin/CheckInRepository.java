package com.companion.backend.checkin;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
public interface CheckInRepository extends JpaRepository<CheckIn, Long> {
    @Modifying
    @Transactional
    void deleteByCircleId(Long circleId);
    Optional<CheckIn> findByUserIdAndCircleIdAndCheckinDate(
            Long userId, Long circleId, LocalDate date);
    long countByCircleId(Long circleId);
    List<CheckIn> findByUserIdAndCircleId(Long userId, Long circleId);
    List<CheckIn> findByCircleIdAndCheckinDate(Long circleId, LocalDate date);
}