import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

async function getCol() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB).collection(process.env.MONGODB_COLLECTION!);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const col = await getCol();
  await col.deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const col = await getCol();
  await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { weight_kg: body.weight_kg, timestamp: body.timestamp } }
  );
  return NextResponse.json({ ok: true });
}
