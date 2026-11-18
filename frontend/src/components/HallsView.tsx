import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAdminHalls, getHallLayout, setHallStatus } from '../api';
import type { AdminHall, AdminHalls, HallLayout, HallStatus, HallType } from '../types';
import { fmtWhen } from '../lib/format';
import SeatGrid from './SeatGrid';

/**
 * Admin · Halls.
 * - Stat cards + a date picker (movies/showtimes per hall are counted for that date).
 * - "By hall": boxes like the movies tab, filterable by hall category.
 * - "Listing": every hall in one table.
 * - Click a hall to open a modal with its layout and schedule, and to set its status.
 */
type Mode = 'halls' | 'list';

const TYPES: { value: HallType; label: string }[] = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'FAMILY', label: 'Family' },
  { value: 'COUPLE', label: 'Couple' },
  { value: 'MODERN', label: 'Modern' },
  { value: 'MIXED', label: '3-Section' },
];

const STATUSES: { value: HallStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'CLOSED', label: 'Closed' },
];

const HEADER_BG: Record<HallType, string> = {
  STANDARD: 'linear-gradient(135deg, #1e3a5f, #0f1c2e)',
  FAMILY: 'linear-gradient(135deg, #2f6b46, #12291c)',
  COUPLE: 'linear-gradient(135deg, #7a3a6a, #2a1228)',
  MODERN: 'linear-gradient(135deg, #3d5bd1, #121a3d)',
  MIXED: 'linear-gradient(135deg, #1e7f9c, #0d2b36)',
};

