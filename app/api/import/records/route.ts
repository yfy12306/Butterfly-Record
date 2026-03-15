import { RecordStatus } from "@prisma/client";
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
    const species = await prisma.species.findFirst({
      where: {
        OR: [{ scientificName: row.scientificName }, { chineseName: row.chineseName }]
      }
    });
    const region = await prisma.region.findFirst({ where: { name: row.regionName } });

    if (!species || !region) continue;

    await prisma.collectionRecord.create({
      data: {
        speciesId: species.id,
        regionId: region.id,
        observedAt: row.observedAt ? new Date(row.observedAt) : new Date(),
        locationDetail: row.locationDetail || "未填写地点",
        status: (row.status as RecordStatus) || RecordStatus.confirmed,
        quantity: row.quantity ? Number(row.quantity) : 1,
        note: row.note || null
      }
    });
  }

  await prisma.importExportLog.create({
    data: {
      type: "import_records",
      fileName: file.name,
      itemCount: rows.length,
      status: "success",
      message: "个人记录 CSV 导入成功"
    }
  });

  return NextResponse.redirect(new URL("/import-export", request.url));
}
