import { basename } from "path";
import { NextResponse } from "next/server";
import { readUpload } from "@/lib/uploads";

const mimeMap: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml"
};

export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolved = await params;
  const fileName = basename(resolved.path.join("/"));
  const data = await readUpload(fileName);
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  return new NextResponse(data, {
    headers: {
      "Content-Type": mimeMap[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
