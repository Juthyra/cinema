import { useEffect, useState } from 'react';
import { getSeatMap, reserveSeats } from '../api';
import type { SeatMap, ShowtimeInfo } from '../types';

interface Props {
  movieTitle: string;
  showtime: ShowtimeInfo;
  onClose: () => void;
}

const MAX_SEATS = 4;

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} at ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

export default function SeatMapView({ movieTitle, showtime, onClose }: Props) {
  const [map, setMap] = useState<SeatMap | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]); // seat keys like "A3"
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

  function toggle(key: string) {
    if (confirmed) return;
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= MAX_SEATS) return prev;
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
        seats: selected.map((k) => ({
          row: k.slice(0, -1),
          seatNumber: parseInt(k.slice(-1), 10),
        })),
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

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>{movieTitle}</h2>
            <p className="sub">
              {fmtWhen(showtime.startsAt)} · {showtime.hall}
            </p>
          </div>
          <button className="close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {loadError && <div className="notice err">{loadError}</div>}

        {map && (
          <>
            <div className="screen">SCREEN</div>
            <div className="legend">
              <span className="lg free">Available</span>
              <span className="lg selected">Selected</span>
              <span className="lg taken">Taken</span>
            </div>
            {map.rows.map((row) => (
              <div className="seatrow" key={row}>
                <span className="rowlabel">{row}</span>
                {Array.from({ length: map.seatsPerRow }, (_, i) => i + 1).map((n) => {
                  const key = `${row}${n}`;
                  const seat = map.seats.find((s) => s.row === row && s.number === n);
                  const taken = !!seat?.taken;
                  const isSel = selected.includes(key);
                  return (
                    <button
                      key={key}
                      className={`seat ${taken ? 'taken' : isSel ? 'selected' : 'free'}`}
                      title={taken && seat?.customerName ? `Taken by ${seat.customerName}` : key}
                      disabled={taken}
                      onClick={() => toggle(key)}
                    >
                      {taken && seat?.customerName ? seat.customerName.slice(0, 1) : n}
                    </button>
                  );
                })}
                <span className="rowlabel">{row}</span>
              </div>
            ))}

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
                      ? `Book ${selected.length} seat${selected.length > 1 ? 's' : ''} (max ${MAX_SEATS})`
                      : `Pick up to ${MAX_SEATS} seats`}
                </button>
                <span className="hint">
                  {selected.length === MAX_SEATS && 'Max seats reached — deselect one to change.'}
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
