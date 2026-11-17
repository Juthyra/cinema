import { useEffect, useMemo, useState } from 'react';
import { getAdminBookings } from '../api';
import type { AdminBookings } from '../types';

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

export default function AdminView() {
  const [data, setData] = useState<AdminBookings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    getAdminBookings()
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return data.bookings;
    return data.bookings.filter(
      (b) =>
        b.customerName.toLowerCase().includes(q) ||
        b.customerEmail.toLowerCase().includes(q) ||
        b.movieTitle.toLowerCase().includes(q),
    );
  }, [data, filter]);

  return (
    <section className="admin">
      {error && <div className="notice err">{error}</div>}

      {data && (
        <>
          <div className="stats">
            <div className="stat-card">
              <span className="stat-num">{data.totals.bookings}</span>
              <span className="stat-label">bookings</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">{data.totals.seats}</span>
              <span className="stat-label">seats booked</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">{data.totals.customers}</span>
              <span className="stat-label">customers</span>
            </div>
          </div>

          <div className="admin-toolbar">
            <input
              placeholder="Filter by customer, email or movie…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <span className="muted">
              {filtered.length} of {data.bookings.length} bookings
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
                      {data.bookings.length === 0
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
      )}

      {!data && !error && <p className="muted">Loading bookings…</p>}
    </section>
  );
}
