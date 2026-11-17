import { useCallback, useEffect, useState } from 'react';
import { getMovies } from './api';
import type { Movie, ShowtimeInfo } from './types';
import SeatMapView from './components/SeatMapView';

interface Selection {
  movie: Movie;
  showtime: ShowtimeInfo;
}

function fmtDuration(min: number): string {
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function fmtShowtime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const day =
    d.toDateString() === today.toDateString()
      ? 'Today'
      : d.toDateString() === tomorrow.toDateString()
        ? 'Tomorrow'
        : d.toLocaleDateString(undefined, { weekday: 'short' });
  return `${day} ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

const GRADIENTS = [
  'linear-gradient(135deg, #1e3a5f, #0f1c2e)',
  'linear-gradient(135deg, #5f1e3a, #2e0f1c)',
  'linear-gradient(135deg, #3a5f1e, #1c2e0f)',
  'linear-gradient(135deg, #5f5a1e, #2e2a0f)',
  'linear-gradient(135deg, #1e5f5a, #0f2e2a)',
];

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<Selection | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMovies(await getMovies());
      setError(null);
    } catch (e) {
      setError(
        `${(e as Error).message} — is the Spring Boot backend running on http://localhost:8080 ?`,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page">
      <header className="masthead">
        <h1>🎬 Starline Cinema</h1>
        <p>Pick a film, pick your seats, done.</p>
      </header>

      {loading && <p className="muted">Loading the program…</p>}

      {error && (
        <div className="banner error">
          <span>{error}</span>
          <button onClick={load}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <main className="grid">
          {movies.map((movie, i) => (
            <article key={movie.id} className="card">
              <div className="poster" style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
                <span>{movie.title.slice(0, 2)}</span>
              </div>
              <div className="card-body">
                <div className="card-top">
                  <h2>{movie.title}</h2>
                  <span className="chip">{movie.genre}</span>
                </div>
                <p className="muted">{fmtDuration(movie.durationMinutes)}</p>
                <p className="description">{movie.description}</p>
                <div className="showtimes">
                  {movie.showtimes.map((st) => (
                    <button
                      key={st.id}
                      className="showtime"
                      onClick={() => setSelection({ movie, showtime: st })}
                    >
                      {fmtShowtime(st.startsAt)}
                      <small>{st.hall}</small>
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </main>
      )}

      {selection && (
        <SeatMapView
          movieTitle={selection.movie.title}
          showtime={selection.showtime}
          onClose={() => setSelection(null)}
        />
      )}
    </div>
  );
}
