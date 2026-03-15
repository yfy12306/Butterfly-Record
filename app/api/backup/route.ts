import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const filePath = path.join(process.cwd(), "prisma", "dev.db");
  const buffer = await readFile(filePath);

  await prisma.importExportLog.create({
    data: {
      type: "backup_database",
      fileName: "dev.db",
      itemCount: 1,
      status: "success",
      message: "数据库备份已下载"
    }
  });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": 'attachment; filename="butterfly-dev.db"'
    }
  });
}
