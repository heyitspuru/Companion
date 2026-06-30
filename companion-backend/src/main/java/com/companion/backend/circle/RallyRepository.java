package com.companion.backend.circle;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RallyRepository extends JpaRepository<Rally, Long> {

    List<Rally> findByCircleIdAndRallyDate(Long circleId, LocalDate rallyDate);

    Optional<Rally> findByCircleIdAndFromUserIdAndToUserIdAndRallyDate(
            Long circleId, Long fromUserId, Long toUserId, LocalDate rallyDate);
}
