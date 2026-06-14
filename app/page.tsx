"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import WeeklySummary from "./components/WeeklySummary";
import CalendarView from "./components/CalendarView";

type Reading = {
  timestamp: string;
  weight_kg: number;
  bmi?: number;
  body_fat_pct?: number;
  lean_mass_kg?: number;
  bmr_kcal?: number;
};

export default function Home() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/weight")
      .then((r) => r.json())
      .then((data) => { setReadings(data); setLoading(false); });
  }, []);

  const latest = readings.at(-1);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Weight</h1>
          <div className="flex items-center gap-4">
            <Link href="/profile" className="text-sm text-indigo-500 hover:text-indigo-700">
              Profile →
            </Link>
            <Link href="/nutrition" className="text-sm text-indigo-500 hover:text-indigo-700">
              Nutrition →
            </Link>
            <Link href="/steps" className="text-sm text-indigo-500 hover:text-indigo-700">
              Steps →
            </Link>
            <Link href="/phone" className="text-sm text-indigo-500 hover:text-indigo-700">
              Phone →
            </Link>
            <Link href="/entries" className="text-sm text-indigo-500 hover:text-indigo-700">
              All entries →
            </Link>
          </div>
        </div>

        {latest && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Latest</p>
              <p className="text-4xl font-semibold text-gray-800">{latest.weight_kg.toFixed(1)} <span className="text-lg font-normal text-gray-400">kg</span></p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(latest.timestamp).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            {latest.bmi && (
              <div className="ml-auto grid grid-cols-2 gap-x-6 gap-y-2 text-right">
                <div>
                  <p className="text-xs text-gray-400">BMI</p>
                  <p className="text-sm font-semibold text-gray-700">{latest.bmi.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Body fat</p>
                  <p className="text-sm font-semibold text-gray-700">{latest.body_fat_pct?.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Lean mass</p>
                  <p className="text-sm font-semibold text-gray-700">{latest.lean_mass_kg?.toFixed(1)} kg</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">BMR</p>
                  <p className="text-sm font-semibold text-gray-700">{latest.bmr_kcal} kcal</p>
                </div>
              </div>
            )}
          </div>
        )}

        <WeeklySummary readings={readings} />
        <CalendarView readings={readings} />

      </div>
    </main>
  );
}
