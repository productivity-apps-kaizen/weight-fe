import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

interface PhoneSession {
  package: string;
  app: string;
  startMs: number;
  endMs: number;
  device: string;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

// GET /api/phone-sessions?date=YYYY-MM-DD
// Returns all sessions whose startMs falls within that local day.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toLocaleDateString("en-CA");

  // Build UTC ms range for the requested local date
  const startMs = new Date(date + "T00:00:00").getTime();
  const endMs   = new Date(date + "T23:59:59.999").getTime();

  const client = await clientPromise;
  const col = client.db(process.env.MONGODB_DB).collection("phone_sessions");
  const sessions = await col
    .find({ startMs: { $gte: startMs, $lte: endMs } })
    .sort({ startMs: 1 })
    .toArray();

  return NextResponse.json(sessions, { headers: CORS });
}

// POST /api/phone-sessions  { sessions: PhoneSession[] }
// Upserts on (package, startMs) — safe to call repeatedly, no duplicates.
export async function POST(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  const token = process.env.PHONE_USAGE_TOKEN;
  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
  }

  let sessions: PhoneSession[];
  try {
    const body = await req.json();
    sessions = Array.isArray(body) ? body : body.sessions;
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json({ error: "sessions array required" }, { status: 400, headers: CORS });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
  }

  const client = await clientPromise;
  const col = client.db(process.env.MONGODB_DB).collection("phone_sessions");

  const ops = sessions.map((s) => ({
    updateOne: {
      filter: { package: s.package, startMs: s.startMs },
      update: { $set: s },
      upsert: true,
    },
  }));

  const result = await col.bulkWrite(ops);
  return NextResponse.json(
    { ok: true, upserted: result.upsertedCount, modified: result.modifiedCount },
    { headers: CORS }
  );
}
