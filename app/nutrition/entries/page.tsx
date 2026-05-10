"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type DayEntry = {
  id: string;
  date: string;
  calories_kcal: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
};

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMissingDays(byDay: Record<string, DayEntry>, days = 60): string[] {
  const today = new Date();
  const missing: string[] = [];
  for (let i = 1; i <= days; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = toDateKey(d);
    if (!byDay[key]) missing.push(key);
  }
  return missing;
}

function EntryRow({ entry, onDelete, onSave }: {
  entry: DayEntry;
  onDelete: (id: string) => void;
  onSave: (id: string, data: Partial<DayEntry>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState({
    date: entry.date,
    calories_kcal: entry.calories_kcal.toString(),
    protein_g: entry.protein_g?.toString() ?? "",
    carbs_g: entry.carbs_g?.toString() ?? "",
    fat_g: entry.fat_g?.toString() ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (editing) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {([
              { label: "Date", key: "date", type: "date" },
              { label: "Calories (kcal)", key: "calories_kcal", type: "number" },
              { label: "Protein (g)", key: "protein_g", type: "number" },
              { label: "Carbs (g)", key: "carbs_g", type: "number" },
              { label: "Fat (g)", key: "fat_g", type: "number" },
            ] as const).map(({ label, key, type }) => (
              <div key={key}>
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <input
                  type={type}
                  value={fields[key]}
                  onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3 justify-end">
            <button onClick={() => setEditing(false)} className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">Cancel</button>
            <button
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                await onSave(entry.id, {
                  date: fields.date,
                  calories_kcal: parseFloat(fields.calories_kcal),
                  protein_g: fields.protein_g ? parseFloat(fields.protein_g) : undefined,
                  carbs_g: fields.carbs_g ? parseFloat(fields.carbs_g) : undefined,
                  fat_g: fields.fat_g ? parseFloat(fields.fat_g) : undefined,
                });
                setSaving(false); setEditing(false);
              }}
              className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card group">
      <CardContent className="py-3.5 px-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            {new Date(entry.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="text-[10px] text-muted-foreground">kcal</p>
                <p className="text-sm font-semibold text-foreground">{entry.calories_kcal.toFixed(0)}</p>
              </div>
              {entry.protein_g != null && (
                <div>
                  <p className="text-[10px] text-muted-foreground">Protein</p>
                  <p className="text-sm font-semibold text-[oklch(0.55_0.22_25)]">{entry.protein_g.toFixed(0)}g</p>
                </div>
              )}
              {entry.carbs_g != null && (
                <div>
                  <p className="text-[10px] text-muted-foreground">Carbs</p>
                  <p className="text-sm font-semibold text-[oklch(0.48_0.10_50)]">{entry.carbs_g.toFixed(0)}g</p>
                </div>
              )}
              {entry.fat_g != null && (
                <div>
                  <p className="text-[10px] text-muted-foreground">Fat</p>
                  <p className="text-sm font-semibold text-[oklch(0.82_0.18_90)]">{entry.fat_g.toFixed(0)}g</p>
                </div>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditing(true); setConfirmDelete(false); }} className="text-xs text-muted-foreground hover:text-primary px-2 py-1 rounded-md hover:bg-primary/10 transition-colors">Edit</button>
              <button
                onClick={() => confirmDelete ? onDelete(entry.id) : setConfirmDelete(true)}
                className={cn("text-xs px-2 py-1 rounded-md transition-colors", confirmDelete ? "bg-destructive text-white hover:bg-destructive/90" : "text-muted-foreground hover:text-destructive hover:bg-destructive/10")}
              >
                {confirmDelete ? "Sure?" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NutritionEntries() {
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMissing, setShowMissing] = useState(true);

  useEffect(() => {
    fetch("/api/nutrition").then(r => r.json()).then(data => { setEntries([...data].reverse()); setLoading(false); });
  }, []);

  async function handleDelete(id: string) {
    await fetch(`/api/nutrition/${id}`, { method: "DELETE" });
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  async function handleSave(id: string, data: Partial<DayEntry>) {
    await fetch(`/api/nutrition/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  }

  if (loading) {
    return <main className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm">Loading...</p></main>;
  }

  const byDay: Record<string, DayEntry> = {};
  entries.forEach(e => { byDay[e.date] = e; });
  const missingDays = getMissingDays(byDay);

  const today = new Date();
  const allDates = Array.from(new Set([...entries.map(e => e.date), ...missingDays]))
    .filter(d => new Date(d) <= today)
    .sort((a, b) => b.localeCompare(a));

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 pt-10 pb-16 space-y-5">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">All entries</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{entries.length} days logged</p>
          </div>
          <Link href="/nutrition" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Dashboard</Link>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {missingDays.length > 0 && (
              <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50 gap-1">
                <AlertTriangle size={10} /> {missingDays.length} missing
              </Badge>
            )}
          </div>
          <button
            onClick={() => setShowMissing(s => !s)}
            className={cn("text-xs px-3 py-1.5 rounded-full border transition-colors", showMissing ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-muted border-border text-muted-foreground")}
          >
            {showMissing ? "Hide missing" : "Show missing"}
          </button>
        </div>

        <div className="space-y-2">
          {allDates.map(date => {
            const entry = byDay[date];
            if (entry) return <EntryRow key={date} entry={entry} onDelete={handleDelete} onSave={handleSave} />;
            if (!showMissing) return null;
            return (
              <Card key={date} className="border-amber-200/60 bg-amber-50/40">
                <CardContent className="py-3 px-5 flex items-center justify-between">
                  <p className="text-sm text-amber-700">
                    {new Date(date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <Badge variant="outline" className="text-xs border-amber-300 text-amber-600 bg-amber-100/80">No data logged</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

      </div>
    </main>
  );
}
