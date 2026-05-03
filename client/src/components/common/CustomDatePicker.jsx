import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CustomDatePicker({ value, onChange, label, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  // Parse current value or default to today
  const selectedDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(newDate.toLocaleDateString('en-CA'));
    setIsOpen(false);
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === viewDate.getMonth() && 
           today.getFullYear() === viewDate.getFullYear();
  };

  const isSelected = (day) => {
    return selectedDate.getDate() === day && 
           selectedDate.getMonth() === viewDate.getMonth() && 
           selectedDate.getFullYear() === viewDate.getFullYear();
  };

  const monthName = viewDate.toLocaleString('default', { month: 'long' });
  const year = viewDate.getFullYear();

  const days = [];
  const totalDays = daysInMonth(year, viewDate.getMonth());
  const startDay = firstDayOfMonth(year, viewDate.getMonth());

  // Fill empty slots for start of month
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
  }

  // Fill actual days
  for (let d = 1; d <= totalDays; d++) {
    days.push(
      <button
        key={d}
        onClick={(e) => { e.stopPropagation(); handleDateSelect(d); }}
        className={`h-8 w-8 rounded-lg text-xs font-medium transition-all flex items-center justify-center
          ${isSelected(d) 
            ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary-light)]' 
            : isToday(d)
              ? 'text-[var(--color-primary)] bg-[var(--color-primary-light)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'}
        `}
      >
        {d}
      </button>
    );
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="label mb-1.5 block">{label}</label>}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all cursor-pointer
          ${isOpen ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary-light)]' : 'border-[var(--border-color)]'}
          bg-[var(--bg-input)] hover:border-[var(--text-muted)]
        `}
      >
        <CalendarIcon size={16} className="text-[var(--text-secondary)]" />
        <span className="text-sm text-[var(--text-primary)]">
          {selectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-72 mt-2 p-4 rounded-2xl overflow-hidden animate-slide-up"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-modal)',
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white">{monthName} {year}</h4>
            <div className="flex gap-1">
              <button onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="h-8 w-8 flex items-center justify-center text-[10px] font-bold text-[var(--text-muted)] uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days}
          </div>
        </div>
      )}
    </div>
  );
}
