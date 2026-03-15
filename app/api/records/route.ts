import { NextResponse } from "next/server";
import { RecordStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const records = await prisma.collectionRecord.findMany({
    include: {
      species: true,
      region: true,
      images: true
    },
    orderBy: { observedAt: "desc" }
  });

  return NextResponse.json(records);
}

export async function POST(request: Request) {
  const body = await request.json();

  const record = await prisma.collectionRecord.create({
    data: {
      speciesId: String(body.speciesId),
      regionId: String(body.regionId),
      observedAt: new Date(String(body.observedAt)),
      locationDetail: String(body.locationDetail),
      status: (body.status as RecordStatus) ?? RecordStatus.confirmed,
      quantity: Number(body.quantity ?? 1),
      note: body.note ? String(body.note) : null
    }
  });

  return NextResponse.json(record, { status: 201 });
}