function todayStr(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function StatusBadge({ hall }: { hall: AdminHall }) {
  return <span className={`status-badge ${hall.status.toLowerCase()}`}>{hall.statusLabel}</span>;
}

export default function HallsView() {
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState<AdminHalls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('halls');
  const [typeFilter, setTypeFilter] = useState<HallType | 'ALL'>('ALL');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [layout, setLayout] = useState<HallLayout | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await getAdminHalls(date));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (selectedId === null) {
      setLayout(null);
      return;
    }
    let cancelled = false;
    getHallLayout(selectedId)
      .then((l) => {
        if (!cancelled) setLayout(l);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    if (selectedId === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  const selected = data?.halls.find((h) => h.id === selectedId) ?? null;
  const visible = useMemo(
    () => (data ? data.halls.filter((h) => typeFilter === 'ALL' || h.type === typeFilter) : []),
    [data, typeFilter],
  );

  async function changeStatus(hall: AdminHall, status: HallStatus) {
    if (status === hall.status) return;
    if (status !== 'ACTIVE' && hall.showtimesOnDate > 0) {
      const ok = window.confirm(
        `${hall.name} has ${hall.showtimesOnDate} showtime(s) on ${date}. ` +
          `Set it to ${status.toLowerCase()}? Customers will not be able to book it.`,
      );
      if (!ok) return;
    }
    setBusy(true);
    try {
      await setHallStatus(hall.id, status);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  /** Dropdown that shows only the current status; click to pick another one. */
  function statusSelect(hall: AdminHall) {
    return (
      <select
        className={`status-select ${hall.status.toLowerCase()}`}
        value={hall.status}
        disabled={busy}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => changeStatus(hall, e.target.value as HallStatus)}
      >
        {STATUSES.map((st) => (
          <option key={st.value} value={st.value}>
            {st.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <section className="admin">
      {error && <div className="notice err">{error}</div>}

      {data && (
        <div className="stats">
          <div className="stat-card">
            <span className="stat-num">{data.totals.halls}</span>
            <span className="stat-label">halls</span>
          </div>
          <div className="stat-card">
            <span className="stat-num ok">{data.totals.active}</span>
            <span className="stat-label">active</span>
          </div>
          <div className="stat-card">
            <span className="stat-num warn">{data.totals.maintenance}</span>
            <span className="stat-label">maintenance</span>
          </div>
          <div className="stat-card">
            <span className="stat-num bad">{data.totals.closed}</span>
            <span className="stat-label">closed</span>
          </div>
        </div>
      )}

      <div className="halls-toolbar">
        <div className="mode-toggle">
          <button
            className={mode === 'halls' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setMode('halls')}
          >
            🏛 By hall
          </button>
          <button
            className={mode === 'list' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setMode('list')}
          >
            📋 Listing
          </button>
        </div>
        <label className="date-pick">
          Date
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
      </div>

      {data === null && !error && <p className="muted">Loading halls…</p>}

      {data && mode === 'halls' && (
        <>
          <div className="type-filter">
            <button
              className={typeFilter === 'ALL' ? 'chip-btn active' : 'chip-btn'}
              onClick={() => setTypeFilter('ALL')}
            >
              All halls ({data.halls.length})
            </button>
            {TYPES.map((t) => (
              <button
                key={t.value}
                className={typeFilter === t.value ? 'chip-btn active' : 'chip-btn'}
                onClick={() => setTypeFilter(t.value)}
              >
                {t.label} ({data.halls.filter((h) => h.type === t.value).length})
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="muted">No halls in this category.</p>
          ) : (
            <main className="grid">
              {visible.map((h) => (
                <article
                  key={h.id}
                  className="card selectable"
                  onClick={() => setSelectedId(h.id)}
                >
                  <div className="poster hall-poster" style={{ background: HEADER_BG[h.type] }}>
                    <span>{h.name}</span>
                  </div>
                  <div className="card-body">
                    <div className="card-top">
                      <h2>{h.name}</h2>
                      <StatusBadge hall={h} />
                    </div>
                    <p className="muted">
                      <span className="chip">{h.typeLabel}</span> · {h.capacity} seats
                    </p>
                    <div className="mini-stats">
                      <span className="mini-stat">
                        <b>{h.moviesOnDate}</b> movies
                      </span>
                      <span className="mini-stat">
                        <b>{h.showtimesOnDate}</b> showtimes
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </main>
          )}
        </>
      )}

      {data && mode === 'list' && (
        <div className="table-wrap">
          <table className="bookings">
            <thead>
              <tr>
                <th>Hall</th>
                <th>Category</th>
                <th>Movies ({date})</th>
                <th>Showtimes</th>
                <th>Seats</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.halls.map((h) => (
                <tr
                  key={h.id}
                  className="row-click"
                  onClick={() => setSelectedId(h.id)}
                >
                  <td>
                    <b>{h.name}</b>
                  </td>
                  <td>{h.typeLabel}</td>
                  <td>{h.moviesOnDate}</td>
                  <td>{h.showtimesOnDate}</td>
                  <td>{h.capacity}</td>
                  <td>
                    {statusSelect(h)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="overlay" onClick={() => setSelectedId(null)}>
          <div className="modal hall-modal hall-detail" onClick={(e) => e.stopPropagation()}>
          <div className="movie-detail-head modal-head-row">
            <h2>{selected.name}</h2>
            <span className="chip">{selected.typeLabel}</span>
            <StatusBadge hall={selected} />
            <button className="close-btn" onClick={() => setSelectedId(null)} title="Close">
              ✕
            </button>
          </div>
          <p className="hall-desc">{selected.description}</p>

          <div className="detail-row">
            <span className="muted">Set status:</span>
            {statusSelect(selected)}
          </div>

          <div className="stats">
            <div className="stat-card">
              <span className="stat-num">{selected.moviesOnDate}</span>
              <span className="stat-label">movies on {date}</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">{selected.showtimesOnDate}</span>
              <span className="stat-label">showtimes</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">{selected.capacity}</span>
              <span className="stat-label">seats</span>
            </div>
          </div>

          {selected.schedule.length === 0 ? (
            <p className="muted">Nothing scheduled in this hall on {date}.</p>
          ) : (
            <div className="table-wrap">
              <table className="bookings">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Movie</th>
                    <th>Seats booked</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.schedule.map((s) => (
                    <tr key={s.showtimeId}>
                      <td>{fmtWhen(s.startsAt)}</td>
                      <td>{s.movieTitle}</td>
                      <td>
                        {s.seatsBooked} / {selected.capacity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3 className="layout-title">Hall layout</h3>
          {layout ? (
            <div className={`layout-preview hall-${layout.hallType.toLowerCase()}`}>
              <div className="screen">SCREEN</div>
              <SeatGrid layout={layout} />
            </div>
          ) : (
            <p className="muted">Loading layout…</p>
          )}
          </div>
        </div>
      )}
    </section>
  );
}
