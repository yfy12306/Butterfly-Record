import { NextResponse } from "next/server";
import { RecordStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const record = await prisma.collectionRecord.update({
    where: { id },
    data: {
      speciesId: body.speciesId ? String(body.speciesId) : undefined,
      regionId: body.regionId ? String(body.regionId) : undefined,
      observedAt: body.observedAt ? new Date(String(body.observedAt)) : undefined,
      locationDetail: body.locationDetail ? String(body.locationDetail) : undefined,
      status: body.status ? (body.status as RecordStatus) : undefined,
      quantity: body.quantity ? Number(body.quantity) : undefined,
      note: body.note ? String(body.note) : null
    }
  });

  return NextResponse.json(record);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.collectionRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
