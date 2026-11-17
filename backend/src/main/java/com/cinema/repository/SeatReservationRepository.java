package com.cinema.repository;

import com.cinema.domain.SeatReservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SeatReservationRepository extends JpaRepository<SeatReservation, Long> {

    List<SeatReservation> findByShowtimeId(Long showtimeId);
}
