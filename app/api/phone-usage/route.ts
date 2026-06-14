import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  const client = await clientPromise;
  const col = client.db(process.env.MONGODB_DB).collection("phone_usage");
  const records = await col.find({ date }).sort({ minutes: -1 }).toArray();

  return NextResponse.json(records);
}

interface UsageRecord {
  date: string;
  package: string;
  app: string;
  minutes: number;
  opens: number;
  device: string;
}

export async function POST(req: Request) {
  // Simple bearer-token auth so the endpoint isn't open to anyone
  const auth = req.headers.get("Authorization") ?? "";
  const token = process.env.PHONE_USAGE_TOKEN;
  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let records: UsageRecord[];
  try {
    const body = await req.json();
    records = Array.isArray(body) ? body : body.records;
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "records array required" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const client = await clientPromise;
  const col = client.db(process.env.MONGODB_DB).collection("phone_usage");

  // Upsert each record by (date, package) so re-syncing the same day is safe
  const ops = records.map((r) => ({
    updateOne: {
      filter: { date: r.date, package: r.package },
      update: { $set: r },
      upsert: true,
    },
  }));

  const result = await col.bulkWrite(ops);
  return NextResponse.json({ ok: true, upserted: result.upsertedCount, modified: result.modifiedCount });
}
