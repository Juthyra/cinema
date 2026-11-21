import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  /** How far the - and + buttons move the value in one press. */
  step?: number;
  /** Small grey note inside the field, e.g. the runtime shown as "2h 8m". */
  hint?: string;
  /** Accessible name, e.g. "Duration in minutes". */
  label: string;
}

/**
 * A number field with - / + buttons.
 *
 * A native <input type="number"> draws the browser's own spinner arrows. They
 * cannot be styled away everywhere, and they are what makes the field look like
 * a form from 2000. This is a plain text input restricted to digits with our
 * own buttons, so it looks the same in every browser and matches the form.
 *
 *   - only digits can be typed; the value is clamped to min..max on blur/Enter
 *   - ArrowUp / ArrowDown step the value
 *   - press and hold a button to keep stepping
 */
export default function NumberStepper({
  value,
  onChange,
  min,
  max,
  step = 5,
  hint,
  label,
}: NumberStepperProps) {
  // While you are typing we show what you typed; otherwise we show the real value.
  const [draft, setDraft] = useState<string | null>(null);
  const valueRef = useRef(value);
  const holdRef = useRef<number | null>(null);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  function clamp(n: number) {
    return Math.min(Math.max(n, min), max);
  }

  /** The number the user has in mind: what they typed, or the committed value. */
  function current() {
    const parsed = draft === null || draft === '' ? Number.NaN : Number.parseInt(draft, 10);
    return Number.isNaN(parsed) ? valueRef.current : clamp(parsed);
  }

  function nudge(delta: number) {
    // Step from `current()`, not from `value`: if you typed 120 and then press
    // ArrowUp you expect 125, and holding a button fires faster than React
    // re-renders, so `value` would be stale and the steps would not compound.
    const next = clamp(current() + delta);
    valueRef.current = next;
    setDraft(null); // show the committed value again
    onChange(next);
  }

  function stopHold() {
    if (holdRef.current !== null) {
      window.clearInterval(holdRef.current);
      holdRef.current = null;
    }
  }

  function startHold(delta: number) {
    nudge(delta);
    stopHold();
    holdRef.current = window.setInterval(() => nudge(delta), 110);
  }

  // Stop the repeat timer if the field goes away mid-hold.
  useEffect(() => stopHold, []);

  function commit() {
    const parsed = Number.parseInt(draft ?? '', 10);
    if (!Number.isNaN(parsed)) {
      const next = clamp(parsed);
      valueRef.current = next;
      onChange(next);
    }
    setDraft(null); // fall back to showing the real value
  }

  function onKeyDown(event: KeyboardEvent) {
    // nudge() reads the draft itself, so it steps from what was typed.
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      nudge(step);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      nudge(-step);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') {
      setDraft(null);
    }
  }

  return (
    <div className="stepper" role="group" aria-label={label}>
      <button
        type="button"
        className="stepper-btn"
        aria-label={`Decrease ${label.toLowerCase()}`}
        disabled={value <= min}
        onPointerDown={() => startHold(-step)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        // A button fired by keyboard (Enter/Space) raises click with detail 0 and
        // no pointerdown; without this the - and + buttons would be mouse-only.
        onClick={(event) => {
          if (event.detail === 0) nudge(-step);
        }}
      >
        −
      </button>

      <input
        className="stepper-input"
        inputMode="numeric"
        value={draft ?? String(value)}
        aria-label={label}
        onChange={(event) => setDraft(event.target.value.replace(/[^0-9]/g, ''))}
        onBlur={commit}
        onKeyDown={onKeyDown}
      />

      {hint && <span className="stepper-hint">{hint}</span>}

      <button
        type="button"
        className="stepper-btn"
        aria-label={`Increase ${label.toLowerCase()}`}
        disabled={value >= max}
        onPointerDown={() => startHold(step)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        onClick={(event) => {
          if (event.detail === 0) nudge(step);
        }}
      >
        +
      </button>
    </div>
  );
}
