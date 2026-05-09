package com.companion.backend.circle;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CircleMemberRepository extends JpaRepository<CircleMember, Long> {
    List<CircleMember> findByUserId(Long userId);
    List<CircleMember> findByCircleId(Long circleId);
    Optional<CircleMember> findByCircleIdAndUserId(Long circleId, Long userId);
    Boolean existsByCircleIdAndUserId(Long circleId, Long userId);
}