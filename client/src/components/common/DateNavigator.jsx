import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getDayName } from '../../utils/formatters';

export default function DateNavigator({ date, onDateChange, showDay = true }) {
  const handlePrev = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNext = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handlePrev}
        className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors"
        id="date-nav-prev"
      >
        <ChevronLeft size={18} className="text-[var(--text-secondary)]" />
      </button>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="input-field text-sm w-auto"
          id="date-nav-picker"
        />
        {showDay && (
          <span className="text-sm text-[var(--text-secondary)] hidden sm:inline">
            {getDayName(date)}
          </span>
        )}
      </div>

      <button
        onClick={handleNext}
        className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors"
        id="date-nav-next"
      >
        <ChevronRight size={18} className="text-[var(--text-secondary)]" />
      </button>
    </div>
  );
}
