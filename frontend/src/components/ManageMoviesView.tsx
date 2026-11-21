import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createMovie, deleteMovie, getAdminMovies, updateMovie } from '../api';
import type { AdminMovieStats, MovieInput } from '../types';
import { genresInUse } from '../lib/genres';
import { fmtDuration } from '../lib/format';
import Dropdown from './Dropdown';
import NumberStepper from './NumberStepper';

const BLANK: MovieInput = { title: '', genre: '', durationMinutes: 90, description: '' };

/**
 * Admin: add, edit and delete movies.
 *
 * One form does both jobs: "Edit" on a row loads that movie into it and the
 * button becomes Save. Nothing here is trusted to be valid - the backend checks
 * it again and answers 409 for a duplicate title or a delete that would take
 * booked seats with it. Those reasons are shown verbatim.
 */
export default function ManageMoviesView({ onChanged }: { onChanged: () => void }) {
  const [movies, setMovies] = useState<AdminMovieStats[] | null>(null);
  const [form, setForm] = useState<MovieInput>(BLANK);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Standard film genres, plus anything already stored, so an older movie's
  // genre is never silently rewritten just because the list moved on.
  const genreOptions = useMemo(
    () => genresInUse((movies ?? []).map((m) => m.genre)),
    [movies],
  );

  useEffect(() => {
    let cancelled = false;
    getAdminMovies()
      .then((data) => {
        if (!cancelled) setMovies(data.movies);
      })
      .catch((e) => {
        if (!cancelled) setNotice({ kind: 'err', text: (e as Error).message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function refresh() {
    getAdminMovies()
      .then((data) => setMovies(data.movies))
      .catch((e) => setNotice({ kind: 'err', text: (e as Error).message }));
  }

  function reset() {
    setForm(BLANK);
    setEditingId(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      if (editingId === null) {
        const created = await createMovie(form);
        setNotice({ kind: 'ok', text: `Added "${created.title}".` });
      } else {
        const saved = await updateMovie(editingId, form);
        setNotice({ kind: 'ok', text: `Saved changes to "${saved.title}".` });
      }
      reset();
      refresh();
      onChanged();
    } catch (e) {
      setNotice({ kind: 'err', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function remove(movie: AdminMovieStats) {
    const ok = window.confirm(
      `Delete "${movie.title}"? Its showtimes go with it. Booked seats would be lost, so this is refused while any exist.`,
    );
    if (!ok) return;
    setBusy(true);
    setNotice(null);
    try {
      await deleteMovie(movie.movieId);
      setNotice({ kind: 'ok', text: `Deleted "${movie.title}".` });
      if (editingId === movie.movieId) reset();
      refresh();
      onChanged();
    } catch (e) {
      setNotice({ kind: 'err', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  function edit(movie: AdminMovieStats) {
    setEditingId(movie.movieId);
    setForm({
      title: movie.title,
      genre: movie.genre,
      durationMinutes: movie.durationMinutes,
      description: movie.description,
    });
    setNotice(null);
  }

  const incomplete =
    form.title.trim() === '' || form.genre.trim() === '' || form.durationMinutes <= 0;

  return (
    <section className="manage">
      <form className="form manage-form" onSubmit={submit}>
        <h3 className="manage-head">
          {editingId === null ? 'Add a movie' : `Editing movie #${editingId}`}
        </h3>

        <div className="form-row">
          <input
            placeholder="Title"
            value={form.title}
            maxLength={120}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Dropdown
            options={genreOptions}
            value={form.genre}
            onChange={(genre) => setForm({ ...form, genre })}
            placeholder="— pick a genre —"
            label="Genre"
          />
          <NumberStepper
            value={form.durationMinutes}
            onChange={(durationMinutes) => setForm({ ...form, durationMinutes })}
            min={1}
            max={600}
            step={5}
            hint={fmtDuration(form.durationMinutes)}
            label="Duration in minutes"
          />
        </div>

        <textarea
          placeholder="Description (optional)"
          rows={2}
          maxLength={500}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="actions">
          <button className="reserve-btn" type="submit" disabled={busy || incomplete}>
            {editingId === null ? '＋ Add movie' : '💾 Save changes'}
          </button>
          {editingId !== null && (
            <button className="nav-btn" type="button" onClick={reset} disabled={busy}>
              Cancel
            </button>
          )}
          <span className="hint">Duration in minutes (1–600). Titles must be unique.</span>
        </div>
      </form>

      {notice && <div className={`notice ${notice.kind}`}>{notice.text}</div>}

      {movies === null ? (
        <p className="muted">Loading movies…</p>
      ) : (
        <div className="table-wrap manage-table">
          <table className="bookings">
            <thead>
              <tr>
                <th>Title</th>
                <th>Genre</th>
                <th>Duration</th>
                <th>Bookings</th>
                <th>Seats booked</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {movies.map((m) => (
                <tr key={m.movieId} className={m.movieId === editingId ? 'editing' : undefined}>
                  <td>
                    {m.title}
                    {m.bookings > 0 && <span className="chip locked">has bookings</span>}
                  </td>
                  <td className="email">{m.genre}</td>
                  <td>{m.durationMinutes} min</td>
                  <td className="count">{m.bookings}</td>
                  <td className="count">{m.seatsBooked}</td>
                  <td>
                    <span className="row-actions">
                      <button className="btn-sm" type="button" onClick={() => edit(m)}>
                        Edit
                      </button>
                      <button className="btn-sm danger" type="button" onClick={() => remove(m)}>
                        Delete
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
