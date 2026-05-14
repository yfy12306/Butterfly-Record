import * as FileSystem from "expo-file-system/legacy";
import { createId } from "./id";

const APP_ROOT = `${FileSystem.documentDirectory ?? ""}butterfly-collection/`;
const PHOTO_DIRECTORY = `${APP_ROOT}photos/`;
const EXPORT_DIRECTORY = `${APP_ROOT}exports/`;
const IMPORT_DIRECTORY = `${APP_ROOT}imports/`;

function normalizeManagedUri(uri: string) {
  return decodeURI(uri).replace(/\\/g, "/");
}

function ensureFileSystemAvailable() {
  if (!FileSystem.documentDirectory) {
    throw new Error("File system is not available on this platform.");
  }
}

async function ensureDirectory(dir: string) {
  ensureFileSystemAvailable();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

function inferFileExtension(uri: string, fallback = "jpg") {
  try {
    const pathname = new URL(uri).pathname;
    const fileName = pathname.split("/").pop() ?? "";
    const extension = fileName.split(".").pop();
    return extension?.trim().toLowerCase() || fallback;
  } catch {
    const fileName = uri.split("?")[0]?.split("/").pop() ?? "";
    const extension = fileName.split(".").pop();
    return extension?.trim().toLowerCase() || fallback;
  }
}

export async function ensureAppDirectories() {
  await Promise.all([ensureDirectory(APP_ROOT), ensureDirectory(PHOTO_DIRECTORY), ensureDirectory(EXPORT_DIRECTORY), ensureDirectory(IMPORT_DIRECTORY)]);
}

export function isManagedFileUri(fileUri?: string | null, safeRootUri = APP_ROOT) {
  if (!fileUri) {
    return false;
  }

  return normalizeManagedUri(fileUri).startsWith(normalizeManagedUri(safeRootUri));
}

export function isManagedPhotoUri(fileUri?: string | null) {
  return isManagedFileUri(fileUri, PHOTO_DIRECTORY);
}

export async function persistPhotoToSandbox(sourceUri: string, extensionHint?: string) {
  await ensureAppDirectories();
  const extension = inferFileExtension(sourceUri, extensionHint);
  const targetUri = `${PHOTO_DIRECTORY}${createId("photo_")}.${extension}`;
  await FileSystem.copyAsync({ from: sourceUri, to: targetUri });
  return targetUri;
}

export async function persistBase64PhotoToSandbox(base64: string, extensionHint = "jpg") {
  await ensureAppDirectories();
  const targetUri = `${PHOTO_DIRECTORY}${createId("photo_")}.${extensionHint.replace(/^\./, "")}`;
  await writeBase64File(targetUri, base64);
  return targetUri;
}

export async function downloadRemotePhotoToSandbox(remoteUrl: string, extensionHint?: string) {
  await ensureAppDirectories();
  const extension = inferFileExtension(remoteUrl, extensionHint);
  const targetUri = `${PHOTO_DIRECTORY}${createId("photo_")}.${extension}`;
  await FileSystem.downloadAsync(remoteUrl, targetUri);
  return targetUri;
}

export async function deleteFileIfExists(fileUri?: string | null, options?: { safeRootUri?: string }) {
  if (!fileUri) {
    return false;
  }

  const safeRootUri = options?.safeRootUri ?? APP_ROOT;
  if (!isManagedFileUri(fileUri, safeRootUri)) {
    throw new Error("Refusing to delete a file outside the app sandbox.");
  }

  const info = await FileSystem.getInfoAsync(fileUri);
  if (info.exists) {
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
  }

  return info.exists;
}

export async function readFileBase64(fileUri: string) {
  return FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
}

export async function writeBase64File(fileUri: string, contents: string) {
  await FileSystem.writeAsStringAsync(fileUri, contents, { encoding: FileSystem.EncodingType.Base64 });
}

export async function writeTextFile(fileUri: string, contents: string) {
  await FileSystem.writeAsStringAsync(fileUri, contents, { encoding: FileSystem.EncodingType.UTF8 });
}

export async function readTextFile(fileUri: string) {
  return FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
}

export async function createExportFileUri(fileName: string) {
  await ensureAppDirectories();
  return `${EXPORT_DIRECTORY}${fileName}`;
}

export async function createImportFileUri(fileName: string) {
  await ensureAppDirectories();
  return `${IMPORT_DIRECTORY}${fileName}`;
}

export async function getFileInfo(fileUri: string) {
  return FileSystem.getInfoAsync(fileUri);
}

export function getPhotoDirectoryUri() {
  return PHOTO_DIRECTORY;
}
