package com.cinema.repository;

import com.cinema.domain.Movie;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MovieRepository extends JpaRepository<Movie, Long> {

    /** Titles are unique, case-insensitively, so the admin cannot add a duplicate. */
    Optional<Movie> findByTitleIgnoreCase(String title);
}
