package com.cinema.controller;

import com.cinema.dto.Dtos.AdminBookingsDto;
import com.cinema.dto.Dtos.AdminMoviesDto;
import com.cinema.dto.Dtos.MovieDto;
import com.cinema.dto.Dtos.MovieRequest;
import com.cinema.dto.Dtos.ReservationDto;
import com.cinema.dto.Dtos.ReserveRequest;
import com.cinema.dto.Dtos.SeatMapDto;
import com.cinema.service.CinemaService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class ApiController {

    private final CinemaService service;

    public ApiController(CinemaService service) {
        this.service = service;
    }

    /** All movies with their upcoming showtimes. */
    @GetMapping("/movies")
    public List<MovieDto> movies() {
        return service.getMovies();
    }

    /** Seat map (available / taken) for one showtime. */
    @GetMapping("/showtimes/{id}/seats")
    public SeatMapDto seats(@PathVariable Long id) {
        return service.getSeatMap(id);
    }

    /** Book 1-4 seats for one showtime; all-or-nothing. */
    @PostMapping("/reservations")
    public List<ReservationDto> reserve(@RequestBody ReserveRequest request) {
        return service.reserve(request);
    }

    /** Admin: all bookings grouped by showtime + customer, with totals. */
    @GetMapping("/admin/bookings")
    public AdminBookingsDto adminBookings() {
        return service.getAdminBookings();
    }

    /** Admin: add a movie. */
    @PostMapping("/admin/movies")
    @ResponseStatus(HttpStatus.CREATED)
    public MovieDto createMovie(@RequestBody MovieRequest request) {
        return service.createMovie(request);
    }

    /** Admin: edit a movie. */
    @PutMapping("/admin/movies/{id}")
    public MovieDto updateMovie(@PathVariable Long id, @RequestBody MovieRequest request) {
        return service.updateMovie(id, request);
    }

    /** Admin: delete a movie - only allowed while nothing is booked for it. */
    @DeleteMapping("/admin/movies/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMovie(@PathVariable Long id) {
        service.deleteMovie(id);
    }

    /** Admin: per-movie booking stats + customer lists. */
    @GetMapping("/admin/movies")
    public AdminMoviesDto adminMovies() {
        return service.getAdminMovieStats();
    }
}
