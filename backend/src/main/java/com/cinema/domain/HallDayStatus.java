package com.cinema.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDate;

/**
 * Status of a hall on ONE date. Only non-ACTIVE days are stored; a hall with no row
 * for a date is ACTIVE that day. A hall with showtimes on a date can never be non-ACTIVE.
 */
@Entity
@Table(name = "hall_day_status",
        uniqueConstraints = @UniqueConstraint(name = "uk_hall_day", columnNames = {"hall_id", "day"}))
public class HallDayStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "hall_id")
    private Hall hall;

    @Column(name = "day", nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private HallStatus status;

    protected HallDayStatus() {
    }

    public HallDayStatus(Hall hall, LocalDate date, HallStatus status) {
        this.hall = hall;
        this.date = date;
        this.status = status;
    }

    public Long getId() { return id; }
    public Hall getHall() { return hall; }
    public LocalDate getDate() { return date; }
    public HallStatus getStatus() { return status; }
    public void setStatus(HallStatus status) { this.status = status; }
}
