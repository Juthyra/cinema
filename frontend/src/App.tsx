import { useCallback, useEffect, useState } from 'react';
import { getMovies } from './api';
import type { Movie, ShowtimeInfo } from './types';
import SeatMapView from './components/SeatMapView';
import AdminView from './components/AdminView';
import { fmtDuration, fmtShowtime, GRADIENTS } from './lib/format';

interface Selection {
  movie: Movie;
  showtime: ShowtimeInfo;
}

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [view, setView] = useState<'movies' | 'admin'>('movies');

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
        <nav className="nav">
          <button
            className={view === 'movies' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setView('movies')}
          >
            Movies
          </button>
          <button
            className={view === 'admin' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setView('admin')}
          >
            Admin · Bookings
          </button>
        </nav>
      </header>

      {loading && <p className="muted">Loading the program…</p>}

      {error && (
        <div className="banner error">
          <span>{error}</span>
          <button onClick={load}>Retry</button>
        </div>
      )}

      {view === 'movies' && !loading && !error && (
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

      {view === 'admin' && <AdminView />}

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
