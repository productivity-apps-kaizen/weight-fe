"use client";

type Reading = { timestamp: string; weight_kg: number };

function getWeekDays(date: Date): Date[] {
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function WeeklySummary({ readings }: { readings: Reading[] }) {
  const today = new Date();
  const weekDays = getWeekDays(today);

  const byDay: Record<string, number[]> = {};
  readings.forEach((r) => {
    const key = toDateKey(new Date(r.timestamp));
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(r.weight_kg);
  });

  const weekReadings = weekDays
    .map((d) => byDay[toDateKey(d)])
    .filter(Boolean)
    .flat();

  const avg = weekReadings.length
    ? weekReadings.reduce((a, b) => a + b, 0) / weekReadings.length
    : null;

  const daysWithData = weekDays.filter((d) => byDay[toDateKey(d)]).length;
  const daysPassed = weekDays.filter((d) => d <= today).length;
  const missingDays = daysPassed - daysWithData;

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">This week</p>
          <p className="text-4xl font-semibold text-gray-800">
            {avg ? `${avg.toFixed(1)} kg` : "—"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {daysWithData} of {daysPassed} days recorded
          </p>
        </div>
        {missingDays > 0 && (
          <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 rounded-full px-3 py-1">
            {missingDays} day{missingDays > 1 ? "s" : ""} missing
          </span>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dayLabels.map((label, i) => {
          const day = weekDays[i];
          const key = toDateKey(day);
          const dayReadings = byDay[key];
          const avg = dayReadings
            ? dayReadings.reduce((a, b) => a + b, 0) / dayReadings.length
            : null;
          const isToday = toDateKey(day) === toDateKey(today);
          const isPast = day <= today;

          return (
            <div
              key={key}
              className={`rounded-xl p-2 text-center ${
                isToday ? "bg-indigo-50 border border-indigo-200" : "bg-gray-50"
              }`}
            >
              <p className={`text-xs font-medium mb-1 ${isToday ? "text-indigo-500" : "text-gray-400"}`}>
                {label}
              </p>
              {avg ? (
                <p className="text-sm font-semibold text-gray-700">{avg.toFixed(1)}</p>
              ) : (
                <p className={`text-sm ${isPast ? "text-red-300" : "text-gray-200"}`}>—</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
