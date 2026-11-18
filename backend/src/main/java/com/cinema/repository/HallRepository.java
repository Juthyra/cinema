package com.cinema.repository;

import com.cinema.domain.Hall;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HallRepository extends JpaRepository<Hall, Long> {

    Optional<Hall> findByName(String name);

    List<Hall> findAllByOrderByIdAsc();
}
