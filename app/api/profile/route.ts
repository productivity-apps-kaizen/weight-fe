import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

async function getCol() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB).collection("profile");
}

export async function GET() {
  const col = await getCol();
  const doc = await col.findOne({});
  if (!doc) return NextResponse.json({});
  const { _id, ...rest } = doc;
  return NextResponse.json({ id: _id.toString(), ...rest });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const col = await getCol();
  await col.updateOne({}, { $set: body }, { upsert: true });
  return NextResponse.json({ ok: true });
}
