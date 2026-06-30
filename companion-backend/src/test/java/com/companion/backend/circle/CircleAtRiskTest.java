package com.companion.backend.circle;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Deterministic checks for the squad-clock helpers added in Phase 2 (the rally). */
class CircleAtRiskTest {

    @Test
    void atRiskWindowOpensTwoHoursBeforeCutoff() {
        Circle c = new Circle();
        c.setDailyCutoff(LocalTime.of(21, 0)); // window opens at 19:00

        assertFalse(c.isPastAtRiskWindow(LocalTime.of(18, 59)), "before the window → not at risk");
        assertTrue(c.isPastAtRiskWindow(LocalTime.of(19, 0)), "exactly at window open → at risk");
        assertTrue(c.isPastAtRiskWindow(LocalTime.of(20, 30)), "inside the window → at risk");
        assertTrue(c.isPastAtRiskWindow(LocalTime.of(22, 0)), "past the cutoff → still at risk");
    }

    @Test
    void cutoffDefaultsTo21WhenUnset() {
        Circle c = new Circle();
        c.setDailyCutoff(null);
        assertFalse(c.isPastAtRiskWindow(LocalTime.of(18, 59)));
        assertTrue(c.isPastAtRiskWindow(LocalTime.of(19, 0)));
    }

    @Test
    void zoneIdFallsBackToUtcAndDrivesToday() {
        Circle c = new Circle(); // no timezone set
        assertEquals("UTC", c.zoneId().getId());
        assertEquals(LocalDate.now(c.zoneId()), c.today());

        c.setTimezone("Asia/Kolkata");
        assertEquals("Asia/Kolkata", c.zoneId().getId());
    }
}
