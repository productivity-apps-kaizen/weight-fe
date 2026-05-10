import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  const client = await clientPromise;
  const col = client
    .db(process.env.MONGODB_DB)
    .collection(process.env.MONGODB_COLLECTION!);

  const readings = await col
    .find({})
    .sort({ timestamp: 1 })
    .toArray();

  return NextResponse.json(
    readings.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest }))
  );
}
