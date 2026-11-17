# Contributing Rules

## Roles

- **Owner:** `Juthyra` (git identity `nabyellar <nabyellar@gmail.com>`) — the
  only person allowed to work on the `main` branch directly.
- **Developer:** anyone else.

## Branch rules

| Who | May work on `main` directly? | How to contribute |
|-----|------------------------------|-------------------|
| Owner (Juthyra) | ✅ Yes — commit/push/merge on `main` | Directly, or via PR, whichever is handy |
| Developer | ❌ Never | Create a branch, push it, open a Pull Request to `main` |

**Branch naming** (developers — always branch off an up-to-date `main`):

| Change type | Pattern | Example |
|-------------|---------|---------|
| New feature | `feat/<your-git-name>-<short-name>` | `feat/alice-price-tiers` |
| Bug fixing | `bug/<your-git-name>-<short-name>` | `bug/alice-login-crash` |

- `<your-git-name>` = your `git config user.name` (or GitHub username)
- `<short-name>` = kebab-case, short and specific (`seat-count-fix`, not `fix-stuff`)

## Commit rules

- **Every commit must have a message.** Git enforces this (an empty commit is
  impossible), and the message must say *what* changed and *why*.
- One line, present tense: `add: price tiers per seat row`,
  `fix: double-booking race on seat confirm`, `docs: clarify stop steps`.
- No `asdf`, `update`, `final version 2`, or `WIP dump` messages.

## Merge rules

- **Only the owner merges to `main`.**
- Owner: may push to `main` directly or merge the PR.
- Developer: opens a PR; the owner reviews and merges.
- `main` is **protected on GitHub**: pushes from anyone other than the owner
  are rejected — a Pull Request is required.

## Example flow (developer)

```bat
:: 1. start from a clean, up-to-date main
git checkout main
git pull

:: 2. create the branch (feature or bug)
git checkout -b feat/alice-price-tiers
:: or: git checkout -b bug/alice-seat-count

:: 3. work, commit with a real message
git add -A
git commit -m "add: price tiers per seat row"

:: 4. push the branch and open a Pull Request to main on GitHub
git push -u origin feat/alice-price-tiers
```

## Example flow (owner)

```bat
:: direct work on main — allowed
git checkout main
git commit -m "docs: add contributing rules"
git push

:: ...or merge a developer's PR from GitHub (or: gh pr merge <number>)
```
