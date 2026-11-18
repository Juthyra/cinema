package com.cinema.repository;

import com.cinema.domain.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {

    List<Showtime> findByMovieId(Long movieId);

    /** Showtimes starting in [from, to). */
    List<Showtime> findByStartsAtBetween(LocalDateTime from, LocalDateTime to);
}
