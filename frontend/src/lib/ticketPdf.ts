import { jsPDF } from 'jspdf';
import type { Ticket } from '../types';

/**
 * Renders a ticket as a real PDF (A5 landscape, vector text so it stays sharp
 * when printed). Kept out of the components so the layout can be tuned without
 * touching the views.
 */

const PAGE_W = 210;
const PAGE_H = 148;
const CARD_X = 6;
const CARD_Y = 6;
const CARD_W = PAGE_W - CARD_X * 2;
const CARD_H = PAGE_H - CARD_Y * 2;
const STUB_X = 138;
const STUB_CX = (STUB_X + PAGE_W - CARD_X) / 2;

const INK = [20, 24, 31] as const;
const MUTED = [122, 129, 142] as const;
const GOLD = [245, 197, 24] as const;
const GOLD_DARK = [176, 138, 0] as const;
const PAPER = [250, 248, 242] as const;
const LINE = [226, 221, 208] as const;
const STAMP = [110, 118, 132] as const;

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** The built-in PDF fonts are single-byte; keep every string inside it. */
function ascii(value: string): string {
  return value
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u00b7/g, '-')
    .replace(/[^\x20-\x7E]/g, '?');
}

function dateParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { date, time };
}

function fitted(doc: jsPDF, value: string, maxWidth: number, size: number): string {
  doc.setFontSize(size);
  if (doc.getTextWidth(value) <= maxWidth) return value;
  let text = value;
  while (text.length > 1 && doc.getTextWidth(`${text}...`) > maxWidth) {
    text = text.slice(0, -1);
  }
  return `${text}...`;
}

export function buildTicketPdf(ticket: Ticket): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });

  // Paper + card
  doc.setFillColor(...PAPER).rect(0, 0, PAGE_W, PAGE_H, 'F');
  doc.setFillColor(255, 255, 255).setDrawColor(...LINE).setLineWidth(0.3);
  doc.roundedRect(CARD_X, CARD_Y, CARD_W, CARD_H, 3, 3, 'FD');
  doc.setFillColor(...GOLD).rect(CARD_X, CARD_Y, 3, CARD_H, 'F');

  // Header
  doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(...GOLD_DARK);
  doc.text('STARLINE CINEMA', 18, 19);

  doc.setFontSize(21).setTextColor(...INK);
  doc.text(fitted(doc, ascii(ticket.movieTitle), 112, 21), 18, 31);
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...MUTED);
  doc.text(ascii(`${ticket.genre} - ${ticket.durationMinutes} min`), 18, 38);

  if (!ticket.upcoming) {
    doc.setFillColor(...PAPER).setDrawColor(...LINE).setLineWidth(0.3);
    doc.roundedRect(104, 15, 28, 8, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold').setFontSize(7).setTextColor(...STAMP);
    doc.text('ATTENDED', 118, 20.4, { align: 'center' });
  }

  // Separator
  doc.setDrawColor(...LINE).setLineWidth(0.25).setLineDashPattern([1, 1], 0);
  doc.line(18, 46, STUB_X - 8, 46);
  doc.setLineDashPattern([], 0);

  // Detail grid: DATE | TIME | HALL over SEATS | DURATION | BOOKED
  const when = dateParts(ticket.startsAt);
  const booked = dateParts(ticket.bookedAt);
  const columns = [18, 58, 96];
  const fields: Array<[string, string, number, number]> = [
    ['DATE', when.date, columns[0], 58],
    ['TIME', when.time, columns[1], 58],
    ['HALL', `${ticket.hall} - ${ticket.hallTypeLabel}`, columns[2], 58],
    ['SEATS', `${ticket.seats.join(', ')} (${ticket.seats.length})`, columns[0], 78],
    ['DURATION', `${Math.floor(ticket.durationMinutes / 60)}h ${ticket.durationMinutes % 60}m`, columns[1], 78],
    ['BOOKED', `${booked.date} ${booked.time}`, columns[2], 78],
  ];
  for (const [label, value, x, y] of fields) {
    doc.setFont('helvetica', 'bold').setFontSize(6.6).setTextColor(...MUTED);
    doc.text(label, x, y);
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...INK);
    doc.text(fitted(doc, ascii(value), STUB_X - x - 6, 10), x, y + 6);
  }

  // Stub: perforation + reference + barcode + customer
  doc.setFillColor(...PAPER).setDrawColor(...LINE).setLineWidth(0.25);
  doc.setLineDashPattern([1.2, 1.2], 0);
  doc.line(STUB_X, CARD_Y, STUB_X, CARD_Y + CARD_H);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'bold').setFontSize(7).setTextColor(...MUTED);
  doc.text('ADMIT ONE', STUB_CX, 22, { align: 'center' });
  doc.setFontSize(15).setTextColor(...INK);
  doc.text(ticket.reference, STUB_CX, 34, { align: 'center' });

  // Deterministic barcode: the reference picks the bar pattern
  const bars = (() => {
    const out: Array<{ w: number; gap: number }> = [];
    let seed = 7;
    for (const ch of ticket.reference) seed = (seed * 31 + ch.charCodeAt(0)) % 100000;
    for (let i = 0; i < 34; i++) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      out.push({ w: 0.5 + ((seed >> 8) % 3) * 0.5, gap: 0.6 + ((seed >> 4) % 2) * 0.5 });
    }
    return out;
  })();
  const barcodeW = bars.reduce((sum, b) => sum + b.w + b.gap, 0) - bars[bars.length - 1].gap;
  let cursor = STUB_CX - barcodeW / 2;
  doc.setFillColor(...INK);
  for (const bar of bars) {
    doc.rect(cursor, 42, bar.w, 13, 'F');
    cursor += bar.w + bar.gap;
  }

  doc.setFont('helvetica', 'bold').setFontSize(10.5).setTextColor(...INK);
  doc.text(fitted(doc, ascii(ticket.customerName), 62, 10.5), STUB_CX, 68, { align: 'center' });
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTED);
  doc.text(fitted(doc, ascii(ticket.customerEmail), 64, 8), STUB_CX, 74, { align: 'center' });
  doc.setFontSize(9).setTextColor(...INK);
  doc.text(`${ticket.seats.length} seat${ticket.seats.length > 1 ? 's' : ''}`, STUB_CX, 86, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal').setFontSize(6.8).setTextColor(...MUTED);
  doc.text('Show this ticket at the door.', STUB_CX, 128, { align: 'center' });

  // Footer
  doc.setFontSize(7.5).setTextColor(...MUTED);
  doc.text(
    ascii(`Starline Cinema - booking ${ticket.reference} - booked ${booked.date} ${booked.time}`),
    18,
    133,
  );

  return doc;
}

export function downloadTicketPdf(ticket: Ticket): void {
  buildTicketPdf(ticket).save(`starline-ticket-${ticket.reference}.pdf`);
}
