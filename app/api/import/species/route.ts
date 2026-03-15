import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseCsv } from "@/lib/csv";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCsv(text);

  for (const row of rows) {
    await prisma.species.upsert({
      where: { scientificName: row.scientificName },
      update: {
        chineseName: row.chineseName,
        family: row.family,
        genus: row.genus,
        description: row.description || null,
        notes: row.notes || null
      },
      create: {
        chineseName: row.chineseName,
        scientificName: row.scientificName,
        family: row.family,
        genus: row.genus,
        description: row.description || null,
        notes: row.notes || null
      }
    });
  }

  await prisma.importExportLog.create({
    data: {
      type: "import_species",
      fileName: file.name,
      itemCount: rows.length,
      status: "success",
      message: "物种 CSV 导入成功"
    }
  });

  return NextResponse.redirect(new URL("/import-export", request.url));
}
