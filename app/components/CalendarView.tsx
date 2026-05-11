"use client";

import { useState } from "react";

type Reading = { timestamp: string; weight_kg: number };

function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarView({ readings }: { readings: Reading[] }) {
  const [viewDate, setViewDate] = useState(new Date());

  const byDay: Record<string, number[]> = {};
  readings.forEach((r) => {
    const key = toDateKey(new Date(r.timestamp));
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(r.weight_kg);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Monday-first offset
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = startOffset + lastDay.getDate();
  const cells = Math.ceil(totalCells / 7) * 7;

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const monthLabel = viewDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-medium text-gray-700">{monthLabel}</h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 text-sm">
            ‹
          </button>
          <button onClick={nextMonth} className="text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 text-sm">
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <p key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: cells }, (_, i) => {
          const dayNum = i - startOffset + 1;
          if (dayNum < 1 || dayNum > lastDay.getDate()) {
            return <div key={i} />;
          }

          const cellDate = new Date(year, month, dayNum);
          const key = toDateKey(cellDate);
          const dayReadings = byDay[key];
          const avg = dayReadings
            ? dayReadings.reduce((a, b) => a + b, 0) / dayReadings.length
            : null;

          const isToday = key === toDateKey(today);
          const isFuture = cellDate > today;

          return (
            <div
              key={key}
              className={`rounded-xl p-2 min-h-[56px] flex flex-col items-center justify-center ${
                isToday
                  ? "bg-indigo-50 border border-indigo-200"
                  : avg
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-50"
              }`}
            >
              <p className={`text-xs mb-0.5 ${
                isToday ? "text-indigo-400 font-semibold" :
                avg ? "text-indigo-200" : "text-gray-400"
              }`}>
                {dayNum}
              </p>
              {avg ? (
                <p className={`text-xs font-semibold ${avg ? "text-white" : ""} ${isToday ? "text-indigo-700" : ""}`}>
                  {avg.toFixed(1)}
                </p>
              ) : !isFuture && !isToday ? (
                <p className="text-xs text-gray-300">·</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
