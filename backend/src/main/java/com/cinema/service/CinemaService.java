package com.cinema.service;

import com.cinema.domain.Movie;
import com.cinema.domain.SeatReservation;
import com.cinema.domain.Showtime;
import com.cinema.dto.Dtos.MovieDto;
import com.cinema.dto.Dtos.ReservationDto;
import com.cinema.dto.Dtos.ReserveRequest;
import com.cinema.dto.Dtos.SeatInfo;
import com.cinema.dto.Dtos.SeatMapDto;
import com.cinema.dto.Dtos.SeatRef;
import com.cinema.dto.Dtos.ShowtimeInfo;
import com.cinema.repository.MovieRepository;
import com.cinema.repository.SeatReservationRepository;
import com.cinema.repository.ShowtimeRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class CinemaService {

    public static final List<String> ROWS = List.of("A", "B", "C", "D", "E", "F", "G", "H");
    public static final int SEATS_PER_ROW = 10;
    public static final int MAX_SEATS_PER_BOOKING = 4;

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final MovieRepository movies;
    private final ShowtimeRepository showtimes;
    private final SeatReservationRepository reservations;

    public CinemaService(MovieRepository movies, ShowtimeRepository showtimes,
                         SeatReservationRepository reservations) {
        this.movies = movies;
        this.showtimes = showtimes;
        this.reservations = reservations;
    }

    @Transactional(readOnly = true)
    public List<MovieDto> getMovies() {
        List<Movie> all = movies.findAll();
        all.sort(Comparator.comparing(Movie::getTitle, String.CASE_INSENSITIVE_ORDER));
        List<MovieDto> result = new ArrayList<>();
        for (Movie movie : all) {
            List<ShowtimeInfo> infos = movie.getShowtimes().stream()
                    .sorted(Comparator.comparing(Showtime::getStartsAt))
                    .map(s -> new ShowtimeInfo(s.getId(), s.getHall(), s.getStartsAt().format(ISO)))
                    .toList();
            result.add(new MovieDto(movie.getId(), movie.getTitle(), movie.getGenre(),
                    movie.getDurationMinutes(), movie.getDescription(), infos));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public SeatMapDto getSeatMap(Long showtimeId) {
        Showtime showtime = findShowtime(showtimeId);
        Map<String, String> takenNames = new HashMap<>();
        for (SeatReservation r : reservations.findByShowtimeId(showtimeId)) {
            takenNames.put(r.getSeatRow() + r.getSeatNumber(), r.getCustomerName());
        }
        List<SeatInfo> seats = new ArrayList<>();
        for (String row : ROWS) {
            for (int number = 1; number <= SEATS_PER_ROW; number++) {
                String name = takenNames.get(row + number);
                seats.add(new SeatInfo(row, number, name != null, name));
            }
        }
        return new SeatMapDto(showtimeId, showtime.getMovie().getTitle(), showtime.getHall(),
                showtime.getStartsAt().format(ISO), ROWS, SEATS_PER_ROW, seats);
    }

    @Transactional
    public List<ReservationDto> reserve(ReserveRequest request) {
        Showtime showtime = findShowtime(request.showtimeId());
        validate(request);

        List<SeatReservation> toSave = new ArrayList<>();
        for (SeatRef ref : request.seats()) {
            toSave.add(new SeatReservation(showtime, ref.row().toUpperCase(), ref.seatNumber(),
                    request.customerName(), request.customerEmail()));
        }
        try {
            for (SeatReservation r : toSave) {
                reservations.saveAndFlush(r);
            }
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "One or more of those seats were just taken. Please pick different seats.");
        }
        return toSave.stream()
                .map(r -> new ReservationDto(r.getId(), request.showtimeId(), r.getSeatRow(),
                        r.getSeatNumber(), r.getCustomerName(), r.getCustomerEmail()))
                .toList();
    }

    private Showtime findShowtime(Long showtimeId) {
        return showtimes.findById(showtimeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Showtime not found"));
    }

    private void validate(ReserveRequest request) {
        if (request.showtimeId() == null) {
            throw badRequest("showtimeId is required");
        }
        if (request.seats() == null || request.seats().isEmpty()) {
            throw badRequest("Please pick at least one seat");
        }
        if (request.seats().size() > MAX_SEATS_PER_BOOKING) {
            throw badRequest("You can book at most " + MAX_SEATS_PER_BOOKING + " seats at once");
        }
        if (request.customerName() == null || request.customerName().isBlank()) {
            throw badRequest("Name is required");
        }
        if (request.customerEmail() == null || !request.customerEmail().contains("@")) {
            throw badRequest("A valid email is required");
        }
        Set<String> seen = new HashSet<>();
        for (SeatRef ref : request.seats()) {
            if (ref.row() == null || !ROWS.contains(ref.row().toUpperCase())) {
                throw badRequest("Invalid seat row: " + ref.row());
            }
            if (ref.seatNumber() < 1 || ref.seatNumber() > SEATS_PER_ROW) {
                throw badRequest("Invalid seat number: " + ref.seatNumber());
            }
            if (!seen.add(ref.row().toUpperCase() + ref.seatNumber())) {
                throw badRequest("Duplicate seat in request");
            }
        }
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
