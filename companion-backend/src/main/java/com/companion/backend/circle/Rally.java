package com.companion.backend.circle;

import com.companion.backend.user.User;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A rally — one squadmate reaching back to a slipping member ("I've got you").
 * The durable record behind the "X has your back" state on Squad Status.
 */
@Entity
@Table(name = "rally")
public class Rally {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "circle_id", nullable = false)
    private Circle circle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_user_id", nullable = false)
    private User fromUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_user_id", nullable = false)
    private User toUser;

    @Column(name = "rally_date", nullable = false)
    private LocalDate rallyDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Circle getCircle() { return circle; }
    public User getFromUser() { return fromUser; }
    public User getToUser() { return toUser; }
    public LocalDate getRallyDate() { return rallyDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setCircle(Circle circle) { this.circle = circle; }
    public void setFromUser(User fromUser) { this.fromUser = fromUser; }
    public void setToUser(User toUser) { this.toUser = toUser; }
    public void setRallyDate(LocalDate rallyDate) { this.rallyDate = rallyDate; }
}
