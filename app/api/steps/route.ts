import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  const client = await clientPromise;
  const col = client.db(process.env.MONGODB_DB).collection("steps");
  const docs = await col.find({}).sort({ date: 1 }).toArray();
  return NextResponse.json(docs.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest })));
}

export async function POST(req: Request) {
  const { date, steps } = await req.json();
  if (!date || steps == null) {
    return NextResponse.json({ error: "date and steps required" }, { status: 400 });
  }

  const client = await clientPromise;
  const col = client.db(process.env.MONGODB_DB).collection("steps");
  await col.updateOne({ date }, { $set: { date, steps } }, { upsert: true });

  return NextResponse.json({ ok: true });
}
