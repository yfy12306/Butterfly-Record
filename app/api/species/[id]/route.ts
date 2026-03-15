import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const species = await prisma.species.findUnique({
    where: { id },
    include: {
      aliases: true,
      userStatus: true,
      records: true,
      images: true,
      distributions: { include: { region: true } }
    }
  });

  if (!species) {
    return NextResponse.json({ error: "Species not found" }, { status: 404 });
  }

  return NextResponse.json(species);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.species.update({
    where: { id },
    data: {
      userStatus: {
        upsert: {
          create: {
            isTarget: Boolean(body.isTarget),
            isPendingIdentify: Boolean(body.isPendingIdentify),
            isNewDiscovery: Boolean(body.isNewDiscovery),
            personalNote: body.personalNote ? String(body.personalNote) : null
          },
          update: {
            isTarget: Boolean(body.isTarget),
            isPendingIdentify: Boolean(body.isPendingIdentify),
            isNewDiscovery: Boolean(body.isNewDiscovery),
            personalNote: body.personalNote ? String(body.personalNote) : null
          }
        }
      }
    },
    include: { userStatus: true }
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.species.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
