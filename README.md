# Starline Cinema

A simple cinema website: browse movies, pick a showtime, book seats.

| Layer    | Tech                                     | Port |
|----------|------------------------------------------|------|
| Frontend | React + TypeScript (Vite) — `frontend/`  | 5173 |
| Backend  | Java 21 + Spring Boot 3.5 (REST + JPA) — `backend/` | 8080 |
| Database | PostgreSQL 17 — user-level instance (trust auth) | 5433 |

## What it does

- `GET  /api/movies` — movies with their showtimes
- `GET  /api/showtimes/{id}/seats` — seat map (8 rows A–H × 10 seats, per showtime)
- `POST /api/reservations` — book 1–4 seats, all-or-nothing; a DB unique
  constraint (`uk_showtime_seat`) makes double-booking impossible (returns 409)

Demo data (5 movies) is seeded automatically on first start if the `movies` table is empty.

## Prerequisites (already installed on this machine)

| Tool | Location |
|------|----------|
| JDK 21 | `C:\Program Files\Microsoft\jdk-21.0.13.21-hotspot` |
| Maven 3.9.16 | `C:\Users\mnr_3\tools\apache-maven-3.9.16` |
| PostgreSQL 17 | `C:\Program Files\PostgreSQL\17` |
| Node.js / npm | on PATH |

The database data directory is `C:\Users\mnr_3\postgres-data` (a user-level
instance on port **5433** — this is NOT the winget-installed Windows service on 5432).

---

## How to run

Start the three components **in this order**: database → backend → frontend,
each in its own terminal window (cmd or PowerShell).

### 1. Start the database

```bat
"C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" -D C:\Users\mnr_3\postgres-data -l C:\Users\mnr_3\postgres-data\pg.log -o "-p 5433 -h localhost" start
```

Expected output: `waiting for server to start.... done` / `server started`

Confirm it's up:

```bat
"C:\Program Files\PostgreSQL\17\bin\pg_isready.exe" -h localhost -p 5433
```

Expected: `localhost:5433 - accepting connections`

> If `pg_ctl` says the port is in use / "another server might be running",
> the database is already running — just skip to step 2.

### 2. Start the backend (port 8080)

```bat
cd C:\Users\mnr_3\Documents\Workstation\Training Lesson\cinema\backend
set JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.13.21-hotspot
C:\Users\mnr_3\tools\apache-maven-3.9.16\bin\mvn.cmd spring-boot:run
```

Wait until you see:

```
Tomcat started on port 8080 (http)
Started CinemaApplication in ... seconds
```

> The first run downloads Maven dependencies and takes a few minutes;
> later starts take ~5 seconds.

### 3. Start the frontend (port 5173)

```bat
cd C:\Users\mnr_3\Documents\Workstation\Training Lesson\cinema\frontend
npm install     :: only the first time (installs node_modules)
npm run dev
```

Wait until you see:

```
VITE ready in ... ms
  Local: http://localhost:5173/
```

### 4. Verify

- Open **http://localhost:5173** in a browser — you should see the movie grid.
- Optional API check: `curl http://localhost:8080/api/movies` (returns JSON).

The Vite dev server proxies `/api/*` to the backend, so the frontend talks to
the API on the same origin — no CORS issues in development.

---

## How to stop

Stop in the reverse order (order isn't critical, but it's tidier):
**frontend → backend → database**.

### 1. Stop the frontend

Press **Ctrl+C** in the terminal running `npm run dev`.
(If that terminal is gone, free port 5173 instead:)

```bat
powershell -Command "Get-NetTCPConnection -LocalPort 5173 -State Listen -EA SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"
```

### 2. Stop the backend

Press **Ctrl+C** in the terminal running `mvn spring-boot:run` — this stops
Maven and the Java app together.

If the terminal is gone but the app is still running on 8080:

```bat
powershell -Command "Get-NetTCPConnection -LocalPort 8080 -State Listen -EA SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"
```

or, if no other Java apps are running on the machine: `taskkill /F /IM java.exe`

### 3. Stop the database

```bat
"C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" -D C:\Users\mnr_3\postgres-data stop
```

Expected: `waiting for server to shut down.... done / server stopped`

Confirm: `pg_isready` now reports `no response` for port 5433.
If a stop hangs because of lingering connections, add `-m fast` (immediate
disconnect).

> Data is safe: bookings live on disk in `postgres-data`, so everything
> survives stop/start cycles.

---

## Project layout

```
cinema/
├── README.md                 ← this file
├── screenshots/              ← UI verification screenshots
├── backend/                  ← Spring Boot (Java 21)
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/cinema/
│       │   ├── CinemaApplication.java   (entry point)
│       │   ├── domain/        Movie, Showtime, SeatReservation
│       │   ├── repository/    JPA repositories
│       │   ├── service/       CinemaService (booking logic, seat rules)
│       │   ├── controller/    ApiController (/api/...) + error handler
│       │   ├── dto/           Dtos.java (request/response records)
│       │   └── seed/          DataSeeder (demo movies, first start only)
│       └── resources/application.properties   (DB: localhost:5433/cinema)
└── frontend/                 ← React + TypeScript (Vite)
    ├── vite.config.ts        (dev proxy: /api → localhost:8080)
    └── src/
        ├── App.tsx           (movie grid)
        ├── api.ts            (fetch calls)
        ├── types.ts
        ├── index.css
        └── components/SeatMapView.tsx   (seat grid + booking form)
```

## Notes / gotchas

- The winget-installed Postgres **service** (port 5432) is left in place but
  unused: its superuser password is unknown (silent install) and restarting it
  needs UAC admin. The app uses the user-level instance on **5433** instead.
  `pg_hba.conf` backup from an earlier edit: `C:\Program Files\PostgreSQL\17\data\pg_hba.conf.bak`
- `mvn` (bash script) misbehaves under git-bash here — use `mvn.cmd` via `cmd /c`.
- `winget` needs a pseudo-tty from this shell (terminal tool with `pty=true`);
  it fails with "stdin is not a tty" without one.
- The `cinema` role's password is `cinema` (see `application.properties`).
- To reset all bookings: in the `cinema` DB run
  `DROP TABLE seat_reservations;` (Hibernate recreates it on next backend start).
- To reseed the demo movies: `TRUNCATE movies, showtimes CASCADE;` then restart
  the backend.

## Verified (2026-11-17)

- `tsc --noEmit` clean; backend compiles; API smoke tests pass (including 409 on double-book).
- Full UI flow exercised in a real browser: movie grid → seat map → book 2 seats →
  confirmation; bookings persisted to Postgres. Screenshots in `screenshots/`.
- Pushed to GitHub: https://github.com/Juthyra/cinema (branch `main`).
