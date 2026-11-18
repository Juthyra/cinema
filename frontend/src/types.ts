export type HallType = 'STANDARD' | 'FAMILY' | 'COUPLE' | 'MODERN' | 'MIXED';
export type HallStatus = 'ACTIVE' | 'MAINTENANCE' | 'CLOSED';
export type SeatKind = 'STANDARD' | 'FAMILY' | 'COUPLE' | 'RECLINER' | 'SINGLE' | 'ACCESSIBLE';

export interface ShowtimeInfo {
  id: number;
  hall: string;
  hallType: HallType;
  hallTypeLabel: string;
  hallStatus: HallStatus;
  startsAt: string; // ISO local datetime, e.g. 2026-11-17T17:30
}

export interface Movie {
  id: number;
  title: string;
  genre: string;
  durationMinutes: number;
  description: string;
  showtimes: ShowtimeInfo[];
}

export interface SeatInfo {
  row: string;
  number: number;
  taken: boolean;
  customerName: string | null;
  kind: SeatKind;
  section: string;
  gapBefore: boolean; // aisle to the left of this seat
}

export interface SeatMap {
  showtimeId: number;
  movieTitle: string;
  hall: string;
  startsAt: string;
  hallType: HallType;
  hallTypeLabel: string;
  hallDescription: string;
  maxSeats: number;
  rows: string[];
  seatsPerRow: number;
  seats: SeatInfo[];
}

export interface ReservePayload {
  showtimeId: number;
  customerName: string;
  customerEmail: string;
  seats: { row: string; seatNumber: number }[];
}

export interface ReservationResult {
  id: number;
  showtimeId: number;
  row: string;
  seatNumber: number;
  customerName: string;
  customerEmail: string;
}

export interface BookingGroup {
  showtimeId: number;
  movieTitle: string;
  hall: string;
  startsAt: string;
  customerName: string;
  customerEmail: string;
  seats: string[];
  bookedAt: string;
}

export interface AdminBookings {
  totals: { bookings: number; seats: number; customers: number };
  bookings: BookingGroup[];
}

export interface MovieCustomer {
  name: string;
  email: string;
  seats: string[];
  showtimes: string[];
}

export interface AdminMovieStats {
  movieId: number;
  title: string;
  genre: string;
  durationMinutes: number;
  description: string;
  bookings: number;
  seatsBooked: number;
  customers: number;
  customerList: MovieCustomer[];
}

export interface AdminMovies {
  movies: AdminMovieStats[];
}

export interface HallScheduleItem {
  showtimeId: number;
  movieTitle: string;
  startsAt: string;
  seatsBooked: number;
}

export interface AdminHall {
  id: number;
  name: string;
  type: HallType;
  typeLabel: string;
  description: string;
  status: HallStatus;
  statusLabel: string;
  capacity: number;
  moviesOnDate: number;
  showtimesOnDate: number;
  schedule: HallScheduleItem[];
}

export interface AdminHalls {
  date: string; // yyyy-mm-dd
  totals: { halls: number; active: number; maintenance: number; closed: number };
  halls: AdminHall[];
}

export interface HallLayout {
  hallId: number;
  hall: string;
  hallType: HallType;
  hallTypeLabel: string;
  hallDescription: string;
  maxSeats: number;
  rows: string[];
  seatsPerRow: number;
  seats: SeatInfo[];
}
