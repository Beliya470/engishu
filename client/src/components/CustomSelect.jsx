import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ value, onChange, options, placeholder, className = '' }) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find(o => String(o.value) === String(value));

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Scroll focused item into view
  useEffect(() => {
    if (open && focusIndex >= 0 && listRef.current) {
      const item = listRef.current.children[focusIndex];
      if (item) item.scrollIntoView({ block: 'nearest' });
    }
  }, [focusIndex, open]);

  const handleKeyDown = useCallback((e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
        setFocusIndex(options.findIndex(o => String(o.value) === String(value)));
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusIndex(prev => Math.min(prev + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusIndex >= 0) {
          onChange(options[focusIndex].value);
          setOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  }, [open, focusIndex, options, onChange, value]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setFocusIndex(options.findIndex(o => String(o.value) === String(value))); }}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white text-sm text-left transition-colors ${
          open
            ? 'border-2 border-[#1DB8A8] ring-1 ring-[#1DB8A8]/20'
            : 'border border-gray-300 hover:border-gray-400'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? 'text-[#1A1A1A]' : 'text-gray-400'}>
          {selected ? selected.label : (placeholder || 'Select...')}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto py-1"
        >
          {options.map((opt, i) => {
            const isSelected = String(opt.value) === String(value);
            const isFocused = i === focusIndex;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                onMouseEnter={() => setFocusIndex(i)}
                className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                  isFocused
                    ? 'bg-[#1DB8A8] text-white'
                    : isSelected
                      ? 'text-[#633806] font-medium'
                      : 'text-gray-800 hover:bg-[#1DB8A8] hover:text-white'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <Check size={14} className={isFocused ? 'text-white' : 'text-[#1DB8A8]'} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
