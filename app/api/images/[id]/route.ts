import { unlink } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const current = await prisma.imageAsset.findUnique({ where: { id } });

  if (!current) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  if (body.isCover && current.speciesId) {
    await prisma.imageAsset.updateMany({
      where: { speciesId: current.speciesId },
      data: { isCover: false }
    });
  }

  const image = await prisma.imageAsset.update({
    where: { id },
    data: {
      title: body.title !== undefined ? String(body.title || "") || null : undefined,
      description: body.description !== undefined ? String(body.description || "") || null : undefined,
      isCover: body.isCover ? true : undefined
    }
  });

  return NextResponse.json(image);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const image = await prisma.imageAsset.delete({ where: { id } });

  try {
    await unlink(path.join(process.cwd(), "uploads", image.fileName));
  } catch {}

  return NextResponse.json({ ok: true });
}
