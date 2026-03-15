import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const data = await prisma.species.findMany({
    include: {
      userStatus: true,
      images: true,
      records: true,
      distributions: { include: { region: true } }
    },
    orderBy: { chineseName: "asc" }
  });

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const species = await prisma.species.create({
    data: {
      chineseName: String(body.chineseName),
      scientificName: String(body.scientificName),
      family: String(body.family),
      genus: String(body.genus),
      orderName: body.orderName ? String(body.orderName) : "鳞翅目",
      subfamily: body.subfamily ? String(body.subfamily) : null,
      description: body.description ? String(body.description) : null,
      notes: body.notes ? String(body.notes) : null
    }
  });

  return NextResponse.json(species, { status: 201 });
}
