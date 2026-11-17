# AGENTS.md

Instructions for AI coding agents working in this repo (humans: see
`CONTRIBUTING.md` — the full policy lives there; this file is a short
summary so you follow it even if you never open the other file).

## Hard rules — do not skip

1. **`main` is protected.** Only the repo owner (`Juthyra`, git identity
   `nabyellar <nabyellar@gmail.com>`) may commit/push/merge on `main`
   directly. If you are not the owner's session: branch off `main` and
   open a Pull Request.
2. **Branch naming** (non-owner work):
   - feature → `feat/<your-git-name>-<short-name>`
   - bug fix → `bug/<your-git-name>-<short-name>`
   - `<short-name>` is kebab-case and specific (`seat-count-fix`, not `fix2`).
3. **Every commit needs a real message**: one line, present tense, what
   changed and why. Never use placeholder text (`update`, `asdf`, `WIP`).
4. **Never force-push to `main`**, and never merge your own work to `main`
   unless you are acting as the owner.

## Project facts

- **Backend:** Java 21 + Spring Boot — `backend/`. Run:
  `mvnw.cmd spring-boot:run` (needs `JAVA_HOME`; no Maven install needed —
  the wrapper handles it). API on port 8080.
- **Frontend:** React + TypeScript + Vite — `frontend/`. Run:
  `npm install` then `npm run dev` (port 5173, proxies `/api` → 8080).
- **Database:** PostgreSQL. New machines: `SETUP-NEW-MACHINE.md`
  (create role `cinema` / db `cinema`, point `application.properties` at
  the right port). This dev machine uses a user-level instance on **5433**.
- **Full run/stop guide for the original dev machine:** `README.md`.
- **Full contributing policy:** `CONTRIBUTING.md`.

## When in doubt

Re-read `CONTRIBUTING.md` and make the choice that keeps `main` clean:
small focused commits, correct branch type (`feat/` vs `bug/`), and a PR
for anything that isn't the owner's direct work.
