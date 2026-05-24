import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

export default function CalendarView({ events }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Map events to dates
  const eventsByDate = useMemo(() => {
    const map = {};
    for (const event of events) {
      if (event.start_date) {
        const dateKey = event.start_date; // format: YYYY-MM-DD
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(event);
      }
    }
    return map;
  }, [events]);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const cells = [];
  // Empty cells before first day
  for (let i = 0; i < firstDayOfMonth; i++) {
    cells.push(<div key={`empty-${i}`} className="h-24 border border-gray-100 bg-gray-50/50 rounded-lg"></div>);
  }
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = eventsByDate[dateKey] || [];
    const isToday = dateKey === todayKey;

    cells.push(
      <div key={day} className={`h-24 border rounded-lg p-1.5 transition hover:bg-indigo-50/50 ${
        isToday ? 'border-indigo-400 bg-indigo-50/30' : 'border-gray-100'
      }`}>
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
            isToday ? 'bg-indigo-600 text-white' : 'text-gray-600'
          }`}>
            {day}
          </span>
        </div>
        <div className="space-y-0.5 overflow-hidden">
          {dayEvents.slice(0, 2).map(ev => (
            <Link
              key={ev.id}
              to={`/event/${ev.id}`}
              className="block text-[10px] leading-tight px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 truncate hover:bg-indigo-200 transition font-medium"
            >
              {ev.event_time && <span className="opacity-70">{ev.event_time} </span>}
              {ev.title}
            </Link>
          ))}
          {dayEvents.length > 2 && (
            <span className="text-[10px] text-gray-400 px-1.5">+{dayEvents.length - 2} more</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-900">{monthNames[month]} {year}</h3>
          <button
            onClick={goToToday}
            className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition" aria-label="Previous month">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition" aria-label="Next month">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {dayNames.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2.5 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px p-2">
        {cells}
      </div>

      {/* Upcoming events list */}
      {events.filter(e => e.start_date && e.start_date >= todayKey).length > 0 && (
        <div className="border-t border-gray-100 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Upcoming</h4>
          <div className="space-y-2">
            {events
              .filter(e => e.start_date && e.start_date >= todayKey)
              .sort((a, b) => a.start_date.localeCompare(b.start_date))
              .slice(0, 5)
              .map(ev => (
                <Link key={ev.id} to={`/event/${ev.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-[10px] text-indigo-600 font-medium uppercase">
                      {new Date(ev.start_date + 'T00:00').toLocaleDateString([], { month: 'short' })}
                    </span>
                    <span className="text-sm font-bold text-indigo-700 -mt-0.5">
                      {new Date(ev.start_date + 'T00:00').getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{ev.title}</p>
                    <p className="text-xs text-gray-500">
                      {ev.event_time && `${ev.event_time} • `}{ev.event_location || ev.organization || ''}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
