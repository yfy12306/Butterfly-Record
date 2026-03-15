import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export const uploadsDir = path.join(process.cwd(), "uploads");

export async function ensureUploadsDir() {
  await mkdir(uploadsDir, { recursive: true });
}

export async function saveUpload(fileName: string, bytes: Uint8Array) {
  await ensureUploadsDir();
  const target = path.join(uploadsDir, fileName);
  await writeFile(target, bytes);
  return target;
}

export async function readUpload(fileName: string) {
  return readFile(path.join(uploadsDir, fileName));
}
