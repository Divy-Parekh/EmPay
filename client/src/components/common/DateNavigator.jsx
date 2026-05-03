import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getDayName } from '../../utils/formatters';
import CustomDatePicker from './CustomDatePicker';

export default function DateNavigator({ date, onDateChange, showDay = true }) {
  const handlePrev = () => {
    const d = new Date(date + 'T00:00:00'); // Ensure we parse as local midnight
    d.setDate(d.getDate() - 1);
    onDateChange(d.toLocaleDateString('en-CA'));
  };

  const handleNext = () => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    onDateChange(d.toLocaleDateString('en-CA'));
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
        <CustomDatePicker 
          value={date} 
          onChange={onDateChange} 
        />
        {showDay && (
          <span className="text-sm text-[var(--text-secondary)] hidden sm:inline ml-2">
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
