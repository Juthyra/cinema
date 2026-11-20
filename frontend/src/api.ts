import type {
  AdminBookings,
  AdminMovies,
  Movie,
  ReservePayload,
  ReservationResult,
  SeatMap,
  Ticket,
} from './types';

// Relative by default: the Vite dev server proxies /api to the backend.
// Set VITE_API_URL to point at a backend on another host/port.
const API_BASE: string = import.meta.env.VITE_API_URL ?? '';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // non-JSON error body; keep the default message
    }
    throw new Error(message);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export function getMovies(): Promise<Movie[]> {
  return http<Movie[]>('/api/movies');
}

export function getSeatMap(showtimeId: number): Promise<SeatMap> {
  return http<SeatMap>(`/api/showtimes/${showtimeId}/seats`);
}

export function reserveSeats(payload: ReservePayload): Promise<ReservationResult[]> {
  return http<ReservationResult[]>('/api/reservations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getTickets(email: string): Promise<Ticket[]> {
  return http<Ticket[]>(`/api/tickets?email=${encodeURIComponent(email)}`);
}

export function cancelTicket(email: string, reference: string): Promise<void> {
  const query = `email=${encodeURIComponent(email)}&reference=${encodeURIComponent(reference)}`;
  return http<void>(`/api/tickets?${query}`, { method: 'DELETE' });
}

export function getAdminBookings(): Promise<AdminBookings> {
  return http<AdminBookings>('/api/admin/bookings');
}

export function getAdminMovies(): Promise<AdminMovies> {
  return http<AdminMovies>('/api/admin/movies');
}
