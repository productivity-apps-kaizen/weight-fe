"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User, Ruler, Target, Scale } from "lucide-react";

type Profile = {
  dob?: string;       // YYYY-MM-DD
  height_cm?: number;
};

type WeightEntry = {
  weight_kg: number;
  timestamp: string;
};

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function calcBMI(weight: number, heightCm: number): number {
  const h = heightCm / 100;
  return weight / (h * h);
}

function bmiLabel(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-500" };
  if (bmi < 25)   return { label: "Normal",      color: "text-green-600" };
  if (bmi < 30)   return { label: "Overweight",  color: "text-amber-500" };
  return             { label: "Obese",        color: "text-red-500" };
}

function InfoRow({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-border/50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({});
  const [latestWeight, setLatestWeight] = useState<WeightEntry | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ dob: "", height_cm: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then(r => r.json()),
      fetch("/api/weight").then(r => r.json()),
    ]).then(([prof, weights]) => {
      setProfile(prof);
      setForm({ dob: prof.dob ?? "", height_cm: prof.height_cm?.toString() ?? "" });
      const sorted = [...weights].sort((a: WeightEntry, b: WeightEntry) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setLatestWeight(sorted[0] ?? null);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    const patch: Profile = {};
    if (form.dob) patch.dob = form.dob;
    if (form.height_cm) patch.height_cm = parseFloat(form.height_cm);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setProfile(patch);
    setSaving(false);
    setEditing(false);
  }

  if (loading) {
    return <main className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm">Loading...</p></main>;
  }

  const weight = latestWeight?.weight_kg;
  const proteinGoal = weight ? Math.round(weight * 2) : null;
  const bmi = weight && profile.height_cm ? calcBMI(weight, profile.height_cm) : null;
  const bmiInfo = bmi ? bmiLabel(bmi) : null;
  const age = profile.dob ? calcAge(profile.dob) : null;
  const isEmpty = !profile.dob && !profile.height_cm;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 pt-10 pb-16 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Your stats & goals</p>
          </div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Dashboard</Link>
        </div>

        {isEmpty && !editing && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-primary font-medium">Add your details to unlock protein goals and BMI tracking.</p>
              <button onClick={() => setEditing(true)} className="mt-2 text-sm text-primary underline underline-offset-2">Fill in now →</button>
            </CardContent>
          </Card>
        )}

        {/* Edit form */}
        {editing ? (
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm font-semibold">Edit profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Date of birth</p>
                <input
                  type="date"
                  value={form.dob}
                  onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Height (cm)</p>
                <input
                  type="number"
                  placeholder="e.g. 178"
                  value={form.height_cm}
                  onChange={e => setForm(f => ({ ...f, height_cm: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button onClick={() => setEditing(false)} className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Personal info</CardTitle>
                <button onClick={() => setEditing(true)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors">Edit</button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {profile.dob && (
                <InfoRow
                  icon={<User size={14} />}
                  label="Date of birth"
                  value={new Date(profile.dob + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  sub={age != null ? `${age} years old` : undefined}
                />
              )}
              {profile.height_cm && (
                <InfoRow
                  icon={<Ruler size={14} />}
                  label="Height"
                  value={`${profile.height_cm} cm`}
                />
              )}
              {weight && (
                <InfoRow
                  icon={<Scale size={14} />}
                  label="Current weight"
                  value={`${weight.toFixed(1)} kg`}
                  sub={latestWeight ? `As of ${new Date(latestWeight.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : undefined}
                />
              )}
              {!profile.dob && !profile.height_cm && (
                <p className="text-sm text-muted-foreground py-2">No info added yet.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Protein goal */}
        {weight && (
          <Card className="glass-card border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold">Daily protein goal</CardTitle>
                <Target size={13} className="text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end gap-3">
                <p className="text-5xl font-semibold tracking-tight text-primary">{proteinGoal}<span className="text-xl font-normal text-muted-foreground ml-1">g</span></p>
                <p className="text-sm text-muted-foreground pb-1.5">per day</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Based on 2× your body weight ({weight.toFixed(1)} kg × 2 = {proteinGoal}g)
              </p>
              <div className="bg-muted/60 rounded-xl p-3 mt-1">
                <p className="text-xs text-muted-foreground">
                  This is a common guideline for muscle retention and general health. Adjust to 1.6–2.2× if you're actively training.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* BMI */}
        {bmi && bmiInfo && (
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">BMI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 mb-2">
                <p className="text-4xl font-semibold tracking-tight text-foreground">{bmi.toFixed(1)}</p>
                <Badge variant="outline" className={cn("mb-1 font-medium", bmiInfo.color)}>{bmiInfo.label}</Badge>
              </div>
              <div className="relative h-2 rounded-full mt-3" style={{ background: "linear-gradient(to right, #93c5fd 0%, #93c5fd 14%, #4ade80 14%, #4ade80 40%, #fbbf24 40%, #fbbf24 60%, #ef4444 60%, #ef4444 100%)" }}>
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-foreground rounded-full shadow"
                  style={{ left: `${Math.min(95, Math.max(2, ((bmi - 15) / 25) * 100))}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                {["15", "18.5", "25", "30", "40"].map(v => (
                  <p key={v} className="text-[10px] text-muted-foreground">{v}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Nav links */}
        <div className="flex gap-3">
          <Link href="/nutrition" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Nutrition →</Link>
        </div>

      </div>
    </main>
  );
}
