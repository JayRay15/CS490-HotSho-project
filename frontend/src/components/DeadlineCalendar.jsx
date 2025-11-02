import { useMemo, useState } from "react";
import PropTypes from "prop-types";

function formatYmd(d) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = `${dt.getMonth() + 1}`.padStart(2, "0");
  const day = `${dt.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DeadlineCalendar({ jobs, onJobView }) {
  const [current, setCurrent] = useState(() => {
    const now = new Date();
    now.setDate(1);
    now.setHours(0,0,0,0);
    return now;
  });

  const weeks = useMemo(() => {
    const start = new Date(current);
    const end = new Date(current);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0); // last day of current month

    const startWeekDay = (start.getDay() + 6) % 7; // make Monday=0 if desired; we'll keep Sunday=0 as default
    const days = [];

    // Start from Sunday of the first week
    const cursor = new Date(start);
    cursor.setDate(start.getDate() - start.getDay());
    // Iterate until end of month week finishes (to Saturday)
    const last = new Date(end);
    last.setDate(end.getDate() + (6 - end.getDay()));

    while (cursor <= last) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    // Chunk into weeks of 7
    const res = [];
    for (let i = 0; i < days.length; i += 7) {
      res.push(days.slice(i, i + 7));
    }
    return res;
  }, [current]);

  const jobsByDay = useMemo(() => {
    const map = new Map();
    (jobs || []).forEach((j) => {
      if (!j.deadline) return;
      const key = formatYmd(j.deadline);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(j);
    });
    return map;
  }, [jobs]);

  const monthLabel = current.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const goPrev = () => {
    const d = new Date(current);
    d.setMonth(d.getMonth() - 1);
    setCurrent(d);
  };
  const goNext = () => {
    const d = new Date(current);
    d.setMonth(d.getMonth() + 1);
    setCurrent(d);
  };

  const isSameMonth = (d) => d.getMonth() === current.getMonth();

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between p-3 border-b">
        <button onClick={goPrev} className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200">Prev</button>
        <div className="font-semibold">{monthLabel}</div>
        <button onClick={goNext} className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200">Next</button>
      </div>
      <div className="grid grid-cols-7 text-xs text-gray-600 p-2">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="text-center font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {weeks.flat().map((d, idx) => {
          const key = formatYmd(d);
          const jobsForDay = jobsByDay.get(key) || [];
          const muted = !isSameMonth(d);
          return (
            <div key={key+idx} className={`bg-white p-2 min-h-[92px] ${muted ? 'opacity-40' : ''}`}>
              <div className="text-xs font-medium text-gray-700">{d.getDate()}</div>
              {jobsForDay.length > 0 && (
                <div className="mt-1 space-y-1">
                  {jobsForDay.slice(0,3).map((j) => (
                    <div key={j._id} className="text-[11px] truncate">
                      <button
                        className="text-blue-700 hover:underline"
                        onClick={() => onJobView && onJobView(j)}
                        title={`${j.title} @ ${j.company}`}
                      >
                        {j.title}
                      </button>
                    </div>
                  ))}
                  {jobsForDay.length > 3 && (
                    <div className="text-[11px] text-gray-500">+{jobsForDay.length - 3} more</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

DeadlineCalendar.propTypes = {
  jobs: PropTypes.arrayOf(PropTypes.object),
  onJobView: PropTypes.func,
};
