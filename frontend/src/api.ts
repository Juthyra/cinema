import type {
  AdminBookings,
  AdminMovies,
  Movie,
  MovieInput,
  ReservePayload,
  ReservationResult,
  SeatMap,
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
  // 204 No Content (a successful DELETE) has no body to parse.
  if (res.status === 204) return undefined as T;
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

export function getAdminMovies(): Promise<AdminMovies> {
  return http<AdminMovies>('/api/admin/movies');
}

// Admin movie management. The backend refuses a duplicate title (409) and
// refuses to delete a movie that still has booked seats (409).

export function createMovie(input: MovieInput): Promise<Movie> {
  return http<Movie>('/api/admin/movies', { method: 'POST', body: JSON.stringify(input) });
}

export function updateMovie(id: number, input: MovieInput): Promise<Movie> {
  return http<Movie>(`/api/admin/movies/${id}`, { method: 'PUT', body: JSON.stringify(input) });
}

export function deleteMovie(id: number): Promise<void> {
  return http<void>(`/api/admin/movies/${id}`, { method: 'DELETE' });
}
