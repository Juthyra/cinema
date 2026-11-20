package com.cinema.dto;

import java.util.List;

/**
 * Request/response DTOs. Keeping them as records in one file keeps the
 * surface area small for this simple app.
 */
public final class Dtos {

    public record ShowtimeInfo(Long id, String hall, String hallType, String hallTypeLabel,
                               String startsAt) {
    }

    public record MovieDto(Long id, String title, String genre, int durationMinutes,
                           String description, List<ShowtimeInfo> showtimes) {
    }

    /** kind: STANDARD, FAMILY, COUPLE, RECLINER, SINGLE or ACCESSIBLE. gapBefore = aisle to its left. */
    public record SeatInfo(String row, int number, boolean taken, String customerName,
                           String kind, String section, boolean gapBefore) {
    }

    public record SeatMapDto(Long showtimeId, String movieTitle, String hall, String startsAt,
                             String hallType, String hallTypeLabel, String hallDescription,
                             int maxSeats, List<String> rows, int seatsPerRow, List<SeatInfo> seats) {
    }

    public record SeatRef(String row, int seatNumber) {
    }

    public record ReserveRequest(Long showtimeId, String customerName, String customerEmail,
                                 List<SeatRef> seats) {
    }

    public record ReservationDto(Long id, Long showtimeId, String row, int seatNumber,
                                 String customerName, String customerEmail) {
    }

    /** One customer's ticket: their seats for a single showtime, with a booking reference. */
    public record TicketDto(String reference, Long showtimeId, String movieTitle, String genre,
                            int durationMinutes, String hall, String hallType, String hallTypeLabel,
                            String startsAt, List<String> seats, String customerName,
                            String customerEmail, String bookedAt, boolean upcoming) {
    }

    /** One booking group: seats booked by the same customer for the same showtime. */
    public record BookingGroupDto(Long showtimeId, String movieTitle, String hall, String startsAt,
                                  String customerName, String customerEmail, List<String> seats,
                                  String bookedAt) {
    }

    public record AdminTotals(long bookings, long seats, long customers) {
    }

    public record AdminBookingsDto(AdminTotals totals, List<BookingGroupDto> bookings) {
    }

    /** One customer's bookings for a single movie (may span several showtimes). */
    public record MovieCustomerDto(String name, String email, List<String> seats,
                                   List<String> showtimes) {
    }

    /** Admin dashboard stats for one movie. */
    public record AdminMovieStatsDto(Long movieId, String title, String genre, int durationMinutes,
                                     String description, long bookings, long seatsBooked,
                                     long customers, List<MovieCustomerDto> customerList) {
    }

    public record AdminMoviesDto(List<AdminMovieStatsDto> movies) {
    }
}
