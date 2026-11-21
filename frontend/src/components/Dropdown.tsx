import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';

interface DropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Accessible name for the control, e.g. "Genre". */
  label: string;
}

/**
 * A custom dropdown (combobox).
 *
 * A native <select> cannot be styled where it matters: the browser paints the
 * popup itself, so it keeps the operating system's look no matter what CSS you
 * apply. This builds the whole control instead - trigger, panel, options - so
 * it matches the rest of the dark theme, and it can animate.
 *
 * Behaviour it keeps from a real <select>:
 *   - click the trigger to open, click outside or Escape to close
 *   - ArrowUp / ArrowDown move through the options, Enter picks one
 *   - typing filters the list (a plain <select> cannot do this at all)
 *   - the current value is marked with a tick and highlighted when re-opened
 *   - the highlighted option is scrolled into view
 */
export default function Dropdown({ options, value, onChange, placeholder, label }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q === '' ? options : options.filter((option) => option.toLowerCase().includes(q));
  }, [options, query]);

  // Clicking anywhere outside the control closes it.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  // Opening always starts clean: empty search, highlight on the current value.
  // Done here rather than in an effect because the click is what caused it.
  function openList() {
    setQuery('');
    const at = options.indexOf(value);
    setActiveIndex(at >= 0 ? at : 0);
    // The panel is ~300px tall. When the trigger sits near the bottom of the
    // window there is no room below it, so flip the panel above the trigger
    // instead of letting it run off the screen.
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      const above = rect.top;
      setDropUp(below < 320 && above > below);
    }
    setOpen(true);
  }

  // Focus the filter box as soon as the panel opens - DOM work, not state.
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  // Keep the highlighted option visible while arrowing through a long list.
  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    node?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function choose(index: number) {
    const picked = filtered[index];
    if (picked === undefined) return;
    onChange(picked);
    close(true);
  }

  function onTriggerKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openList();
    }
  }

  function onSearchKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(filtered.length - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(activeIndex);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'Tab') {
      close(false);
    }
  }

  return (
    <div
      className={['dropdown', open ? 'open' : '', dropUp ? 'drop-up' : ''].filter(Boolean).join(' ')}
      ref={rootRef}
    >
      <button
        type="button"
        ref={triggerRef}
        className="dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={label}
        onClick={() => (open ? close(true) : openList())}
        onKeyDown={onTriggerKeyDown}
      >
        <span className={value === '' ? 'dropdown-value placeholder' : 'dropdown-value'}>
          {value === '' ? placeholder : value}
        </span>
        <svg className="dropdown-chevron" viewBox="0 0 12 8" aria-hidden="true">
          <path
            d="M1 1.5 6 6.5 11 1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="dropdown-panel">
          <input
            ref={searchRef}
            className="dropdown-search"
            value={query}
            placeholder="Type to filter…"
            aria-label={`Filter ${label.toLowerCase()}`}
            aria-controls={listId}
            aria-activedescendant={`${listId}-option-${activeIndex}`}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onSearchKeyDown}
          />

          <ul className="dropdown-list" role="listbox" id={listId} ref={listRef} aria-label={label}>
            {filtered.length === 0 && <li className="dropdown-empty">No match</li>}
            {filtered.map((option, index) => (
              <li
                key={option}
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={option === value}
                className={[
                  'dropdown-option',
                  index === activeIndex ? 'active' : '',
                  option === value ? 'selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(index);
                }}
              >
                <span>{option}</span>
                {option === value && <span className="dropdown-tick">✓</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
