import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangePickerProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onCheckInChange: (date: Date | null) => void;
  onCheckOutChange: (date: Date | null) => void;
  className?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  className = ''
}) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selecting, setSelecting] = useState<'checkIn' | 'checkOut'>('checkIn');

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isDateDisabled = (date: Date) => {
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date < todayStart;
  };

  const isDateInRange = (date: Date) => {
    if (!checkIn || !checkOut) return false;
    return date > checkIn && date < checkOut;
  };

  const isDateSelected = (date: Date) => {
    if (checkIn && date.toDateString() === checkIn.toDateString()) return true;
    if (checkOut && date.toDateString() === checkOut.toDateString()) return true;
    return false;
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    
    if (isDateDisabled(clickedDate)) return;

    if (selecting === 'checkIn') {
      onCheckInChange(clickedDate);
      setSelecting('checkOut');
    } else {
      if (checkIn && clickedDate <= checkIn) {
        onCheckInChange(clickedDate);
        onCheckOutChange(null);
      } else {
        onCheckOutChange(clickedDate);
        setSelecting('checkIn');
      }
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentMonth === 0 ? currentYear : currentYear);

  const nextMonthNum = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const nextDaysInMonth = getDaysInMonth(nextMonthNum, nextMonthYear);

  const renderMonth = (month: number, year: number, days: number) => {
    const firstDay = getFirstDayOfMonth(month, year);
    
    const daysArray = [];
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(null);
    }
    for (let i = 1; i <= days; i++) {
      daysArray.push(i);
    }

    return (
      <div className="flex-1 min-w-[280px]">
        <div className="text-center font-bold text-gray-900 mb-6">{MONTHS[month]} {year}</div>
        <div className="grid grid-cols-7 gap-0 mb-2">
          {DAYS.map(day => (
            <div key={day} className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest py-2">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {daysArray.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="h-10" />;
            }
            
            const date = new Date(year, month, day);
            const isDisabled = isDateDisabled(date);
            const isSelected = isDateSelected(date);
            const isInRange = isDateInRange(date);
            const isStart = checkIn && date.toDateString() === checkIn.toDateString();
            const isEnd = checkOut && date.toDateString() === checkOut.toDateString();
            
            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                disabled={isDisabled}
                className={`
                  h-10 w-full text-sm font-semibold transition-all relative
                  ${isDisabled ? 'text-gray-200 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}
                  ${isSelected ? 'bg-primary text-white z-10 rounded-xl shadow-md' : ''}
                  ${isInRange ? 'bg-primary/5 text-primary' : ''}
                  ${isStart && checkOut ? 'rounded-r-none' : ''}
                  ${isEnd && checkIn ? 'rounded-l-none' : ''}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden ${className}`}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-3 hover:bg-gray-50 rounded-2xl transition-all border border-gray-100 shadow-sm active:scale-95">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">{MONTHS[currentMonth]} {currentYear}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Select dates</span>
            </div>
          </div>
          <button onClick={nextMonth} className="p-3 hover:bg-gray-50 rounded-2xl transition-all border border-gray-100 shadow-sm active:scale-95">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-12">
          {renderMonth(currentMonth, currentYear, daysInMonth)}
          <div className="hidden lg:block w-px bg-gray-100" />
          {renderMonth(nextMonthNum, nextMonthYear, nextDaysInMonth)}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Selected Range</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary/10" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">In Between</span>
          </div>
        </div>
      </div>
    </div>
  );
};
