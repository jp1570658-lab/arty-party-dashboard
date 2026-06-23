import { put } from "@vercel/blob";

/**
 * Persist an uploaded file and return a servable URL.
 * - Production (Vercel): writes to Vercel Blob (BLOB_READ_WRITE_TOKEN set),
 *   returns an absolute https URL.
 * - Local dev: writes under /public and returns a root-relative URL.
 *
 * `key` is a path-like storage key, e.g. "uploads/meetings/<uuid>.pdf".
 */
export async function saveUpload(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { url } = await put(key, body, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return url;
  }

  // Local dev fallback — write into /public so Next serves it.
  const { writeFile, mkdir } = await import("fs/promises");
  const path = await import("path");
  const abs = path.join(process.cwd(), "public", key);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, body);
  return "/" + key.replace(/\\/g, "/");
}
