import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomSelect({ options, value, onChange, placeholder, label, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="label mb-1.5 block">{label}</label>}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all cursor-pointer
          ${isOpen ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary-light)]' : 'border-[var(--border-color)]'}
          bg-[var(--bg-input)] hover:border-[var(--text-muted)]
        `}
      >
        <span className={`text-sm ${!selectedOption ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
          {selectedOption ? selectedOption.label : placeholder || 'Select option'}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-[var(--text-secondary)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 py-1.5 rounded-xl overflow-hidden animate-slide-up"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-modal)',
            backdropFilter: 'blur(16px)'
          }}
        >
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors
                  ${value === opt.value 
                    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] hover:font-bold'}
                `}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
