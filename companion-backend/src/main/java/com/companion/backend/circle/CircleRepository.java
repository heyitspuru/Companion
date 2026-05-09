package com.companion.backend.circle;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CircleRepository extends JpaRepository<Circle, Long> {
    List<Circle> findByCreatedById(Long userId);
    Optional<Circle> findByInviteCode(String inviteCode);
}