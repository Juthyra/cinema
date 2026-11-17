# Setting Up on a New Device

Clone → install → run, from a fresh Windows 11 machine with nothing installed.
~10 minutes, ~2 GB of disk, no admin rights needed for anything except the
PostgreSQL installer (which asks for UAC once).

> Already on this machine? Use `README.md` instead — it has the local
> paths and the local database instance details.

## 1. Install the tools

Open **PowerShell** (or cmd) and run:

```bat
winget install --accept-source-agreements --accept-package-agreements Git.Git
winget install --accept-source-agreements --accept-package-agreements Microsoft.OpenJDK.21
winget install --accept-source-agreements --accept-package-agreements OpenJS.NodeJS.LTS
winget install --accept-source-agreements --accept-package-agreements PostgreSQL.PostgreSQL.17
```

Then **close and reopen your terminal** so the new PATH entries apply.

What you now have:

| Tool | Why | Default location |
|------|-----|------------------|
| Git | clone the repo | on PATH |
| JDK 21 | run the Spring Boot backend | `C:\Program Files\Microsoft\jdk-21.*` |
| Node.js LTS | run the React frontend | on PATH |
| PostgreSQL 17 | the database (runs as a Windows **service** on port **5432**) | `C:\Program Files\PostgreSQL\17` |

**Maven is NOT needed** — the backend ships with the Maven wrapper
(`backend\mvnw.cmd`), which downloads the right Maven version automatically.

During the PostgreSQL install you'll be asked to set a password for the
`postgres` superuser — write it down, you'll need it in step 3.
The service starts itself after install (check: `services.msc` →
`postgresql-x64-17` → Running).

## 2. Clone the repo

```bat
git clone https://github.com/Juthyra/cinema.git
cd cinema
```

## 3. Create the database

The app connects as user `cinema` (password `cinema`) to database `cinema`.
Create them with psql (you'll be prompted for the `postgres` password):

```bat
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -c "CREATE ROLE cinema LOGIN PASSWORD 'cinema';"
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE cinema OWNER cinema;"
```

Expected: `CREATE ROLE` then `CREATE DATABASE`.

Confirm the server is reachable:

```bat
"C:\Program Files\PostgreSQL\17\bin\pg_isready.exe" -h localhost -p 5432
```

Expected: `localhost:5432 - accepting connections`

**Point the app at port 5432** (the repo default is 5433, used by the
original dev machine): open
`backend\src\main\resources\application.properties` and change the URL line to:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/cinema
```

## 4. Run the app

Three terminals, in this order:

### Terminal 1 — backend (port 8080)

```bat
cd cinema\backend
set JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.13.21-hotspot
mvnw.cmd spring-boot:run
```

> If the JDK folder name differs on your machine (check
> `C:\Program Files\Microsoft\`), point `JAVA_HOME` at the right one.

Wait for:

```
Tomcat started on port 8080 (http)
Started CinemaApplication in ... seconds
```

The **first run takes a few minutes** — the wrapper downloads Maven and the
project downloads its dependencies. Later starts take ~5 seconds.
Demo movies are seeded automatically on first start.

### Terminal 2 — frontend (port 5173)

```bat
cd cinema\frontend
npm install
npm run dev
```

Wait for:

```
VITE ready in ... ms
  Local: http://localhost:5173/
```

### Verify

Open **http://localhost:5173** — the movie grid appears. No database step is
needed here: the Postgres service is already running.

## 5. Stop the app

- **Frontend:** Ctrl+C in its terminal.
- **Backend:** Ctrl+C in its terminal.
- **Database:** nothing to do — it's a normal Windows service and is safe to
  leave running. To stop it anyway: `services.msc` → `postgresql-x64-17` →
  Stop, or (as admin) `net stop postgresql-x64-17`.

Bookings survive restarts — data lives in
`C:\Program Files\PostgreSQL\17\data`.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `git`/`npm`/`winget` not found after install | Open a **new** terminal (PATH refresh) |
| `mvnw.cmd`: "JAVA_HOME ... not defined correctly" | `set JAVA_HOME` to the JDK folder (see step 4 note) |
| Backend: `FATAL: password authentication failed` | You typed the wrong DB password — re-run step 3's psql lines with the `postgres` superuser password |
| Backend: `Connection refused` to 5432 | Postgres service isn't running: `services.msc` → start `postgresql-x64-17` |
| Port 5432 already in use | Another Postgres (or older version) is installed — stop it or pick another port in `application.properties` |
| Frontend: blank page / API errors | Backend isn't running on 8080, or you forgot the 5432 config change in step 3 |
| Anything else | Check `README.md` (full run/stop guide) and the backend terminal's error output |
