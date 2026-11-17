package com.cinema.dto;

import java.util.List;

/**
 * Request/response DTOs. Keeping them as records in one file keeps the
 * surface area small for this simple app.
 */
public final class Dtos {

    public record ShowtimeInfo(Long id, String hall, String startsAt) {
    }

    public record MovieDto(Long id, String title, String genre, int durationMinutes,
                           String description, List<ShowtimeInfo> showtimes) {
    }

    public record SeatInfo(String row, int number, boolean taken, String customerName) {
    }

    public record SeatMapDto(Long showtimeId, String movieTitle, String hall, String startsAt,
                             List<String> rows, int seatsPerRow, List<SeatInfo> seats) {
    }

    public record SeatRef(String row, int seatNumber) {
    }

    public record ReserveRequest(Long showtimeId, String customerName, String customerEmail,
                                 List<SeatRef> seats) {
    }

    public record ReservationDto(Long id, Long showtimeId, String row, int seatNumber,
                                 String customerName, String customerEmail) {
    }
}
