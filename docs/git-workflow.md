# Git workflow (for contributors)

This repo has three places where code lives. Knowing which one you are looking
at explains almost every git question.

```
① Working tree            ② Your local repo (history)        ③ origin (GitHub)
  files in the folder  →    git add + git commit          →   git push
   (VS Code shows it)        .git/ folder                    Juthyra/cinema
                       ←    (no command)                   ←   git fetch / git pull
```

## Seeing your own changes (①)

```bash
git status          # which files changed
git diff            # what changed, line by line
git diff --staged   # what is about to be committed
```

In VS Code: **Ctrl+Shift+G** opens Source Control — changed files on the left,
click one for a side-by-side diff.

## Seeing the owner's changes (③ → ②)

Nothing arrives automatically. `fetch` downloads information without touching
your files; `pull` is `fetch` plus a merge.

```bash
git fetch                                  # safe, changes nothing
git log --oneline HEAD..origin/main        # commits on GitHub you don't have yet
git diff HEAD origin/main                  # full difference
git pull                                   # apply it
```

Single file: `git diff origin/main -- backend/src/main/java/com/cinema/service/CinemaService.java`

Work in someone else's feature branch:

```bash
git log --oneline origin/feat/<name>-<short> | head
git diff origin/main origin/feat/<name>-<short> --stat
```

## Daily flow (non-owner)

```bash
git checkout -b feat/<git-name>-<short>    # never work on main
# ...edit, then...
git add <files> && git commit -m "feat: what changed and why"
git push -u origin feat/<git-name>-<short>
gh pr create --fill --base main            # or open a PR on GitHub
```

Keep your branch current with the owner's work:

```bash
git checkout main
git pull
git checkout feat/<git-name>-<short>
git merge main                             # or: git rebase main
```

## Rules that prevent lost work

- **Never `git pull` with uncommitted changes.** Commit on your branch, or
  `git stash` → pull → `git stash pop`.
- **`git add <file>`, not `git add -A`** when a machine-specific edit is sitting
  in the tree (for example a local database port). Stage only what belongs in
  the commit.
- **Merge conflict?** git marks the files; VS Code offers Accept Current /
  Incoming / Both. Resolve, then `git add <file>` and `git commit`. To back out
  completely: `git merge --abort`.
- **Machine-specific local edits** can be hidden from `git status` with
  `git update-index --skip-worktree <file>` (undo with `--no-skip-worktree`).
