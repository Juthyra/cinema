package com.cinema.service;

import com.cinema.domain.HallType;
import com.cinema.domain.Movie;
import com.cinema.domain.SeatReservation;
import com.cinema.domain.Showtime;
import com.cinema.dto.Dtos.AdminBookingsDto;
import com.cinema.dto.Dtos.AdminMovieStatsDto;
import com.cinema.dto.Dtos.AdminMoviesDto;
import com.cinema.dto.Dtos.AdminTotals;
import com.cinema.dto.Dtos.BookingGroupDto;
import com.cinema.dto.Dtos.MovieCustomerDto;
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
                    .map(s -> new ShowtimeInfo(s.getId(), s.getHall(),
                            s.getHallType().name(), s.getHallType().label(),
                            s.getStartsAt().format(ISO)))
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
        HallLayouts.Layout layout = HallLayouts.of(showtime.getHallType());
        List<SeatInfo> seats = new ArrayList<>();
        for (HallLayouts.SeatSpec spec : layout.seats()) {
            String name = takenNames.get(spec.key());
            seats.add(new SeatInfo(spec.row(), spec.number(), name != null, name,
                    spec.kind(), spec.section(), spec.gapBefore(), TicketPrices.of(spec.kind())));
        }
        HallType type = showtime.getHallType();
        return new SeatMapDto(showtimeId, showtime.getMovie().getTitle(), showtime.getHall(),
                showtime.getStartsAt().format(ISO), type.name(), type.label(), type.description(),
                layout.maxSeats(), layout.rows(), layout.seatsPerRow(), seats);
    }

    @Transactional(readOnly = true)
    public AdminBookingsDto getAdminBookings() {
        Map<Long, Showtime> showtimesById = new HashMap<>();
        for (Showtime st : showtimes.findAll()) {
            showtimesById.put(st.getId(), st);
        }

        // Group reservations: same showtime + same customer = one booking group.
        Map<String, List<SeatReservation>> groups = new HashMap<>();
        for (SeatReservation r : reservations.findAll()) {
            String key = r.getShowtime().getId() + "|" + r.getCustomerName() + "|" + r.getCustomerEmail();
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(r);
        }

        List<BookingGroupDto> list = new ArrayList<>();
        long totalSeats = 0;
        Set<String> customers = new HashSet<>();
        for (List<SeatReservation> rs : groups.values()) {
            SeatReservation first = rs.get(0);
            Showtime st = showtimesById.get(first.getShowtime().getId());
            List<String> seats = rs.stream()
                    .map(r -> r.getSeatRow() + r.getSeatNumber())
                    .sorted()
                    .toList();
            String bookedAt = rs.stream()
                    .map(SeatReservation::getCreatedAt)
                    .min(Comparator.naturalOrder())
                    .map(ISO::format)
                    .orElse("");
            list.add(new BookingGroupDto(st.getId(), st.getMovie().getTitle(), st.getHall(),
                    st.getStartsAt().format(ISO), first.getCustomerName(), first.getCustomerEmail(),
                    seats, bookedAt));
            totalSeats += rs.size();
            customers.add(first.getCustomerEmail());
        }
        list.sort(Comparator.comparing(BookingGroupDto::bookedAt).reversed());
        return new AdminBookingsDto(new AdminTotals(list.size(), totalSeats, customers.size()), list);
    }

    @Transactional(readOnly = true)
    public AdminMoviesDto getAdminMovieStats() {
        List<Movie> allMovies = movies.findAll();

        // movieId -> customerEmail -> reservations for that movie
        Map<Long, Map<String, List<SeatReservation>>> byMovieCustomer = new HashMap<>();
        // distinct (movie, showtime, customer) triples = booking count
        Set<String> bookingGroups = new HashSet<>();
        for (SeatReservation r : reservations.findAll()) {
            Showtime st = r.getShowtime();
            long movieId = st.getMovie().getId();
            byMovieCustomer.computeIfAbsent(movieId, k -> new HashMap<>())
                    .computeIfAbsent(r.getCustomerEmail(), k -> new ArrayList<>())
                    .add(r);
            bookingGroups.add(movieId + "|" + st.getId() + "|" + r.getCustomerEmail());
        }

        List<AdminMovieStatsDto> out = new ArrayList<>();
        for (Movie movie : allMovies) {
            Map<String, List<SeatReservation>> cust =
                    byMovieCustomer.getOrDefault(movie.getId(), Map.of());
            long bookings = bookingGroups.stream()
                    .filter(k -> k.startsWith(movie.getId() + "|"))
                    .count();
            long seatsBooked = cust.values().stream().mapToLong(List::size).sum();

            List<MovieCustomerDto> customerList = new ArrayList<>();
            for (List<SeatReservation> rs : cust.values()) {
                SeatReservation first = rs.get(0);
                List<String> seats = rs.stream()
                        .map(r -> r.getSeatRow() + r.getSeatNumber())
                        .sorted()
                        .toList();
                List<String> showtimes = rs.stream()
                        .map(SeatReservation::getShowtime)
                        .map(Showtime::getStartsAt)
                        .distinct()
                        .sorted()
                        .map(ISO::format)
                        .toList();
                customerList.add(new MovieCustomerDto(first.getCustomerName(),
                        first.getCustomerEmail(), seats, showtimes));
            }
            customerList.sort(Comparator.comparing(MovieCustomerDto::name));
            out.add(new AdminMovieStatsDto(movie.getId(), movie.getTitle(), movie.getGenre(),
                    movie.getDurationMinutes(), movie.getDescription(), bookings,
                    seatsBooked, cust.size(), customerList));
        }
        return new AdminMoviesDto(out);
    }

    @Transactional
    public List<ReservationDto> reserve(ReserveRequest request) {
        Showtime showtime = findShowtime(request.showtimeId());
        HallLayouts.Layout layout = HallLayouts.of(showtime.getHallType());
        validate(request, layout);

        // The layout knows what each seat is, so the price comes from it and is stored
        // on the row: a later price change must not rewrite what someone already paid.
        Map<String, String> kindBySeat = new HashMap<>();
        for (HallLayouts.SeatSpec spec : layout.seats()) {
            kindBySeat.put(spec.key(), spec.kind());
        }

        List<SeatReservation> toSave = new ArrayList<>();
        for (SeatRef ref : request.seats()) {
            String row = ref.row().toUpperCase();
            toSave.add(new SeatReservation(showtime, row, ref.seatNumber(),
                    request.customerName(), request.customerEmail(),
                    TicketPrices.of(kindBySeat.get(row + ref.seatNumber()))));
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
                        r.getSeatNumber(), r.getCustomerName(), r.getCustomerEmail(),
                        r.getPriceSen()))
                .toList();
    }

    private Showtime findShowtime(Long showtimeId) {
        return showtimes.findById(showtimeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Showtime not found"));
    }

    private void validate(ReserveRequest request, HallLayouts.Layout layout) {
        if (request.showtimeId() == null) {
            throw badRequest("showtimeId is required");
        }
        if (request.seats() == null || request.seats().isEmpty()) {
            throw badRequest("Please pick at least one seat");
        }
        if (request.seats().size() > layout.maxSeats()) {
            throw badRequest("You can book at most " + layout.maxSeats() + " seats at once in this hall");
        }
        if (request.customerName() == null || request.customerName().isBlank()) {
            throw badRequest("Name is required");
        }
        if (request.customerEmail() == null || !request.customerEmail().contains("@")) {
            throw badRequest("A valid email is required");
        }
        Set<String> seen = new HashSet<>();
        Set<String> validKeys = layout.keys();
        for (SeatRef ref : request.seats()) {
            if (ref.row() == null || !layout.rows().contains(ref.row().toUpperCase())) {
                throw badRequest("Invalid seat row: " + ref.row());
            }
            if (!validKeys.contains(ref.row().toUpperCase() + ref.seatNumber())) {
                throw badRequest("Seat " + ref.row().toUpperCase() + ref.seatNumber()
                        + " does not exist in this hall");
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
