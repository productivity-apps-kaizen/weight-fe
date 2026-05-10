import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  const client = await clientPromise;
  const col = client.db(process.env.MONGODB_DB).collection("nutrition");

  const docs = await col.find({}).sort({ date: 1 }).toArray();

  return NextResponse.json(
    docs.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest }))
  );
}
