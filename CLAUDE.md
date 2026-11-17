# CLAUDE.md

Instructions for Claude Code in this repo. The branch/commit/merge policy is
shared with other AI agents and lives in `AGENTS.md` (summary) and
`CONTRIBUTING.md` (full policy) — imported here so Claude Code always loads it:

@AGENTS.md
@CONTRIBUTING.md

## Claude Code specifics

- **Identify the role before touching git.** The owner is `Juthyra`
  (git identity `nabyellar <nabyellar@gmail.com>`). If `git config user.name`
  / GitHub login is anyone else, never commit or push to `main` — branch as
  `feat/<git-name>-<short-name>` or `bug/<git-name>-<short-name>` and open a PR.
- **Commit messages:** one line, present tense, what + why
  (`add: ...`, `fix: ...`, `docs: ...`). No `update` / `WIP` / `asdf`.
- **Never force-push `main`.** Never skip hooks or rewrite published history.
- Commit only when asked. Keep commits small and focused; don't mix unrelated
  changes.

## Project map

- `backend/` — Java 21, Spring Boot 3.5, Spring Data JPA, PostgreSQL.
  Package `com.cinema`: `domain/` (Movie, Showtime, SeatReservation),
  `repository/`, `service/CinemaService` (all booking logic + seat rules),
  `controller/ApiController` (`/api/*`) + `ApiExceptionHandler`,
  `dto/Dtos` (records), `seed/DataSeeder` (demo data on empty DB).
- `frontend/` — React 19 + TypeScript + Vite. `src/App.tsx` (movie grid + nav),
  `src/api.ts` (fetch wrappers), `src/types.ts` (mirror of backend DTOs),
  `src/components/SeatMapView.tsx` (booking modal),
  `src/components/AdminView.tsx` (admin: by movie / all bookings),
  `src/lib/format.ts` (shared formatters).
- Full setup/run/stop manual: `README.md`.

## Commands

Backend (from `backend/`; wrapper downloads Maven, needs `JAVA_HOME`):

- Run: `mvnw.cmd spring-boot:run` (Windows) or `./mvnw spring-boot:run`
- Compile check: `./mvnw -q compile`

Frontend (from `frontend/`):

- `npm install` (first time), `npm run dev` (port 5173, proxies `/api` → 8080)
- Type check + build: `npm run build` (runs `tsc -b`)
- Lint: `npm run lint` (oxlint)

Verify both `npm run build` and a backend compile before calling work done.

## Conventions

- Seat/booking rules (8 rows A–H × 10 seats, max 4 seats per booking,
  all-or-nothing, 409 on double-book via unique constraint `uk_showtime_seat`)
  live in `CinemaService` — change them there, and keep `MAX_SEATS` etc. in
  `SeatMapView.tsx` and `README.md` in sync.
- When a backend DTO changes, update `frontend/src/types.ts` and `api.ts`
  in the same change.
- Frontend: strict TS (`noUnusedLocals`, `erasableSyntaxOnly` — no enums or
  parameter properties). Use `import type` for types (`verbatimModuleSyntax`).
- DB: default `application.properties` points to port **5433** (original dev
  machine); new machines use 5432 per `README.md` §3. Don't commit a changed
  port or credentials unless the task is about that.
- Docs: when adding a file or feature, update the project layout / endpoint
  list in `README.md`.
