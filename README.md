# Starline Cinema

A simple cinema website: browse movies, pick a showtime, book seats.

| Layer    | Tech                                    |
|----------|-----------------------------------------|
| Frontend | React 19 + TypeScript (Vite) — `frontend/` |
| Backend  | Java 21 + Spring Boot 3.5 (REST + JPA) — `backend/` |
| Database | PostgreSQL 17 — user instance on port **5433** (trust auth) |

## What it does

- `GET  /api/movies` — movies with their showtimes
- `GET  /api/showtimes/{id}/seats` — seat map (8 rows A–H × 10 seats, per showtime)
- `POST /api/reservations` — book 1–4 seats, all-or-nothing; a DB unique
  constraint (`uk_showtime_seat`) makes double-booking impossible (returns 409)

Demo data (5 movies) is seeded on first start if the `movies` table is empty.

## Running it (Windows)

Tools installed by a previous session:

- JDK 21: `C:\Program Files\Microsoft\jdk-21.0.13.21-hotspot`
- Maven: `C:\Users\mnr_3\tools\apache-maven-3.9.16`
- PostgreSQL 17: `C:\Program Files\PostgreSQL\17` (bin in `C:\Program Files\PostgreSQL\17\bin`)

1. **Postgres** (user-level instance, no admin needed):

   ```bat
   "C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" -D C:\Users\mnr_3\postgres-data -l C:\Users\mnr_3\postgres-data\pg.log -o "-p 5433 -h localhost" start
   ```

   Role `cinema` (password `cinema`) owns database `cinema`.

2. **Backend** (port 8080):

   ```bat
   cd C:\Users\mnr_3\Documents\Workstation\Training Lesson\cinema\backend
   set JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.13.21-hotspot
   C:\Users\mnr_3\tools\apache-maven-3.9.16\bin\mvn.cmd spring-boot:run
   ```

3. **Frontend** (port 5173, proxies `/api` → 8080):

   ```bat
   cd C:\Users\mnr_3\Documents\Workstation\Training Lesson\cinema\frontend
   npm install
   npm run dev
   ```

Open http://localhost:5173

## Notes / gotchas

- The winget-installed Postgres **service** (port 5432) is left in place but unused:
  its superuser password is unknown (silent install) and restarting the service
  needs UAC admin. The app uses the user-level instance on 5433 instead.
  `pg_hba.conf` backup from the failed edit: `C:\Program Files\PostgreSQL\17\data\pg_hba.conf.bak`
- `mvn` (bash script) misbehaves under git-bash here — use `mvn.cmd` via `cmd /c`.
- `winget` needs a pseudo-tty from this shell (`terminal` tool with `pty=true`);
  it fails with "stdin is not a tty" without one.
- To reset bookings: `DROP TABLE seat_reservations;` in the `cinema` DB
  (Hibernate recreates it on next backend start).

## Verified (2026-11-17)

- `tsc --noEmit` clean; backend compiles; API smoke tests pass (including 409 on double-book).
- Full UI flow exercised in a real browser: movie grid → seat map → book 2 seats →
  confirmation; bookings persisted to Postgres. Screenshots in `screenshots/`.
