import { RegionLevel } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseCsv } from "@/lib/csv";
import { slugify } from "@/lib/utils";

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

    if (!species) continue;

    const region = await prisma.region.upsert({
      where: { slug: slugify(row.regionName) },
      update: {},
      create: {
        name: row.regionName,
        slug: slugify(row.regionName),
        level: (row.level as RegionLevel) || RegionLevel.city
      }
    });

    await prisma.speciesRegionDistribution.upsert({
      where: {
        speciesId_regionId: {
          speciesId: species.id,
          regionId: region.id
        }
      },
      update: {
        note: row.note || null
      },
      create: {
        speciesId: species.id,
        regionId: region.id,
        note: row.note || null
      }
    });
  }

  await prisma.importExportLog.create({
    data: {
      type: "import_distribution",
      fileName: file.name,
      itemCount: rows.length,
      status: "success",
      message: "地区分布 CSV 导入成功"
    }
  });

  return NextResponse.redirect(new URL("/import-export", request.url));
}
