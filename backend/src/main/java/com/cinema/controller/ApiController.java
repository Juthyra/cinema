package com.cinema.controller;

import com.cinema.dto.Dtos.AdminBookingsDto;
import com.cinema.dto.Dtos.AdminMoviesDto;
import com.cinema.dto.Dtos.HallLayoutDto;
import com.cinema.dto.Dtos.HallStatusDto;
import com.cinema.dto.Dtos.HallStatusRequest;
import com.cinema.dto.Dtos.HallsAdminDto;
import com.cinema.dto.Dtos.MovieDto;
import com.cinema.dto.Dtos.ReservationDto;
import com.cinema.dto.Dtos.ReserveRequest;
import com.cinema.dto.Dtos.SeatMapDto;
import com.cinema.service.CinemaService;
import com.cinema.service.HallService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class ApiController {

    private final CinemaService service;
    private final HallService hallService;

    public ApiController(CinemaService service, HallService hallService) {
        this.service = service;
        this.hallService = hallService;
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

    /** Admin: all halls with status and how many movies/showtimes they have on a date (default today). */
    @GetMapping("/admin/halls")
    public HallsAdminDto adminHalls(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return hallService.getHalls(date);
    }

    /** Admin: the empty seat layout of one hall. */
    @GetMapping("/admin/halls/{id}/layout")
    public HallLayoutDto adminHallLayout(@PathVariable Long id) {
        return hallService.getLayout(id);
    }

    /** Admin: set a hall ACTIVE / MAINTENANCE / CLOSED. */
    @PutMapping("/admin/halls/{id}/status")
    public HallStatusDto adminHallStatus(@PathVariable Long id, @RequestBody HallStatusRequest request) {
        return new HallStatusDto(id, hallService.setStatus(id, request.status()).name());
    }

    /** Admin: per-movie booking stats + customer lists. */
    @GetMapping("/admin/movies")
    public AdminMoviesDto adminMovies() {
        return service.getAdminMovieStats();
    }
}
