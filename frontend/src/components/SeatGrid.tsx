import { useMemo } from 'react';
import type { SeatInfo, SeatKind, HallType } from '../types';

/** The part of a seat map / hall layout needed to draw seats. */
export interface GridLayout {
  hallType: HallType;
  rows: string[];
  seats: SeatInfo[];
}

interface Props {
  layout: GridLayout;
  /** Selected seat keys like "A3". Omit together with onToggle for a read-only preview. */
  selected?: string[];
  onToggle?: (key: string) => void;
}

const KIND_NOTE: Record<SeatKind, string> = {
  STANDARD: '',
  FAMILY: 'sit together in pods of 4',
  COUPLE: 'love seats, each seat fits 2 people',
  RECLINER: 'premium recliners',
  SINGLE: 'single seats',
  ACCESSIBLE: 'wheelchair-accessible spaces',
};

function seatLabel(seat: SeatInfo): string {
  if (seat.taken && seat.customerName) return seat.customerName.slice(0, 1);
  if (seat.kind === 'ACCESSIBLE') return '♿';
  if (seat.kind === 'COUPLE') return `♥${seat.number}`;
  return String(seat.number);
}

/** Draws the rows/seats of a hall: aisles, section headings, curved Modern rows. */
export default function SeatGrid({ layout, selected = [], onToggle }: Props) {
  const rows = useMemo(
    () => layout.rows.map((row) => ({ row, seats: layout.seats.filter((s) => s.row === row) })),
    [layout],
  );
  const multiSection = useMemo(
    () => new Set(layout.seats.map((s) => s.section)).size > 1,
    [layout],
  );
  const readOnly = !onToggle;

  return (
    <>
      {rows.map(({ row, seats }, ri) => {
        const prevSection = ri > 0 ? rows[ri - 1].seats[0]?.section : null;
        const section = seats[0]?.section;
        const mid = (seats.length - 1) / 2;
        return (
          <div key={row}>
            {multiSection && section !== prevSection && (
              <div className="section-title">
                {section}
                {KIND_NOTE[seats[0].kind] && <small> - {KIND_NOTE[seats[0].kind]}</small>}
              </div>
            )}
            <div className="seatrow">
              <span className="rowlabel">{row}</span>
              {seats.map((seat, i) => {
                const key = `${seat.row}${seat.number}`;
                const isSel = selected.includes(key);
                const state = seat.taken ? 'taken' : isSel ? 'selected' : 'free';
                // Modern hall: rows curve around the screen (outer seats sit higher).
                const style =
                  layout.hallType === 'MODERN'
                    ? { transform: `translateY(${-Math.round((i - mid) ** 2 * 1.4)}px)` }
                    : undefined;
                const hint =
                  seat.kind === 'COUPLE'
                    ? ' (2 people)'
                    : seat.kind === 'ACCESSIBLE'
                      ? ' (wheelchair space)'
                      : '';
                return (
                  <span key={key} className={seat.gapBefore ? 'gap-before' : undefined}>
                    <button
                      className={`seat kind-${seat.kind.toLowerCase()} ${state}${readOnly ? ' readonly' : ''}`}
                      style={style}
                      title={
                        seat.taken && seat.customerName
                          ? `Taken by ${seat.customerName}`
                          : `${key}${hint}`
                      }
                      disabled={seat.taken}
                      tabIndex={readOnly ? -1 : undefined}
                      onClick={onToggle ? () => onToggle(key) : undefined}
                    >
                      {seatLabel(seat)}
                    </button>
                  </span>
                );
              })}
              <span className="rowlabel">{row}</span>
            </div>
          </div>
        );
      })}
    </>
  );
}
