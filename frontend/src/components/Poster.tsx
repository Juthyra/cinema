import { useState } from 'react';

/**
 * A movie card's poster: the film's own image when it has one, and the coloured
 * initials tile when it does not - or when the image fails to load, which happens
 * whenever a link points at something that has since moved.
 *
 * It takes the three things it needs rather than a whole movie, so the customer grid
 * and the admin's movie list can share one component instead of two copies.
 */
export default function Poster({
  title,
  posterUrl,
  gradient,
}: {
  title: string;
  posterUrl: string | null;
  gradient: string;
}) {
  const [failed, setFailed] = useState(false);

  if (posterUrl && !failed) {
    return (
      <img
        className="poster"
        src={posterUrl}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="poster" style={{ background: gradient }}>
      <span>{title.slice(0, 2)}</span>
    </div>
  );
}
