import { useEffect, useId, useMemo, useState } from 'react';
import { getSeatMap, reserveSeats } from '../api';
import type { SeatInfo, SeatKind, SeatMap, ShowtimeInfo } from '../types';
import { fmtMoney } from '../lib/format';
import Dialog from './Dialog';

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

const KIND_LABEL: Record<SeatKind, string> = {
  STANDARD: 'Standard',
  FAMILY: 'Family pod',
  COUPLE: 'Love seat',
  RECLINER: 'Recliner',
  SINGLE: 'Single',
  ACCESSIBLE: 'Accessible',
};

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} at ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

function seatLabel(seat: SeatInfo): string {
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
  const nameId = useId();
  const emailId = useId();
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

  // Price per seat, and the running total of what is currently selected.
  const priceBySeat = useMemo(() => {
    const price = new Map<string, number>();
    map?.seats.forEach((s) => price.set(`${s.row}${s.number}`, s.priceSen));
    return price;
  }, [map]);
  const totalSen = selected.reduce((sum, key) => sum + (priceBySeat.get(key) ?? 0), 0);

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
          .join(', ')} · ${fmtMoney(totalSen)}. A confirmation would go to ${email.trim()}.`,
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
    <Dialog
      title={movieTitle}
      subtitle={`${fmtWhen(showtime.startsAt)} · ${showtime.hall} · ${showtime.hallTypeLabel}`}
      className={hallClass}
      onClose={onClose}
    >

        {loadError && (
          <div className="notice err" role="alert">
            {loadError}
          </div>
        )}

        {map && (
          <>
            <p className="hall-desc">{map.hallDescription}</p>
            <p className="price-legend">
              {[...new Set(map.seats.map((s) => s.kind))].map((kind) => (
                <span key={kind} className="price-item">
                  {KIND_LABEL[kind]}{' '}
                  <b>{fmtMoney(map.seats.find((s) => s.kind === kind)?.priceSen ?? 0)}</b>
                </span>
              ))}
            </p>
            <div className="screen" aria-hidden="true">
              SCREEN
            </div>
            <div className="legend">
              <span className="lg free">Available</span>
              <span className="lg selected">Selected</span>
              <span className="lg taken">Taken</span>
            </div>
            <div className="seatmap" role="group" aria-label="Seats, screen at the top">
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
                      const description = seat.taken
                        ? `${key}${hint}, taken`
                        : `${key}${hint}, ${KIND_LABEL[seat.kind]}, ${fmtMoney(seat.priceSen)}`;
                      return (
                        <span key={key} className={seat.gapBefore ? 'gap-before' : undefined}>
                          <button
                            type="button"
                            className={`seat kind-${seat.kind.toLowerCase()} ${state}`}
                            style={style}
                            title={description}
                            aria-label={description}
                            aria-pressed={seat.taken ? undefined : isSel}
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
            </div>

            <div className="form">
              <div className="form-row">
                <div className="field">
                  <label htmlFor={nameId}>Your name</label>
                  <input
                    id={nameId}
                    autoComplete="name"
                    placeholder="e.g. Aisha Rahman"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor={emailId}>Email</label>
                  <input
                    id={emailId}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="actions">
                <button
                  type="button"
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
                      ? `Book ${selected.length} seat${selected.length > 1 ? 's' : ''} · ${fmtMoney(totalSen)}`
                      : `Pick up to ${maxSeats} seats`}
                </button>
                <span className="hint" aria-live="polite">
                  {selected.length === maxSeats
                    ? `Max ${maxSeats} seats reached — deselect one to change.`
                    : selected.length > 0
                      ? `Total ${fmtMoney(totalSen)} for ${selected.length} seat${selected.length > 1 ? 's' : ''}`
                      : `Max ${maxSeats} seats per booking`}
                </span>
              </div>
            </div>

            {confirmed && (
              <div className="notice ok" role="status">
                {confirmed}
              </div>
            )}
            {bookError && (
              <div className="notice err" role="alert">
                {bookError}
              </div>
            )}
          </>
        )}
    </Dialog>
  );
}
