import { useEffect, useMemo, useState } from 'react';
import { getSeatMap, reserveSeats } from '../api';
import type { SeatInfo, SeatKind, SeatMap, ShowtimeInfo } from '../types';

interface Props {
  movieTitle: string;
  showtime: ShowtimeInfo;
  onClose: () => void;
}

const KIND_NOTE: Record<SeatKind, string> = {
  STANDARD: '',
  FAMILY: 'sit together in pods of 4',
  COUPLE: 'love seats, each seat fits 2 people',
  RECLINER: 'premium recliners',
  SINGLE: 'single seats',
  ACCESSIBLE: 'wheelchair-accessible spaces',
};

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} at ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

function seatLabel(seat: SeatInfo): string {
  if (seat.taken && seat.customerName) return seat.customerName.slice(0, 1);
  if (seat.kind === 'ACCESSIBLE') return '♿';
  if (seat.kind === 'COUPLE') return `♥${seat.number}`;
  return String(seat.number);
}

export default function SeatMapView({ movieTitle, showtime, onClose }: Props) {
  const [map, setMap] = useState<SeatMap | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]); // seat keys like "A3" / "A10"
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [bookError, setBookError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    getSeatMap(showtime.id)
      .then((m) => {
        if (!cancelled) setMap(m);
      })
      .catch((e) => {
        if (!cancelled) setLoadError((e as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [showtime.id]);

  // Seats grouped by row, in layout order.
  const rows = useMemo(() => {
    if (!map) return [];
    return map.rows.map((row) => ({ row, seats: map.seats.filter((s) => s.row === row) }));
  }, [map]);
  const multiSection = useMemo(
    () => (map ? new Set(map.seats.map((s) => s.section)).size > 1 : false),
    [map],
  );

  const maxSeats = map?.maxSeats ?? 4;

  function toggle(key: string) {
    if (confirmed) return;
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= maxSeats) return prev;
      return [...prev, key];
    });
  }

  async function handleReserve() {
    if (!map || selected.length === 0) return;
    setBooking(true);
    setBookError(null);
    try {
      await reserveSeats({
        showtimeId: map.showtimeId,
        customerName: name.trim(),
        customerEmail: email.trim(),
        seats: selected.map((k) => {
          const seat = map.seats.find((s) => `${s.row}${s.number}` === k)!;
          return { row: seat.row, seatNumber: seat.number };
        }),
      });
      setConfirmed(
        `Booked ${selected.length} seat${selected.length > 1 ? 's' : ''}: ${selected
          .slice()
          .sort()
          .join(', ')}. A confirmation would go to ${email.trim()}.`,
      );
      setSelected([]);
      getSeatMap(map.showtimeId).then(setMap);
    } catch (e) {
      setBookError((e as Error).message);
      getSeatMap(map.showtimeId).then(setMap);
    } finally {
      setBooking(false);
    }
  }

  const hallClass = map ? `hall-${map.hallType.toLowerCase()}` : '';

  return (
    <div className="overlay" onClick={onClose}>
      <div className={`modal ${hallClass}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>{movieTitle}</h2>
            <p className="sub">
              {fmtWhen(showtime.startsAt)} · {showtime.hall} · {showtime.hallTypeLabel}
            </p>
          </div>
          <button className="close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {loadError && <div className="notice err">{loadError}</div>}

        {map && (
          <>
            <p className="hall-desc">{map.hallDescription}</p>
            <div className="screen">SCREEN</div>
            <div className="legend">
              <span className="lg free">Available</span>
              <span className="lg selected">Selected</span>
              <span className="lg taken">Taken</span>
            </div>
            {rows.map(({ row, seats }, ri) => {
              const prevSection = ri > 0 ? rows[ri - 1].seats[0]?.section : null;
              const section = seats[0]?.section;
              const mid = (seats.length - 1) / 2;
              return (
                <div key={row}>
                  {multiSection && section !== prevSection && (
                    <div className="section-title">
                      {section}
                      {KIND_NOTE[seats[0].kind] && <small> - {KIND_NOTE[seats[0].kind]}</small>}
                    </div>
                  )}
                  <div className="seatrow">
                    <span className="rowlabel">{row}</span>
                    {seats.map((seat, i) => {
                      const key = `${seat.row}${seat.number}`;
                      const isSel = selected.includes(key);
                      const state = seat.taken ? 'taken' : isSel ? 'selected' : 'free';
                      // Modern hall: rows curve around the screen (outer seats sit higher).
                      const style =
                        map.hallType === 'MODERN'
                          ? { transform: `translateY(${-Math.round((i - mid) ** 2 * 1.4)}px)` }
                          : undefined;
                      const hint =
                        seat.kind === 'COUPLE'
                          ? ' (2 people)'
                          : seat.kind === 'ACCESSIBLE'
                            ? ' (wheelchair space)'
                            : '';
                      return (
                        <span key={key} className={seat.gapBefore ? 'gap-before' : undefined}>
                          <button
                            className={`seat kind-${seat.kind.toLowerCase()} ${state}`}
                            style={style}
                            title={
                              seat.taken && seat.customerName
                                ? `Taken by ${seat.customerName}`
                                : `${key}${hint}`
                            }
                            disabled={seat.taken}
                            onClick={() => toggle(key)}
                          >
                            {seatLabel(seat)}
                          </button>
                        </span>
                      );
                    })}
                    <span className="rowlabel">{row}</span>
                  </div>
                </div>
              );
            })}

            <div className="form">
              <div className="form-row">
                <input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="actions">
                <button
                  className="reserve-btn"
                  disabled={
                    selected.length === 0 ||
                    name.trim() === '' ||
                    !email.trim().includes('@') ||
                    booking
                  }
                  onClick={handleReserve}
                >
                  {booking
                    ? 'Booking…'
                    : selected.length > 0
                      ? `Book ${selected.length} seat${selected.length > 1 ? 's' : ''} (max ${maxSeats})`
                      : `Pick up to ${maxSeats} seats`}
                </button>
                <span className="hint">
                  {selected.length === maxSeats && 'Max seats reached — deselect one to change.'}
                </span>
              </div>
            </div>

            {confirmed && <div className="notice ok">{confirmed}</div>}
            {bookError && <div className="notice err">{bookError}</div>}
          </>
        )}
      </div>
    </div>
  );
}
