import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/uploads";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  await saveUpload(fileName, bytes);

  const image = await prisma.imageAsset.create({
    data: {
      speciesId: id,
      collectionRecordId: formData.get("collectionRecordId") ? String(formData.get("collectionRecordId")) : null,
      fileName,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      title: formData.get("title") ? String(formData.get("title")) : null,
      description: formData.get("description") ? String(formData.get("description")) : null
    }
  });

  return NextResponse.json(image, { status: 201 });
}
