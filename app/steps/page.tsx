"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type StepEntry = {
  id: string;
  date: string;
  steps: number;
};

const GOAL = 10000;

function Bar({ entry, max }: { entry: StepEntry; max: number }) {
  const pct = max > 0 ? entry.steps / max : 0;
  const metGoal = entry.steps >= GOAL;
  const today = new Date().toISOString().slice(0, 10);
  const isToday = entry.date === today;
  const label = new Date(entry.date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <span className="text-xs text-gray-400 tabular-nums">{(entry.steps / 1000).toFixed(1)}k</span>
      <div className="w-full flex flex-col justify-end" style={{ height: 80 }}>
        <div
          className={`w-full rounded-t-md transition-all ${metGoal ? "bg-indigo-400" : "bg-gray-300"} ${isToday ? "ring-2 ring-indigo-500" : ""}`}
          style={{ height: `${Math.max(pct * 100, 4)}%` }}
        />
      </div>
      <span className={`text-xs truncate w-full text-center ${isToday ? "font-semibold text-indigo-600" : "text-gray-400"}`}>{label}</span>
    </div>
  );
}

export default function StepsPage() {
  const [entries, setEntries] = useState<StepEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/steps")
      .then((r) => r.json())
      .then((data) => { setEntries(data); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = entries.find(e => e.date === today);
  const recent = entries.slice(-30);
  const last7 = entries.slice(-7);
  const max = Math.max(...recent.map(e => e.steps), 1);
  const avg7 = last7.length ? Math.round(last7.reduce((s, e) => s + e.steps, 0) / last7.length) : null;
  const daysMetGoal = last7.filter(e => e.steps >= GOAL).length;

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Steps</h1>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-indigo-500 hover:text-indigo-700">Weight →</Link>
            <Link href="/nutrition" className="text-sm text-indigo-500 hover:text-indigo-700">Nutrition →</Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Today</p>
          {todayEntry ? (
            <>
              <p className="text-4xl font-semibold text-gray-800">
                {todayEntry.steps.toLocaleString()} <span className="text-lg font-normal text-gray-400">steps</span>
              </p>
              <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${todayEntry.steps >= GOAL ? "bg-indigo-400" : "bg-indigo-300"}`}
                  style={{ width: `${Math.min((todayEntry.steps / GOAL) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{Math.round((todayEntry.steps / GOAL) * 100)}% of {GOAL.toLocaleString()} goal</p>
            </>
          ) : (
            <p className="text-gray-400">No data yet today</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Last 7 days</p>
          <div className="flex gap-2">
            {last7.length > 0 ? last7.map(e => <Bar key={e.date} entry={e} max={max} />) : (
              <p className="text-gray-400 text-sm">No data</p>
            )}
          </div>
          {avg7 !== null && (
            <div className="mt-4 flex gap-6 text-sm text-gray-500">
              <span>Avg <span className="font-medium text-gray-700">{avg7.toLocaleString()}</span></span>
              <span>Goal met <span className="font-medium text-gray-700">{daysMetGoal}/7</span> days</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Last 30 days</p>
          <div className="flex gap-1">
            {recent.length > 0 ? recent.map(e => <Bar key={e.date} entry={e} max={max} />) : (
              <p className="text-gray-400 text-sm">No data</p>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
