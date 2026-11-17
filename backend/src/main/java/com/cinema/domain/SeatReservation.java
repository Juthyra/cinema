package com.cinema.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDateTime;

@Entity
@Table(name = "seat_reservations",
        uniqueConstraints = @UniqueConstraint(name = "uk_showtime_seat",
                columnNames = {"showtime_id", "seat_row", "seat_number"}))
public class SeatReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "showtime_id")
    private Showtime showtime;

    @Column(name = "seat_row", nullable = false, length = 2)
    private String seatRow;

    @Column(name = "seat_number", nullable = false)
    private int seatNumber;

    @Column(name = "customer_name", nullable = false, length = 100)
    private String customerName;

    @Column(name = "customer_email", nullable = false, length = 200)
    private String customerEmail;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected SeatReservation() {
    }

    public SeatReservation(Showtime showtime, String seatRow, int seatNumber,
                           String customerName, String customerEmail) {
        this.showtime = showtime;
        this.seatRow = seatRow;
        this.seatNumber = seatNumber;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Showtime getShowtime() { return showtime; }
    public String getSeatRow() { return seatRow; }
    public int getSeatNumber() { return seatNumber; }
    public String getCustomerName() { return customerName; }
    public String getCustomerEmail() { return customerEmail; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
