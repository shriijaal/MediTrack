import { useState } from "react";

export function DatePickerModal({ selDate, onClose, onSelect }) {
  const [viewDate, setViewDate] = useState(new Date(selDate));
  
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay(); // Sunday=0, Monday=1, etc.
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const prevMonthDays = new Date(year, month, 0).getDate();
  const prevMonthVisible = Array.from({ length: firstDay }, (_, i) => prevMonthDays - firstDay + i + 1);
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  const nextMonthVisibleCount = 42 - (prevMonthVisible.length + currentMonthDays.length);
  const nextMonthVisible = Array.from({ length: nextMonthVisibleCount }, (_, i) => i + 1);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const shiftMonth = (delta) => {
    const nextV = new Date(year, month + delta, 1);
    // Don't shift to future months
    if (delta > 0 && nextV > today) return;
    setViewDate(nextV);
  };

  const handleSelect = (d, isCurrentMonth, isPrevMonth) => {
    let targetYear = year;
    let targetMonth = month;
    if (isPrevMonth) targetMonth--;
    else if (!isCurrentMonth) targetMonth++;
    
    const targetDate = new Date(targetYear, targetMonth, d);
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    onSelect(`${y}-${m}-${day}`);
    onClose();
  };

  return (
    <div className="ov dp-ov" onClick={onClose}>
      <div className="mod dp-mod" onClick={e => e.stopPropagation()}>
        <div className="dp-hd">
          <div className="dp-current">
            <button className="dp-label-btn" title="Month Selection">
              {months[month]} {year}
            </button>
          </div>
          <div className="dp-nav">
            <button onClick={() => shiftMonth(-1)} className="dp-nav-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button onClick={() => shiftMonth(1)} className="dp-nav-btn" disabled={new Date(year, month + 1, 1) > today}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>

        <div className="dp-grid-hd">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={`${d}-${i}`} className="dp-weekday">{d}</div>
          ))}
        </div>

        <div className="dp-grid">
          {prevMonthVisible.map(d => {
            const di = new Date(year, month - 1, d).toISOString().split("T")[0];
            const isFuture = di > todayStr;
            return (
              <button key={`p-${d}`} className="dp-day other" 
                disabled={isFuture} onClick={() => !isFuture && handleSelect(d, false, true)}>{d}</button>
            );
          })}
          {currentMonthDays.map(d => {
            const iso = new Date(year, month, d).toISOString().split("T")[0];
            const isToday = todayStr === iso;
            const isSelected = selDate === iso;
            const isFuture = iso > todayStr;
            return (
              <button key={`c-${d}`} 
                disabled={isFuture}
                className={`dp-day${isSelected ? " sel" : ""}${isToday ? " today" : ""}`} 
                onClick={() => !isFuture && handleSelect(d, true)}>
                {d}
              </button>
            );
          })}
          {nextMonthVisible.map(d => {
            const di = new Date(year, month + 1, d).toISOString().split("T")[0];
            const isFuture = di > todayStr;
            return (
              <button key={`n-${d}`} className="dp-day other" 
                disabled={isFuture} onClick={() => !isFuture && handleSelect(d, false, false)}>{d}</button>
            );
          })}
        </div>

        <button className="btn btn-o dp-close" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
