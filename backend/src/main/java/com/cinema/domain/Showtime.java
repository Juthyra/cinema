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

import java.time.LocalDateTime;

@Entity
@Table(name = "showtimes")
public class Showtime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id")
    private Movie movie;

    private String hall;

    /** Layout of the hall; null (old rows) is treated as STANDARD. */
    @Enumerated(EnumType.STRING)
    @Column(name = "hall_type", length = 20)
    private HallType hallType;

    @Column(nullable = false)
    private LocalDateTime startsAt;

    protected Showtime() {
    }

    public Showtime(Movie movie, String hall, LocalDateTime startsAt) {
        this(movie, hall, HallType.forHallName(hall), startsAt);
    }

    public Showtime(Movie movie, String hall, HallType hallType, LocalDateTime startsAt) {
        this.movie = movie;
        this.hall = hall;
        this.hallType = hallType;
        this.startsAt = startsAt;
    }

    public Long getId() { return id; }
    public Movie getMovie() { return movie; }
    public void setMovie(Movie movie) { this.movie = movie; }
    public String getHall() { return hall; }
    public void setHall(String hall) { this.hall = hall; }
    public HallType getHallType() { return hallType == null ? HallType.STANDARD : hallType; }
    public void setHallType(HallType hallType) { this.hallType = hallType; }
    public LocalDateTime getStartsAt() { return startsAt; }
    public void setStartsAt(LocalDateTime startsAt) { this.startsAt = startsAt; }
}
