import type {
  AdminBookings,
  AdminHalls,
  AdminMovies,
  HallLayout,
  HallStatus,
  Movie,
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

export function getAdminHalls(date: string): Promise<AdminHalls> {
  return http<AdminHalls>(`/api/admin/halls?date=${encodeURIComponent(date)}`);
}

export function getHallLayout(hallId: number): Promise<HallLayout> {
  return http<HallLayout>(`/api/admin/halls/${hallId}/layout`);
}

export function setHallStatus(
  hallId: number,
  status: HallStatus,
): Promise<{ hallId: number; status: HallStatus }> {
  return http(`/api/admin/halls/${hallId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}
