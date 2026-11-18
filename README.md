# Starline Cinema

A simple cinema website: browse movies, pick a showtime, book seats.

| Layer    | Tech                                     | Port |
|----------|------------------------------------------|------|
| Frontend | React + TypeScript (Vite) — `frontend/`  | 5173 |
| Backend  | Java 21 + Spring Boot 3.5 (REST + JPA) — `backend/` | 8080 |
| Database | PostgreSQL 17 | **5432** (new machines) / **5433** (original dev machine) |

**This README is the complete manual** — install tools → clone → set up the
database → run → stop. It works on a fresh Windows 11 machine (~10 minutes,
~2 GB of disk) and on the original dev machine (where the two differ, both
paths are shown).

## What it does

- `GET  /api/movies` — movies with their showtimes
- `GET  /api/showtimes/{id}/seats` — seat map (8 rows A–H × 10 seats, per showtime)
- `POST /api/reservations` — book 1–4 seats, all-or-nothing; a DB unique
  constraint (`uk_showtime_seat`) makes double-booking impossible (returns 409)

### Hall types

Each showtime has a hall type that decides the seat layout (`HallType` +
`service/HallLayouts.java`). **Standard** is the default (and what showtimes
without a type use).

| Type | Layout | Max seats / booking |
|------|--------|---------------------|
| Standard (default) | 8 rows x 10 single seats | 4 |
| Family | 6 rows of two 4-seat pods | 6 |
| Couple | 6 rows of double love seats (1 seat = 2 people) | 4 |
| Modern | 6 rows of curved premium recliners | 4 |
| 3-Section | single seats (A-D), couple seats (E-F), wheelchair spaces (G) | 4 |

### Hall administration (Admin · Halls tab)

Halls (`Hall 1` ... `Hall 5`, created automatically) have a status:
**Active**, **Maintenance** or **Closed**. Only Active halls accept bookings
(`POST /api/reservations` answers 409 otherwise, and the movies tab greys out
their showtimes). The tab shows per-hall status, how many movies/showtimes
each hall plays on a chosen date, a "By hall" box view (filter by hall
category), a "Listing" table, and the layout of any hall you click.

- `GET  /api/admin/halls?date=yyyy-mm-dd` - halls + counts for that date (default today)
- `GET  /api/admin/halls/{id}/layout` - the hall's empty seat layout
- `PUT  /api/admin/halls/{id}/status` - body `{"status":"ACTIVE|MAINTENANCE|CLOSED"}`

Seeded halls: Hall 1 Standard, Hall 2 Family, Hall 3 Couple, Hall 4 Modern,
Hall 5 3-Section. Older showtimes get their type from the hall name on start.

Demo data (5 movies) is seeded automatically on first start if the `movies`
table is empty.

---

## 1. Install the tools (new machine)

Open **PowerShell** (or cmd) and run:

```bat
winget install --accept-source-agreements --accept-package-agreements Git.Git
winget install --accept-source-agreements --accept-package-agreements Microsoft.OpenJDK.21
winget install --accept-source-agreements --accept-package-agreements OpenJS.NodeJS.LTS
winget install --accept-source-agreements --accept-package-agreements PostgreSQL.PostgreSQL.17
```

> **Already on the original dev machine?** All four are installed —
> skip to step 3. Locations: JDK 21 at
> `C:\Program Files\Microsoft\jdk-21.0.13.21-hotspot`, PostgreSQL 17 at
> `C:\Program Files\PostgreSQL\17`, Git and Node on PATH (Maven at
> `C:\Users\mnr_3\tools\apache-maven-3.9.16` is optional — see below).

After the installs, **close and reopen the terminal** so the PATH refreshes.

| Tool | Why you need it |
|------|-----------------|
| Git | clone the repo |
| JDK 21 | run the Spring Boot backend |
| Node.js LTS | run the React frontend |
| PostgreSQL 17 | the database (new machine: runs as a Windows **service** on port **5432**) |

**Maven is NOT needed** — the backend ships with the Maven wrapper
(`backend\mvnw.cmd`), which downloads the correct Maven version
automatically on its first run.

During the PostgreSQL install you're asked to set a password for the
`postgres` superuser — **write it down**, step 3 needs it. The database
service starts itself after install (`services.msc` → `postgresql-x64-17`
→ Running).

## 2. Get the code

**New machine** — clone:

