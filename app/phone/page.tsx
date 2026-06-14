"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AppRecord = {
  _id: string;
  date: string;
  package: string;
  app: string;
  minutes: number;
  opens: number;
  device: string;
};

function fmt(mins: number) {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function Bar({ minutes, max }: { minutes: number; max: number }) {
  const pct = max > 0 ? (minutes / max) * 100 : 0;
  return (
    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function PhonePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState<AppRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/phone-usage?date=${date}`)
      .then((r) => r.json())
      .then((data) => { setRecords(data); setLoading(false); });
  }, [date]);

  const totalMins = records.reduce((s, r) => s + r.minutes, 0);
  const max = records[0]?.minutes ?? 1;

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Phone Usage</h1>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-indigo-500 hover:text-indigo-700">Weight →</Link>
            <Link href="/steps" className="text-sm text-indigo-500 hover:text-indigo-700">Steps →</Link>
          </div>
        </div>

        {/* Date picker */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const d = new Date(date);
              d.setDate(d.getDate() - 1);
              setDate(d.toISOString().slice(0, 10));
            }}
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            ‹
          </button>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            onClick={() => {
              const d = new Date(date);
              d.setDate(d.getDate() + 1);
              if (d.toISOString().slice(0, 10) <= today)
                setDate(d.toISOString().slice(0, 10));
            }}
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
            disabled={date >= today}
          >
            ›
          </button>
        </div>

        {/* Total */}
        {!loading && records.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total screen time</p>
            <p className="text-4xl font-semibold text-gray-800">{fmt(totalMins)}</p>
            <p className="text-xs text-gray-400 mt-1">{records.length} apps · {records.reduce((s, r) => s + r.opens, 0)} opens</p>
            {records[0] && (
              <p className="text-xs text-gray-400 mt-0.5">{records[0].device}</p>
            )}
          </div>
        )}

        {/* App list */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Apps</p>

          {loading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : records.length === 0 ? (
            <p className="text-gray-400 text-sm">No data for this day.</p>
          ) : (
            <div className="space-y-3">
              {records.map((r) => (
                <div key={r._id} className="flex items-center gap-3">
                  <div className="w-32 shrink-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{r.app}</p>
                    <p className="text-xs text-gray-400">{r.opens} opens</p>
                  </div>
                  <Bar minutes={r.minutes} max={max} />
                  <span className="text-sm tabular-nums text-gray-500 w-14 text-right shrink-0">
                    {fmt(r.minutes)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
