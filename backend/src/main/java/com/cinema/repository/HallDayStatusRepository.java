package com.cinema.repository;

import com.cinema.domain.HallDayStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HallDayStatusRepository extends JpaRepository<HallDayStatus, Long> {

    List<HallDayStatus> findByDate(LocalDate date);

    Optional<HallDayStatus> findByHallIdAndDate(Long hallId, LocalDate date);
}