```bat
git clone https://github.com/Juthyra/cinema.git
cd cinema
```

**Already have the repo** — just update:

```bat
cd cinema
git pull
```

## 3. Set up the database

The app connects as user `cinema` (password `cinema`) to database `cinema`.

### Option A — new machine: standard service (port 5432)

Create the role and database with psql (you'll be prompted for the
`postgres` superuser password). Run **once only** — if the role/database
already exist, skip it.

```bat
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -c "CREATE ROLE cinema LOGIN PASSWORD 'cinema';"
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE cinema OWNER cinema;"
```

Expected: `CREATE ROLE`, then `CREATE DATABASE`.

Confirm the server is reachable:

```bat
"C:\Program Files\PostgreSQL\17\bin\pg_isready.exe" -h localhost -p 5432
```

Expected: `localhost:5432 - accepting connections`

**Point the app at 5432:** open
`backend\src\main\resources\application.properties` and change the URL line:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/cinema
```

### Option B — original dev machine: user-level instance (port 5433)

This machine runs a user-level instance (not a service) on **5433**, and
`application.properties` already points there — **no config change needed**.
Start it:

```bat
"C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" -D C:\Users\mnr_3\postgres-data -l C:\Users\mnr_3\postgres-data\pg.log -o "-p 5433 -h localhost" start
```

Expected: `waiting for server to start.... done` / `server started`
(If it says the port is in use / "another server might be running", the
database is already running — skip ahead.)

Confirm:

```bat
"C:\Program Files\PostgreSQL\17\bin\pg_isready.exe" -h localhost -p 5433
```

> Why not the service here? The winget-installed service (5432) has an
> unknown superuser password and needs UAC admin to restart — see
> Notes / gotchas.

## 4. Run the app

Two terminals (the database is already running from step 3), in this
order: backend → frontend.

### Backend (port 8080)

```bat
cd cinema\backend
set JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.13.21-hotspot
mvnw.cmd spring-boot:run
```

> If the JDK folder name differs on your machine (check
> `C:\Program Files\Microsoft\`), point `JAVA_HOME` at the right one.

Wait until you see:

```
Tomcat started on port 8080 (http)
Started CinemaApplication in ... seconds
```

> The **first run takes a few minutes** — the wrapper downloads Maven and
> the project downloads its dependencies. Later starts take ~5 seconds.
> Demo movies are seeded automatically on first start.

### Frontend (port 5173)

```bat
cd cinema\frontend
npm install     :: first time only (installs node_modules)
npm run dev
```

Wait until you see:

```
VITE ready in ... ms
  Local: http://localhost:5173/
```

### Verify

- Open **http://localhost:5173** in a browser — the movie grid appears.
- Optional API check: `curl http://localhost:8080/api/movies` → JSON.

The Vite dev server proxies `/api/*` to the backend, so the frontend talks
to the API on the same origin — no CORS issues in development.

## 5. Stop the app

Reverse order (frontend → backend → database). Order isn't critical, but
it's tidier.

### Frontend

Press **Ctrl+C** in the terminal running `npm run dev`.
(If that terminal is gone, free port 5173 instead:)

```bat
powershell -Command "Get-NetTCPConnection -LocalPort 5173 -State Listen -EA SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"
```

### Backend

Press **Ctrl+C** in the terminal running `mvnw.cmd spring-boot:run` — this
stops the wrapper and the Java app together.

If the terminal is gone but the app is still running on 8080:

```bat
powershell -Command "Get-NetTCPConnection -LocalPort 8080 -State Listen -EA SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"
```

or, if no other Java apps are running on the machine: `taskkill /F /IM java.exe`

### Database

**New machine (service):** nothing to do — it's a normal Windows service,
safe to leave running. To stop it: `services.msc` → `postgresql-x64-17` →
Stop, or (as admin) `net stop postgresql-x64-17`.

**Original dev machine (user instance):**

```bat
"C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" -D C:\Users\mnr_3\postgres-data stop
```

Expected: `waiting for server to shut down.... done / server stopped`.
If a stop hangs because of lingering connections, add `-m fast`.

> Data is safe either way: bookings live on disk, so everything survives
> stop/start cycles.

## 6. Rules (branch / commit / merge)

- **Owner** (`Juthyra`, git identity `nabyellar <nabyellar@gmail.com>`) may
  work on `main` directly. **Everyone else** must branch off `main`:
  `feat/<your-git-name>-<short-name>` (feature) or
  `bug/<your-git-name>-<short-name>` (fix), then open a Pull Request.
