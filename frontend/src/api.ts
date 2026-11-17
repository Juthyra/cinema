import type { AdminBookings, Movie, ReservePayload, ReservationResult, SeatMap } from './types';

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

export function getAdminBookings(): Promise<AdminBookings> {
  return http<AdminBookings>('/api/admin/bookings');
}
