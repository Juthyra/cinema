import { useCallback, useEffect, useState } from 'react';
import { cancelTicket, getTickets } from '../api';
import type { Ticket } from '../types';
import { fmtDuration, fmtShowtime, fmtWhen } from '../lib/format';

/** Kept between visits so someone who just booked sees their ticket immediately. */
const EMAIL_KEY = 'cinema.customerEmail';

function rememberedEmail(): string {
  try {
    return localStorage.getItem(EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
}

/**
 * Customer view: enter the email you booked with and see every ticket —
 * movie, hall, showtime, seats, booking reference, when it was booked.
 * An upcoming ticket can be downloaded as a PDF or cancelled.
 */
export default function TicketsView() {
  const [email, setEmail] = useState(rememberedEmail);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lookedUp, setLookedUp] = useState('');
  const [busyRef, setBusyRef] = useState<string | null>(null);
  const [confirmRef, setConfirmRef] = useState<string | null>(null);

  const lookup = useCallback(async (value: string) => {
    const clean = value.trim();
    if (!clean.includes('@')) {
      setError('Enter the email address you booked with.');
      setTickets(null);
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const found = await getTickets(clean);
      setTickets(found);
      setLookedUp(clean);
    } catch (e) {
      setError((e as Error).message);
      setTickets(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = rememberedEmail();
    if (saved.includes('@')) void lookup(saved);
  }, [lookup]);

  /** Imported on demand: the PDF library is ~1 MB, no need to load it up front. */
  async function savePdf(ticket: Ticket) {
    setBusyRef(ticket.reference);
    try {
      const { downloadTicketPdf } = await import('../lib/ticketPdf');
      downloadTicketPdf(ticket);
    } catch (e) {
      setError(`Could not build the PDF: ${(e as Error).message}`);
    } finally {
      setBusyRef(null);
    }
  }

  async function cancel(ticket: Ticket) {
    setBusyRef(ticket.reference);
    setError(null);
    try {
      await cancelTicket(ticket.customerEmail, ticket.reference);
      setConfirmRef(null);
      // Refresh first: lookup() clears the notice, so set it afterwards.
      await lookup(ticket.customerEmail);
      setNotice(
        `Cancelled ${ticket.seats.length} seat${ticket.seats.length > 1 ? 's' : ''} for ${
          ticket.movieTitle
        }. Those seats are free again.`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyRef(null);
    }
  }

  return (
    <section className="tickets">
      <form
        className="tickets-form"
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(email);
        }}
      >
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Looking up…' : 'Find my tickets'}
        </button>
        <span className="muted">Use the email address you booked with.</span>
      </form>

      {error && <div className="notice err">{error}</div>}
      {notice && <div className="notice ok">{notice}</div>}

      {tickets &&
        !error &&
        (tickets.length === 0 ? (
          <p className="muted">
            No tickets for {lookedUp} yet — book seats from the Movies tab and they appear here.
          </p>
        ) : (
          <>
            <p className="muted">
              {tickets.length} booking{tickets.length > 1 ? 's' : ''} for {lookedUp}
            </p>
            <div className="ticket-list">
              {tickets.map((t) => (
                <article key={t.reference} className={t.upcoming ? 'ticket' : 'ticket past'}>
                  <div className="ticket-main">
                    <div className="ticket-top">
                      <h3>{t.movieTitle}</h3>
                      <span className="chip">{t.genre}</span>
                      <span className={t.upcoming ? 'ticket-badge up' : 'ticket-badge done'}>
                        {t.upcoming ? 'Upcoming' : 'Watched'}
                      </span>
                    </div>
                    <p className="ticket-when">
                      {fmtWhen(t.startsAt)} · {t.hall} · {t.hallTypeLabel}
                    </p>
                    <p className="muted">{fmtDuration(t.durationMinutes)}</p>
                    <div className="seat-tags">
                      {t.seats.map((s) => (
                        <span key={s} className="seat-tag">
                          {s}
                        </span>
                      ))}
                    </div>
                    <p className="muted">
                      {t.seats.length} seat{t.seats.length > 1 ? 's' : ''} · booked{' '}
                      {fmtWhen(t.bookedAt)}
                    </p>
                  </div>

                  <div className="ticket-stub">
                    <span className="ticket-ref">{t.reference}</span>
                    <span className="ticket-showtime">{fmtShowtime(t.startsAt)}</span>
                    <span className="muted">{t.customerName}</span>
                    <span className="muted ticket-email">{t.customerEmail}</span>
                    <button
                      className="ticket-download"
                      onClick={() => void savePdf(t)}
                      disabled={busyRef === t.reference}
                      title="Download this ticket as a PDF"
                    >
                      {busyRef === t.reference ? 'Working…' : '⬇ Download PDF'}
                    </button>
                    {t.upcoming && (
                      <button
                        className={
                          confirmRef === t.reference ? 'ticket-cancel confirm' : 'ticket-cancel'
                        }
                        onClick={() =>
                          confirmRef === t.reference ? void cancel(t) : setConfirmRef(t.reference)
                        }
                        disabled={busyRef === t.reference}
                        title="Cancel this booking and free the seats"
                      >
                        {busyRef === t.reference
                          ? 'Cancelling…'
                          : confirmRef === t.reference
                            ? 'Yes, cancel it'
                            : 'Cancel booking'}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        ))}
    </section>
  );
}