- **Every commit must have a real message** — what changed and why, one
  line, no placeholders.
- `main` is **protected on GitHub**: non-owner pushes are rejected; a PR is
  required.

Full policy: [`CONTRIBUTING.md`](CONTRIBUTING.md) (humans) and
[`AGENTS.md`](AGENTS.md) (AI coding agents — read it before contributing
with any AI tool).

---

## Project layout

```
cinema/
├── README.md                 ← this file (the complete manual)
├── CONTRIBUTING.md           ← full contributing policy
├── AGENTS.md                 ← rules summary for AI coding agents
├── screenshots/              ← UI verification screenshots
├── backend/                  ← Spring Boot (Java 21)
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd       ← Maven wrapper (no Maven install needed)
│   ├── .mvn/wrapper/         ← wrapper config
│   └── src/main/
│       ├── java/com/cinema/
│       │   ├── CinemaApplication.java   (entry point)
│       │   ├── domain/        Movie, Showtime, SeatReservation
│       │   ├── repository/    JPA repositories
│       │   ├── service/       CinemaService (booking logic, seat rules)
│       │   ├── controller/    ApiController (/api/...) + error handler
│       │   ├── dto/           Dtos.java (request/response records)
│       │   └── seed/          DataSeeder (demo movies, first start only)
│       └── resources/application.properties   (DB: localhost:5433 or 5432)
└── frontend/                 ← React + TypeScript (Vite)
    ├── vite.config.ts        (dev proxy: /api → localhost:8080)
    └── src/
        ├── App.tsx           (movie grid)
        ├── api.ts            (fetch calls)
        ├── types.ts
        ├── index.css
        └── components/SeatMapView.tsx   (seat grid + booking form)
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `git` / `npm` not found after install | Open a **new** terminal (PATH refresh) |
| `mvnw.cmd`: "JAVA_HOME ... not defined correctly" | `set JAVA_HOME` to your JDK folder (step 4 note) |
| Backend: `FATAL: password authentication failed` | Wrong DB password — re-run the step 3 psql lines with the `postgres` superuser password |
| Backend: `Connection refused` (5432) | Postgres service isn't running — `services.msc` → start `postgresql-x64-17` |
| Backend: `Connection refused` (5433) | Dev machine: start the user instance (step 3, Option B) |
| Port 5432 already in use | Another Postgres (or older version) is installed — stop it, or pick another port in `application.properties` |
| Frontend: blank page / API errors | Backend isn't running on 8080, or you forgot the 5432 config change (step 3, Option A) |
| Anything else | Read the backend terminal's error output; the API is plain REST — `curl http://localhost:8080/api/movies` isolates frontend vs backend problems |

## Notes / gotchas

- **Original dev machine only:** the winget-installed Postgres **service**
  (port 5432) is left in place but unused — its superuser password is
  unknown (silent install) and restarting it needs UAC admin. The app uses
  the user-level instance on **5433** instead. `pg_hba.conf` backup from an
  earlier edit: `C:\Program Files\PostgreSQL\17\data\pg_hba.conf.bak`
- The `mvn` bash script misbehaves under git-bash on this machine — use
  `mvnw.cmd` (preferred, works everywhere) or `mvn.cmd` via `cmd /c`.
- The `winget` on this machine needs a pseudo-tty from the agent shell
  (terminal tool with `pty=true`); plain background runs fail with
  "stdin is not a tty". Irrelevant when you run winget from a normal
  terminal window.
- The `cinema` role's password is `cinema` (see `application.properties`).
- To reset all bookings: in the `cinema` DB run
  `DROP TABLE seat_reservations;` (Hibernate recreates it on next backend
  start).
- To reseed the demo movies: `TRUNCATE movies, showtimes CASCADE;` then
  restart the backend.

## Verified (2026-11-17)

- `tsc --noEmit` clean; backend compiles; API smoke tests pass (including 409 on double-book).
- Full UI flow exercised in a real browser: movie grid → seat map → book 2 seats →
  confirmation; bookings persisted to Postgres. Screenshots in `screenshots/`.
- Maven wrapper verified (downloads and runs Maven 3.9.16 on its own).
- Pushed to GitHub: https://github.com/Juthyra/cinema (branch `main`,
  protected — see section 6).
