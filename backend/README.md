# Cinema Backend (Spring Boot + Java 21 + PostgreSQL)

Simple cinema booking API.

## Endpoints
- `GET  /api/movies` — all movies with showtimes
- `GET  /api/showtimes/{id}/seats` — seat map for a showtime
- `POST /api/reservations` — book 1-4 seats `{ showtimeId, customerName, customerEmail, seats: [{row, seatNumber}] }`

## Run
1. PostgreSQL running on localhost:5432 with a database/role `cinema` (password `cinema`).
2. `mvn spring-boot:run`
