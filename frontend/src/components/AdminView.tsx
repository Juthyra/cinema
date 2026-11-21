import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAdminBookings, getAdminMovies } from '../api';
import type { AdminBookings, AdminMovies } from '../types';
import { fmtDuration, fmtShowtime, fmtWhen, GRADIENTS } from '../lib/format';
import ManageMoviesView from './ManageMoviesView';

/**
 * Admin view.
 * - Dashboard cards (totals) stay on top.
 * - A switcher picks the screen:
 *   "By movie"      = movie grid (same layout as the movies tab); clicking a
 *                     movie shows its booking stats + customer list.
 *   "All bookings"  = the full bookings table.
 *   "Manage movies" = add, edit and delete movies.
 */
type Mode = 'movies' | 'bookings' | 'manage';

export default function AdminView() {
  const [bookings, setBookings] = useState<AdminBookings | null>(null);
  const [movies, setMovies] = useState<AdminMovies | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [mode, setMode] = useState<Mode>('movies');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = useCallback(() => {
    Promise.all([getAdminBookings(), getAdminMovies()])
      .then(([b, m]) => {
        setBookings(b);
        setMovies(m);
        setError(null);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!bookings) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return bookings.bookings;
    return bookings.bookings.filter(
      (b) =>
        b.customerName.toLowerCase().includes(q) ||
        b.customerEmail.toLowerCase().includes(q) ||
        b.movieTitle.toLowerCase().includes(q),
    );
  }, [bookings, filter]);

  const selected = movies?.movies.find((m) => m.movieId === selectedId) ?? null;

  return (
    <section className="admin">
      {error && <div className="notice err">{error}</div>}

      {bookings && (
        <div className="stats">
          <div className="stat-card">
            <span className="stat-num">{bookings.totals.bookings}</span>
            <span className="stat-label">bookings</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{bookings.totals.seats}</span>
            <span className="stat-label">seats booked</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{bookings.totals.customers}</span>
            <span className="stat-label">customers</span>
          </div>
        </div>
      )}

      <div className="mode-toggle">
        <button
          className={mode === 'movies' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setMode('movies')}
        >
          🎬 By movie
        </button>
        <button
          className={mode === 'bookings' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setMode('bookings')}
        >
          📋 All bookings
        </button>
        <button
          className={mode === 'manage' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setMode('manage')}
        >
          🛠 Manage movies
        </button>
      </div>

      {mode === 'movies' &&
        (movies === null ? (
          <p className="muted">Loading movies…</p>
        ) : (
          <>
            <main className="grid">
              {movies.movies.map((m, i) => (
                <article
                  key={m.movieId}
                  className={
                    m.movieId === selectedId ? 'card selectable selected' : 'card selectable'
                  }
                  onClick={() => setSelectedId(m.movieId === selectedId ? null : m.movieId)}
                >
                  <div className="poster" style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
                    <span>{m.title.slice(0, 2)}</span>
                  </div>
                  <div className="card-body">
                    <div className="card-top">
                      <h2>{m.title}</h2>
                      <span className="chip">{m.genre}</span>
                    </div>
                    <p className="muted">{fmtDuration(m.durationMinutes)}</p>
                    <p className="description">{m.description}</p>
                    <div className="mini-stats">
                      <span className="mini-stat">
                        <b>{m.bookings}</b> bookings
                      </span>
                      <span className="mini-stat">
                        <b>{m.seatsBooked}</b> seats
                      </span>
                      <span className="mini-stat">
                        <b>{m.customers}</b> customers
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </main>

            {selected && (
              <section className="movie-detail">
                <div className="movie-detail-head">
                  <h2>{selected.title}</h2>
                  <span className="chip">{selected.genre}</span>
                  <button className="close-btn" onClick={() => setSelectedId(null)} title="Close">
                    ✕
                  </button>
                </div>

                <div className="stats">
                  <div className="stat-card">
                    <span className="stat-num">{selected.bookings}</span>
                    <span className="stat-label">bookings</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-num">{selected.seatsBooked}</span>
                    <span className="stat-label">seats booked</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-num">{selected.customers}</span>
                    <span className="stat-label">customers</span>
                  </div>
                </div>

                {selected.customerList.length === 0 ? (
                  <p className="muted">No bookings for this movie yet.</p>
                ) : (
                  <div className="table-wrap">
                    <table className="bookings">
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Email</th>
                          <th>Seats</th>
                          <th>Showtimes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.customerList.map((c) => (
                          <tr key={c.email}>
                            <td>{c.name}</td>
                            <td className="email">{c.email}</td>
                            <td>
                              <span className="seat-tags">
                                {c.seats.map((s) => (
                                  <span key={s} className="seat-tag">
                                    {s}
                                  </span>
                                ))}
                              </span>
                            </td>
                            <td className="email">{c.showtimes.map(fmtShowtime).join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </>
        ))}

      {mode === 'bookings' &&
        (bookings === null ? (
          <p className="muted">Loading bookings…</p>
        ) : (
          <>
            <div className="admin-toolbar">
              <input
                placeholder="Filter by customer, email or movie…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <span className="muted">
                {filtered.length} of {bookings.bookings.length} bookings
              </span>
            </div>

            <div className="table-wrap">
              <table className="bookings">
                <thead>
                  <tr>
                    <th>Movie</th>
                    <th>Showtime</th>
                    <th>Hall</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Seats</th>
                    <th>Count</th>
                    <th>Booked at</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td className="empty" colSpan={8}>
                        {bookings.bookings.length === 0
                          ? 'No bookings yet — seats booked in the app will appear here.'
                          : 'No bookings match the filter.'}
                      </td>
                    </tr>
                  )}
                  {filtered.map((b) => (
                    <tr key={`${b.showtimeId}-${b.customerEmail}`}>
                      <td>{b.movieTitle}</td>
                      <td>{fmtWhen(b.startsAt)}</td>
                      <td>{b.hall}</td>
                      <td>{b.customerName}</td>
                      <td className="email">{b.customerEmail}</td>
                      <td>
                        <span className="seat-tags">
                          {b.seats.map((s) => (
                            <span key={s} className="seat-tag">
                              {s}
                            </span>
                          ))}
                        </span>
                      </td>
                      <td className="count">{b.seats.length}</td>
                      <td>{fmtWhen(b.bookedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ))}

      {mode === 'manage' && <ManageMoviesView onChanged={load} />}
    </section>
  );
}
