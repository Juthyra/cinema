package com.cinema.repository;

import com.cinema.domain.SeatReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SeatReservationRepository extends JpaRepository<SeatReservation, Long> {

    List<SeatReservation> findByShowtimeId(Long showtimeId);

    /** Seats taken per showtime in one query - the movie grid shows what is left. */
    @Query("select r.showtime.id as showtimeId, count(r) as taken from SeatReservation r "
            + "group by r.showtime.id")
    List<SeatsTaken> countSeatsTakenByShowtime();

    interface SeatsTaken {
        Long getShowtimeId();

        long getTaken();
    }
}
