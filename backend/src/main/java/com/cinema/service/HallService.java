package com.cinema.service;

import com.cinema.domain.Hall;
import com.cinema.domain.HallDayStatus;
import com.cinema.domain.HallStatus;
import com.cinema.domain.HallType;
import com.cinema.domain.SeatReservation;
import com.cinema.domain.Showtime;
import com.cinema.dto.Dtos.HallAdminDto;
import com.cinema.dto.Dtos.HallLayoutDto;
import com.cinema.dto.Dtos.HallScheduleItem;
import com.cinema.dto.Dtos.HallStatusDto;
import com.cinema.dto.Dtos.HallTotals;
import com.cinema.dto.Dtos.HallsAdminDto;
import com.cinema.dto.Dtos.SeatInfo;
import com.cinema.repository.HallDayStatusRepository;
import com.cinema.repository.HallRepository;
import com.cinema.repository.SeatReservationRepository;
import com.cinema.repository.ShowtimeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Admin features for halls: status control, per-date usage, layout preview. */
@Service
public class HallService {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final HallRepository halls;
    private final HallDayStatusRepository dayStatuses;
    private final ShowtimeRepository showtimes;
    private final SeatReservationRepository reservations;

    public HallService(HallRepository halls, HallDayStatusRepository dayStatuses,
                       ShowtimeRepository showtimes, SeatReservationRepository reservations) {
        this.halls = halls;
        this.dayStatuses = dayStatuses;
        this.showtimes = showtimes;
        this.reservations = reservations;
    }

    @Transactional(readOnly = true)
    public HallsAdminDto getHalls(LocalDate date) {
        LocalDate day = date != null ? date : LocalDate.now();
        List<Showtime> onDay = showtimes.findByStartsAtBetween(day.atStartOfDay(), day.plusDays(1).atStartOfDay());

        // status of each hall on THIS date (no row = ACTIVE)
        Map<Long, HallStatus> statusOnDay = new HashMap<>();
        for (HallDayStatus d : dayStatuses.findByDate(day)) {
            statusOnDay.put(d.getHall().getId(), d.getStatus());
        }

        // seats booked per showtime, for the schedule lines
        Map<Long, Long> booked = new HashMap<>();
        for (SeatReservation r : reservations.findAll()) {
            booked.merge(r.getShowtime().getId(), 1L, Long::sum);
        }

        List<HallAdminDto> out = halls.findAllByOrderByIdAsc().stream().map(h -> {
            List<HallScheduleItem> schedule = onDay.stream()
                    .filter(s -> h.getName().equals(s.getHall()))
                    .sorted(Comparator.comparing(Showtime::getStartsAt))
                    .map(s -> new HallScheduleItem(s.getId(), s.getMovie().getTitle(),
                            s.getStartsAt().format(ISO), booked.getOrDefault(s.getId(), 0L)))
                    .toList();
            long movies = schedule.stream().map(HallScheduleItem::movieTitle).distinct().count();
            HallStatus st = statusOnDay.getOrDefault(h.getId(), HallStatus.ACTIVE);
            return new HallAdminDto(h.getId(), h.getName(), h.getType().name(), h.getType().label(),
                    h.getType().description(), st.name(), st.label(),
                    HallLayouts.of(h.getType()).seats().size(), movies, schedule.size(), schedule);
        }).toList();

        HallTotals totals = new HallTotals(out.size(),
                out.stream().filter(h -> h.status().equals("ACTIVE")).count(),
                out.stream().filter(h -> h.status().equals("MAINTENANCE")).count(),
                out.stream().filter(h -> h.status().equals("CLOSED")).count());
        return new HallsAdminDto(day.toString(), totals, out);
    }

    @Transactional(readOnly = true)
    public HallLayoutDto getLayout(Long hallId) {
        Hall hall = find(hallId);
        HallLayouts.Layout layout = HallLayouts.of(hall.getType());
        List<SeatInfo> seats = layout.seats().stream()
                .map(s -> new SeatInfo(s.row(), s.number(), false, null, s.kind(), s.section(), s.gapBefore()))
                .toList();
        HallType t = hall.getType();
        return new HallLayoutDto(hall.getId(), hall.getName(), t.name(), t.label(), t.description(),
                layout.maxSeats(), layout.rows(), layout.seatsPerRow(), seats);
    }

    @Transactional
    public HallStatusDto setStatus(Long hallId, String status, String date) {
        Hall hall = find(hallId);
        LocalDate day;
        try {
            day = LocalDate.parse(date);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "date is required (yyyy-mm-dd)");
        }
        HallStatus parsed;
        try {
            parsed = HallStatus.valueOf(status == null ? "" : status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Status must be ACTIVE, MAINTENANCE or CLOSED");
        }
        long showtimeCount = showtimes.findByStartsAtBetween(day.atStartOfDay(), day.plusDays(1).atStartOfDay())
                .stream().filter(s -> hall.getName().equals(s.getHall())).count();
        if (parsed != HallStatus.ACTIVE && showtimeCount > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, hall.getName() + " has " + showtimeCount
                    + " showtime(s) on " + day + ", so it must stay Active on that date.");
        }
        var existing = dayStatuses.findByHallIdAndDate(hallId, day);
        if (parsed == HallStatus.ACTIVE) {
            existing.ifPresent(dayStatuses::delete);
        } else if (existing.isPresent()) {
            existing.get().setStatus(parsed);
        } else {
            dayStatuses.save(new HallDayStatus(hall, day, parsed));
        }
        return new HallStatusDto(hallId, day.toString(), parsed.name());
    }

    private Hall find(Long id) {
        return halls.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hall not found"));
    }
}
