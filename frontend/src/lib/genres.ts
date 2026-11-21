/**
 * Film genres.
 *
 * Taken from IMDb's genre list (https://help.imdb.com/article/contribution/titles/genres/GZDRMS6R742JRGAG),
 * minus the categories that only make sense for television or adult content
 * (Talk-Show, Reality-TV, Game Show, News, Adult) - a cinema does not screen those.
 *
 * The admin form shows these in a dropdown so genres stay consistent across
 * movies instead of drifting into near-duplicates ("Sci-fi", "SciFi", "sci fi").
 * It is a UI convenience only: the API still accepts any genre string, and
 * `genresInUse()` adds whatever is already stored so editing an older movie
 * never silently rewrites its genre.
 */
export const GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Biography',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'Film Noir',
  'History',
  'Horror',
  'Music',
  'Musical',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Short',
  'Sport',
  'Thriller',
  'War',
  'Western',
];

/** The standard list plus any genre already stored on a movie, sorted for the dropdown. */
export function genresInUse(stored: string[]): string[] {
  const all = new Set(GENRES);
  stored.forEach((genre) => {
    const trimmed = genre.trim();
    if (trimmed) all.add(trimmed);
  });
  return [...all].sort((a, b) => a.localeCompare(b));
}
