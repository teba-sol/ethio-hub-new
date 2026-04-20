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
    const paddingDays = month === 11 ? getFirstDayOfMonth(0, year + 1) : getFirstDayOfMonth(month + 1, year);
    
    const daysArray = [];
    for (let i = 0; i < paddingDays; i++) {
      daysArray.push(null);
    }
    for (let i = 1; i <= days; i++) {
      daysArray.push(i);
    }

    return (
      <div className="flex-1">
        <div className="text-center font-semibold text-gray-800 mb-4">{MONTHS[month]} {year}</div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map(day => (
            <div key={day} className="text-center text-xs text-gray-400 font-medium py-1">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {daysArray.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="h-10" />;
            }
            
            const date = new Date(year, month, day);
            const isDisabled = isDateDisabled(date);
            const isSelected = isDateSelected(date);
            const isInRange = isDateInRange(date);
            
            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                disabled={isDisabled}
                className={`
                  h-10 rounded-lg text-sm font-medium transition-all
                  ${isDisabled ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'}
                  ${isSelected ? 'bg-primary text-white hover:bg-primary/90' : ''}
                  ${isInRange ? 'bg-primary/10 text-primary' : ''}
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
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 ${className}`}>
      <div className="p-4 border-b border-gray-100">
        <div className="flex gap-6">
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Check In</label>
            <div className={`flex items-center gap-2 mt-1 ${selecting === 'checkIn' ? 'text-primary' : 'text-gray-600'}`}>
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{formatDate(checkIn) || 'Select date'}</span>
            </div>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Check Out</label>
            <div className={`flex items-center gap-2 mt-1 ${selecting === 'checkOut' ? 'text-primary' : 'text-gray-600'}`}>
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{formatDate(checkOut) || 'Select date'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-500">Click to select dates</span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="flex gap-8">
          {renderMonth(currentMonth, currentYear, daysInMonth)}
          {renderMonth(nextMonthNum, nextMonthYear, nextDaysInMonth)}
        </div>
      </div>
    </div>
  );
};
