import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const payload = {
    species: await prisma.species.findMany({
      include: { aliases: true, userStatus: true, distributions: true, images: true }
    }),
    regions: await prisma.region.findMany(),
    distributions: await prisma.speciesRegionDistribution.findMany(),
    records: await prisma.collectionRecord.findMany(),
    images: await prisma.imageAsset.findMany(),
    logs: await prisma.importExportLog.findMany()
  };

  await prisma.importExportLog.create({
    data: {
      type: "export_all",
      fileName: "all-data.json",
      itemCount: Object.values(payload).reduce((count, current) => count + current.length, 0),
      status: "success",
      message: "已导出全部数据"
    }
  });

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="butterfly-export.json"'
    }
  });
}
