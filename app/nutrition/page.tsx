"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, AlertTriangle, RefreshCw } from "lucide-react";

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

function getWeekDays(anchor: Date): Date[] {
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((anchor.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// ─── Period navigation ────────────────────────────────────────────────────────

function PeriodNav({ onPrev, onNext, label, sub, disableNext, onReset, resetLabel }: {
  onPrev: () => void;
  onNext: () => void;
  label: string;
  sub: React.ReactNode;
  disableNext?: boolean;
  onReset?: () => void;
  resetLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={onPrev} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted">
        <ChevronLeft size={14} /> Prev
      </button>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          {label}
          {onReset && <button onClick={onReset} className="ml-2 text-xs text-primary hover:underline">{resetLabel}</button>}
        </p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <button onClick={onNext} disabled={disableNext} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
        Next <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ─── Compact stats row ────────────────────────────────────────────────────────

function StatPill({ label, value, unit, accent, hasWarning, onWarningEnter, onWarningLeave }: {
  label: string; value: string | null; unit?: string; accent?: string; hasWarning?: boolean; onWarningEnter?: () => void; onWarningLeave?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 flex-1 px-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1">
        <p className={cn("text-xl font-semibold tracking-tight", accent ?? "text-foreground")}>
          {value ?? "—"}{value && unit && <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>}
        </p>
        {hasWarning && (
          <span onMouseEnter={onWarningEnter} onMouseLeave={onWarningLeave} className="text-amber-500 mt-0.5 cursor-default p-1.5 -m-1.5">
            <AlertTriangle size={11} />
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Combined week bars (calories height + macro colours) ─────────────────────

const C = {
  protein: "oklch(0.55 0.22 25)",
  carbs:   "oklch(0.48 0.10 50)",
  fat:     "oklch(0.82 0.18 90)",
  empty:   "oklch(0.93 0.005 240)",
  missing: "oklch(0.88 0.06 25)",
};

function WeekBars({ weekDays, byDay, today }: {
  weekDays: Date[];
  byDay: Record<string, DayEntry>;
  today: Date;
}) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const entries = weekDays.map(d => byDay[toDateKey(d)] ?? null);
  const maxCal = Math.max(...entries.flatMap(e => e ? [e.calories_kcal] : []), 1);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <Card className="glass-card overflow-visible">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Daily breakdown</CardTitle>
      </CardHeader>
      <CardContent className="overflow-visible">
        <div className="flex gap-2 h-48 mb-2">
          {weekDays.map((d, i) => {
            const key = toDateKey(d);
            const e = byDay[key]?.calories_kcal > 0 ? byDay[key] : null;
            const isPast = d < today;
            const isToday = key === toDateKey(today);
            const isHovered = hoveredDay === key;
            const pct = e ? e.calories_kcal / maxCal : 0;
            const total = (e?.protein_g ?? 0) + (e?.carbs_g ?? 0) + (e?.fat_g ?? 0);
            const pPct  = total > 0 ? (e!.protein_g ?? 0) / total : 1/3;
            const cPct  = total > 0 ? (e!.carbs_g   ?? 0) / total : 1/3;
            const fPct  = total > 0 ? (e!.fat_g     ?? 0) / total : 1/3;

            return (
              <div
                key={key}
                className={cn(
                  "flex-1 h-full flex flex-col items-center relative rounded-xl transition-colors",
                  isToday && "ring-2 ring-primary/50",
                  isHovered && "bg-muted/30",
                )}
                onMouseEnter={() => setHoveredDay(key)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {/* Tooltip */}
                {isHovered && e && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 bg-popover border border-border rounded-xl shadow-lg px-3 py-2 min-w-[110px] pointer-events-none">
                    <p className="text-xs font-semibold text-foreground mb-1.5">
                      {d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                    </p>
                    <p className="text-xs text-muted-foreground mb-1">{e.calories_kcal.toFixed(0)} kcal</p>
                    <div className="space-y-0.5">
                      {e.protein_g != null && <p className="text-xs font-medium" style={{ color: C.protein }}>P {e.protein_g.toFixed(0)}g</p>}
                      {e.carbs_g   != null && <p className="text-xs font-medium" style={{ color: C.carbs   }}>C {e.carbs_g.toFixed(0)}g</p>}
                      {e.fat_g     != null && <p className="text-xs font-medium" style={{ color: C.fat     }}>F {e.fat_g.toFixed(0)}g</p>}
                    </div>
                  </div>
                )}

                {/* Calorie amount */}
                <p className={cn(
                  "text-[10px] font-medium h-4 flex items-center",
                  e ? (isToday ? "text-primary" : "text-muted-foreground") : "text-transparent"
                )}>
                  {e ? e.calories_kcal.toFixed(0) : "·"}
                </p>

                {/* Bar area — flex-1 gives it explicit height so % works */}
                <div className="flex-1 w-full flex flex-col justify-end px-1">
                  {e ? (
                    <div
                      className="w-full rounded-t-md overflow-hidden flex flex-col-reverse"
                      style={{ height: `${Math.max(pct * 100, 4)}%`, minHeight: 8 }}
                    >
                      {total > 0 ? (
                        <>
                          <div style={{ height: `${pPct * 100}%`, backgroundColor: C.protein }} />
                          <div style={{ height: `${cPct * 100}%`, backgroundColor: C.carbs   }} />
                          <div style={{ height: `${fPct * 100}%`, backgroundColor: C.fat     }} />
                        </>
                      ) : (
                        <div className="w-full h-full" style={{ backgroundColor: C.protein, opacity: 0.4 }} />
                      )}
                    </div>
                  ) : isPast && !isToday ? (
                    <div className="w-full h-2 rounded-sm" style={{ backgroundColor: C.missing }} />
                  ) : null}
                </div>

                {/* Day label */}
                <p className={cn(
                  "text-xs font-medium mt-1.5",
                  isToday ? "text-primary font-semibold" : "text-muted-foreground"
                )}>{labels[i]}</p>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 pt-3 border-t border-border/40">
          {[["Protein", C.protein], ["Carbs", C.carbs], ["Fat", C.fat]].map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: C.missing }} />
            <p className="text-xs text-muted-foreground">Missing</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Macro bar ────────────────────────────────────────────────────────────────

function MacroRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: color }} />
      <p className="text-sm text-muted-foreground w-20">{label}</p>
      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <p className="text-sm font-semibold text-foreground w-12 text-right">{value.toFixed(0)}g</p>
      <p className="text-xs text-muted-foreground w-8">{pct.toFixed(0)}%</p>
    </div>
  );
}

// ─── Month weekly overview ────────────────────────────────────────────────────

function getMonthWeeks(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const firstMonday = new Date(firstDay);
  firstMonday.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));
  const weeks: Date[][] = [];
  let ws = new Date(firstMonday);
  while (ws <= lastDay) {
    weeks.push(Array.from({ length: 7 }, (_, i) => { const d = new Date(ws); d.setDate(ws.getDate() + i); return d; }));
    ws = new Date(ws); ws.setDate(ws.getDate() + 7);
  }
  return weeks;
}

function MonthWeeklyBars({ byDay, today, year, month }: {
  byDay: Record<string, DayEntry>;
  today: Date;
  year: number;
  month: number;
}) {
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
  const weeks = getMonthWeeks(year, month);

  const weekStats = weeks.map(days => {
    const inMonth  = days.filter(d => d.getMonth() === month && d <= today);
    const isFuture = inMonth.length === 0;
    const logged   = inMonth.map(d => byDay[toDateKey(d)]).filter(e => e && e.calories_kcal > 0) as DayEntry[];
    if (!logged.length) return { isFuture, isEmpty: true } as const;
    const n = logged.length;
    const avgCal     = logged.reduce((s, e) => s + e.calories_kcal, 0) / n;
    const avgProtein = logged.filter(e => e.protein_g != null).reduce((s, e) => s + e.protein_g!, 0) / n;
    const avgCarbs   = logged.filter(e => e.carbs_g   != null).reduce((s, e) => s + e.carbs_g!,   0) / n;
    const avgFat     = logged.filter(e => e.fat_g     != null).reduce((s, e) => s + e.fat_g!,     0) / n;
    const monthDays  = days.filter(d => d.getMonth() === month);
    return { isFuture: false, isEmpty: false, avgCal, avgProtein, avgCarbs, avgFat, logged: n, total: inMonth.length, start: monthDays[0], end: monthDays[monthDays.length - 1] };
  });

  const maxCal = Math.max(...weekStats.flatMap(w => w && !w.isEmpty ? [w.avgCal] : []), 1);

  return (
    <Card className="glass-card overflow-visible">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Weekly averages</CardTitle>
      </CardHeader>
      <CardContent className="overflow-visible">
        <div className="flex gap-3 h-36 mb-2">
          {weeks.map((_, i) => {
            const s = weekStats[i];
            const hasData = s && !s.isEmpty;
            const pct = hasData ? s.avgCal / maxCal : 0;
            const mt  = hasData ? s.avgProtein + s.avgCarbs + s.avgFat : 0;
            const pPct = hasData && mt > 0 ? s.avgProtein / mt : 1/3;
            const cPct = hasData && mt > 0 ? s.avgCarbs   / mt : 1/3;
            const fPct = hasData && mt > 0 ? s.avgFat     / mt : 1/3;
            const rangeLabel = hasData ? `${s.start.getDate()}–${s.end.getDate()} ${s.start.toLocaleDateString("en-GB", { month: "short" })}` : "";

            return (
              <div
                key={i}
                className={cn("flex-1 h-full flex flex-col items-center relative rounded-xl transition-colors", hoveredWeek === i && "bg-muted/30")}
                onMouseEnter={() => setHoveredWeek(i)}
                onMouseLeave={() => setHoveredWeek(null)}
              >
                {hoveredWeek === i && hasData && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 bg-popover border border-border rounded-xl shadow-lg px-3 py-2 min-w-[120px] pointer-events-none">
                    <p className="text-xs font-semibold text-foreground mb-1">{rangeLabel}</p>
                    <p className="text-xs text-muted-foreground mb-1.5">{s.logged}/{s.total} days · {s.avgCal.toFixed(0)} kcal avg</p>
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium" style={{ color: C.protein }}>P {s.avgProtein.toFixed(0)}g</p>
                      <p className="text-xs font-medium" style={{ color: C.carbs   }}>C {s.avgCarbs.toFixed(0)}g</p>
                      <p className="text-xs font-medium" style={{ color: C.fat     }}>F {s.avgFat.toFixed(0)}g</p>
                    </div>
                  </div>
                )}

                <p className="text-[10px] font-medium h-4 flex items-center text-muted-foreground">
                  {hasData ? s.avgCal.toFixed(0) : ""}
                </p>

                <div className="flex-1 w-full flex flex-col justify-end px-1">
                  {hasData ? (
                    <div className="w-full rounded-t-md overflow-hidden flex flex-col-reverse" style={{ height: `${Math.max(pct * 100, 4)}%`, minHeight: 8 }}>
                      {mt > 0 ? (
                        <>
                          <div style={{ height: `${pPct * 100}%`, backgroundColor: C.protein }} />
                          <div style={{ height: `${cPct * 100}%`, backgroundColor: C.carbs   }} />
                          <div style={{ height: `${fPct * 100}%`, backgroundColor: C.fat     }} />
                        </>
                      ) : (
                        <div className="w-full h-full" style={{ backgroundColor: C.protein, opacity: 0.4 }} />
                      )}
                    </div>
                  ) : s?.isFuture ? (
                    <div className="w-full h-2 rounded-sm" style={{ backgroundColor: "oklch(0.88 0.12 264)" }} />
                  ) : (
                    <div className="w-full h-2 rounded-sm" style={{ backgroundColor: C.missing }} />
                  )}
                </div>

                <p className="text-xs font-medium mt-1.5 text-muted-foreground">W{i + 1}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Calendar heat map ────────────────────────────────────────────────────────

function CalendarHeatmap({ byDay, today, year, month }: { byDay: Record<string, DayEntry>; today: Date; year: number; month: number }) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  const monthCals = Array.from({ length: lastDay.getDate() }, (_, i) =>
    byDay[toDateKey(new Date(year, month, i + 1))]?.calories_kcal ?? 0
  ).filter(v => v > 0);
  const maxCal = Math.max(...monthCals, 1);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["M","T","W","T","F","S","S"].map((d, i) => (
            <p key={i} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</p>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: cells }, (_, i) => {
            const dayNum = i - startOffset + 1;
            if (dayNum < 1 || dayNum > lastDay.getDate()) return <div key={i} />;
            const cellDate = new Date(year, month, dayNum);
            const key = toDateKey(cellDate);
            const rawEntry = byDay[key];
            const entry = rawEntry?.calories_kcal > 0 ? rawEntry : null;
            const isMissing = !entry && (rawEntry?.calories_kcal === 0 || !rawEntry);
            const isPast = cellDate < today;
            const isToday = key === toDateKey(today);
            const intensity = entry ? Math.max(0.12, entry.calories_kcal / maxCal) : 0;
            const onDark = intensity > 0.5;

            return (
              <div
                key={key}
                title={entry ? `${entry.calories_kcal.toFixed(0)} kcal` : isPast ? "No data" : ""}
                className={cn(
                  "rounded-lg min-h-[44px] flex flex-col items-center justify-center cursor-default transition-all",
                  !entry && !isPast && "bg-muted/30",
                  isMissing && isPast && !isToday && "bg-destructive/10 border border-destructive/20",
                  isToday && !entry && "ring-2 ring-primary/40 bg-muted/40",
                )}
                style={entry ? { backgroundColor: `oklch(0.52 0.22 264 / ${intensity})` } : undefined}
              >
                <p
                  className={cn("text-xs font-medium", !entry && isToday && "font-bold")}
                  style={{ color: entry ? (onDark ? "white" : "oklch(0.35 0.18 264)") : isToday ? "oklch(0.52 0.22 264)" : isPast ? "oklch(0.60 0.15 25 / 0.5)" : "oklch(0.70 0 0 / 0.4)" }}
                >{dayNum}</p>
                {entry ? (
                  <p className="text-[10px] font-semibold" style={{ color: onDark ? "rgba(255,255,255,0.85)" : "oklch(0.45 0.18 264)" }}>
                    {entry.calories_kcal.toFixed(0)}
                  </p>
                ) : isMissing && isPast && !isToday ? (
                  <p className="text-[10px] text-destructive/40">✕</p>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "oklch(0.52 0.22 264 / 0.7)" }} />
            <p className="text-xs text-muted-foreground">Logged</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-destructive/15 border border-destructive/25" />
            <p className="text-xs text-muted-foreground">Missing</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NutritionPage() {
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [showMonthWarning, setShowMonthWarning] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [fetchTick, setFetchTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch("/api/nutrition").then(r => r.json()).then(d => { setEntries(d); setLoading(false); });
  }, [fetchTick]);

  async function handleSync() {
    setSyncing(true);
    const res = await fetch("/api/scrape", { method: "POST" });
    const json = await res.json();
    if (json.needsLogin) {
      window.open("https://www.mynetdiary.com/logonPage.do", "_blank");
    } else if (json.ok) {
      setLastSynced(new Date());
      setFetchTick(t => t + 1);
    }
    setSyncing(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </main>
    );
  }

  const today = new Date();
  const byDay: Record<string, DayEntry> = {};
  entries.forEach(e => { byDay[e.date] = e; });

  // Missing days (last 30)
  const missingDays: string[] = [];
  for (let i = 1; i <= 30; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = toDateKey(d);
    if (!byDay[key] || byDay[key].calories_kcal === 0) missingDays.push(key);
  }

  // Week
  const anchor = new Date(today); anchor.setDate(today.getDate() + weekOffset * 7);
  const weekDays = getWeekDays(anchor);
  const weekEntries = weekDays.map(d => byDay[toDateKey(d)]).filter(e => e && e.calories_kcal > 0) as DayEntry[];
  const isCurrentWeek = weekOffset === 0;
  const weekLabel = `${weekDays[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${weekDays[6].toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;

  const avgCal     = avg(weekEntries.map(e => e.calories_kcal));
  const avgProtein = avg(weekEntries.flatMap(e => e.protein_g != null ? [e.protein_g] : []));
  const avgCarbs   = avg(weekEntries.flatMap(e => e.carbs_g   != null ? [e.carbs_g]   : []));
  const avgFat     = avg(weekEntries.flatMap(e => e.fat_g     != null ? [e.fat_g]     : []));

  // Month navigation
  const viewMonthDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const viewYear = viewMonthDate.getFullYear();
  const viewMonth = viewMonthDate.getMonth();
  const isCurrentMonth = monthOffset === 0;
  const monthLabel = viewMonthDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const monthEntries = entries.filter(e => {
    const d = new Date(e.date + "T12:00:00");
    return e.calories_kcal > 0 && d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });
  const monthAvgCal     = avg(monthEntries.map(e => e.calories_kcal));
  const monthAvgProtein = avg(monthEntries.flatMap(e => e.protein_g != null ? [e.protein_g] : []));
  const monthAvgCarbs   = avg(monthEntries.flatMap(e => e.carbs_g   != null ? [e.carbs_g]   : []));
  const monthAvgFat     = avg(monthEntries.flatMap(e => e.fat_g     != null ? [e.fat_g]     : []));

  const missingThisWeek = weekDays.filter(d => d < today && (!byDay[toDateKey(d)] || byDay[toDateKey(d)].calories_kcal === 0));

  const daysInViewMonth = Array.from(
    { length: new Date(viewYear, viewMonth + 1, 0).getDate() },
    (_, i) => new Date(viewYear, viewMonth, i + 1)
  );
  const missingThisMonth = daysInViewMonth.filter(d => d < today && (!byDay[toDateKey(d)] || byDay[toDateKey(d)].calories_kcal === 0));

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 pt-10 pb-16 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nutrition</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {lastSynced ? `Synced ${lastSynced.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : "Track your daily intake"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing…" : "Sync"}
            </button>
            <Link href="/nutrition/entries" className="text-sm text-muted-foreground hover:text-foreground transition-colors">All entries →</Link>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Weight</Link>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="week">
          <TabsList className="w-full">
            <TabsTrigger value="week" className="flex-1">Week</TabsTrigger>
            <TabsTrigger value="month" className="flex-1">Month</TabsTrigger>
          </TabsList>

          {/* ── WEEK ─────────────────────────────────────────── */}
          <TabsContent value="week" className="mt-5 space-y-4">

            {/* Week nav */}
            <PeriodNav
              onPrev={() => setWeekOffset(o => o - 1)}
              onNext={() => setWeekOffset(o => o + 1)}
              label={weekLabel}
              sub={<>{weekEntries.length} of 7 days logged{missingThisWeek.length > 0 && <span className="text-destructive/60"> · {missingThisWeek.length} missing</span>}</>}
              disableNext={isCurrentWeek}
              onReset={!isCurrentWeek ? () => setWeekOffset(0) : undefined}
              resetLabel="↩ This week"
            />

            {/* Compact stats */}
            <Card className="glass-card">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center divide-x divide-border">
                  <StatPill label="Avg cal"     value={avgCal     ? avgCal.toFixed(0)     : null} unit="kcal" />
                  <StatPill label="Avg protein" value={avgProtein ? avgProtein.toFixed(0) : null} unit="g" accent="text-[oklch(0.55_0.22_25)]" />
                  <StatPill label="Avg carbs"   value={avgCarbs   ? avgCarbs.toFixed(0)   : null} unit="g" accent="text-[oklch(0.48_0.10_50)]" />
                  <StatPill label="Avg fat"     value={avgFat     ? avgFat.toFixed(0)     : null} unit="g" accent="text-[oklch(0.82_0.18_90)]" />
                </div>
              </CardContent>
            </Card>

            {/* Combined week bars: height = calories, colour segments = macros */}
            {weekEntries.length > 0 && (
              <WeekBars weekDays={weekDays} byDay={byDay} today={today} />
            )}

            {/* Macro split */}
            {(avgProtein || avgCarbs || avgFat) && (
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Avg macro split</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const total = (avgProtein ?? 0) + (avgCarbs ?? 0) + (avgFat ?? 0);
                    return (
                      <>
                        <MacroRow label="Avg protein" value={avgProtein ?? 0} total={total} color={C.protein} />
                        <MacroRow label="Avg carbs"   value={avgCarbs   ?? 0} total={total} color={C.carbs} />
                        <MacroRow label="Avg fat"     value={avgFat     ?? 0} total={total} color={C.fat} />
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {weekEntries.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No data for this week.</p>
            )}
          </TabsContent>

          {/* ── MONTH ────────────────────────────────────────── */}
          <TabsContent value="month" className="mt-5 space-y-4">

            {/* Month nav */}
            <PeriodNav
              onPrev={() => setMonthOffset(o => o - 1)}
              onNext={() => setMonthOffset(o => o + 1)}
              label={monthLabel}
              sub={<>{monthEntries.length} days logged{missingThisMonth.length > 0 && <span className="text-destructive/60"> · {missingThisMonth.length} missing</span>}</>}
              disableNext={isCurrentMonth}
              onReset={!isCurrentMonth ? () => setMonthOffset(0) : undefined}
              resetLabel="↩ This month"
            />

            {/* Compact monthly stats */}
            <Card className="glass-card">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center divide-x divide-border">
                  <StatPill label="Avg cal"     value={monthAvgCal     ? monthAvgCal.toFixed(0)     : null} unit="kcal" hasWarning={missingThisMonth.length > 0} onWarningEnter={() => setShowMonthWarning(true)} onWarningLeave={() => setShowMonthWarning(false)} />
                  <StatPill label="Avg protein" value={monthAvgProtein ? monthAvgProtein.toFixed(0) : null} unit="g" accent="text-[oklch(0.55_0.22_25)]" />
                  <StatPill label="Avg carbs"   value={monthAvgCarbs   ? monthAvgCarbs.toFixed(0)   : null} unit="g" accent="text-[oklch(0.48_0.10_50)]" />
                  <StatPill label="Avg fat"     value={monthAvgFat     ? monthAvgFat.toFixed(0)     : null} unit="g" accent="text-[oklch(0.82_0.18_90)]" />
                </div>
                {showMonthWarning && missingThisMonth.length > 0 && (
                  <div className="mt-4 flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700">Month not complete — {missingThisMonth.length} missing {missingThisMonth.length === 1 ? "day" : "days"}, averages may not reflect the full picture.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Macro split */}
            {(monthAvgProtein || monthAvgCarbs || monthAvgFat) && (
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Avg macro split</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const total = (monthAvgProtein ?? 0) + (monthAvgCarbs ?? 0) + (monthAvgFat ?? 0);
                    return (
                      <>
                        <MacroRow label="Avg protein" value={monthAvgProtein ?? 0} total={total} color={C.protein} />
                        <MacroRow label="Avg carbs"   value={monthAvgCarbs   ?? 0} total={total} color={C.carbs} />
                        <MacroRow label="Avg fat"     value={monthAvgFat     ?? 0} total={total} color={C.fat} />
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {monthEntries.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No data for this month.</p>
            )}

            {/* Calendar heatmap */}
            <CalendarHeatmap byDay={byDay} today={today} year={viewYear} month={viewMonth} />

            {/* Weekly averages breakdown */}
            <MonthWeeklyBars byDay={byDay} today={today} year={viewYear} month={viewMonth} />

          </TabsContent>
        </Tabs>

      </div>
    </main>
  );
}
