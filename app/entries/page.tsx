"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Reading = {
  id: string;
  timestamp: string;
  weight_kg: number;
  bmi?: number;
  body_fat_pct?: number;
  lean_mass_kg?: number;
  bmr_kcal?: number;
};

function EntryRow({
  reading,
  onDelete,
  onSave,
}: {
  reading: Reading;
  onDelete: (id: string) => void;
  onSave: (id: string, weight: number, timestamp: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editWeight, setEditWeight] = useState(reading.weight_kg.toString());
  const [editDate, setEditDate] = useState(reading.timestamp.slice(0, 16));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const date = new Date(reading.timestamp);

  async function handleSave() {
    setSaving(true);
    await onSave(reading.id, parseFloat(editWeight), new Date(editDate).toISOString());
    setSaving(false);
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete(reading.id);
  }

  if (editing) {
    return (
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <p className="text-xs text-gray-400 mb-1">Weight (kg)</p>
            <input
              type="number"
              step="0.05"
              value={editWeight}
              onChange={(e) => setEditWeight(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Date & time</p>
            <input
              type="datetime-local"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="flex gap-2 mt-4 ml-auto">
            <button
              onClick={() => setEditing(false)}
              className="text-sm text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm bg-indigo-500 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-600 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 flex items-center justify-between group">
      <div>
        <p className="text-sm font-semibold text-gray-700">
          {date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
        </p>
        <p className="text-xs text-gray-400">
          {date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-6 text-right">
          <div>
            <p className="text-xs text-gray-400">Weight</p>
            <p className="text-sm font-bold text-gray-800">{reading.weight_kg.toFixed(1)} kg</p>
          </div>
          {reading.bmi && (
            <>
              <div>
                <p className="text-xs text-gray-400">BMI</p>
                <p className="text-sm font-semibold text-gray-700">{reading.bmi.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Body fat</p>
                <p className="text-sm font-semibold text-gray-700">{reading.body_fat_pct?.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Lean</p>
                <p className="text-sm font-semibold text-gray-700">{reading.lean_mass_kg?.toFixed(1)} kg</p>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => { setEditing(true); setConfirmDelete(false); }}
            className="text-xs text-gray-400 hover:text-indigo-500 px-2 py-1 rounded-lg hover:bg-indigo-50"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className={`text-xs px-2 py-1 rounded-lg transition-colors ${
              confirmDelete
                ? "bg-red-500 text-white hover:bg-red-600"
                : "text-gray-400 hover:text-red-500 hover:bg-red-50"
            }`}
          >
            {confirmDelete ? "Sure?" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Entries() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/weight")
      .then((r) => r.json())
      .then((data) => { setReadings([...data].reverse()); setLoading(false); });
  }, []);

  async function handleDelete(id: string) {
    await fetch(`/api/weight/${id}`, { method: "DELETE" });
    setReadings((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleSave(id: string, weight_kg: number, timestamp: string) {
    await fetch(`/api/weight/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight_kg, timestamp }),
    });
    setReadings((prev) =>
      prev.map((r) => (r.id === id ? { ...r, weight_kg, timestamp } : r))
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-800">All entries</h1>
          <Link href="/" className="text-sm text-indigo-500 hover:text-indigo-700">
            ← Dashboard
          </Link>
        </div>

        <p className="text-sm text-gray-400">{readings.length} readings total</p>

        <div className="space-y-2">
          {readings.map((r, i) => (
            <EntryRow key={r.id ?? r.timestamp ?? i} reading={r} onDelete={handleDelete} onSave={handleSave} />
          ))}
        </div>
      </div>
    </main>
  );
}
