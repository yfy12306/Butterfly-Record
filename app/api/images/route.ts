import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const images = await prisma.imageAsset.findMany({
    include: {
      species: true,
      collectionRecord: true
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(images);
}
