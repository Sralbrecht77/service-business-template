import type { BusinessConfig } from "@/lib/business-config";

type UploadConfig = BusinessConfig["bookingUploads"];

function hasExpectedSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  if (mimeType === "image/webp") {
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  }

  return false;
}

export async function validateBookingPhotos(
  values: FormDataEntryValue[],
  config: UploadConfig,
) {
  if (!config.enabled && values.length > 0) {
    return { files: [] as File[], error: "Photo uploads are not enabled." };
  }

  if (values.length > config.maxFiles) {
    return {
      files: [] as File[],
      error: `Upload no more than ${config.maxFiles} photos.`,
    };
  }

  const files: File[] = [];
  for (const value of values) {
    if (!(value instanceof File) || value.size <= 0) {
      return { files: [] as File[], error: "Each upload must be an image file." };
    }
    if (value.name.length > 200) {
      return { files: [] as File[], error: "A photo filename is too long." };
    }
    if (!config.acceptedMimeTypes.includes(value.type)) {
      return { files: [] as File[], error: "Photos must be JPEG, PNG, or WebP images." };
    }
    if (value.size > config.maxFileSizeBytes) {
      return {
        files: [] as File[],
        error: `Each photo must be ${Math.floor(config.maxFileSizeBytes / 1024 / 1024)} MB or smaller.`,
      };
    }

    const bytes = new Uint8Array(await value.slice(0, 12).arrayBuffer());
    if (!hasExpectedSignature(bytes, value.type)) {
      return {
        files: [] as File[],
        error: "A selected file does not match its image format.",
      };
    }

    files.push(value);
  }

  return { files, error: null as string | null };
}

export function extensionForMimeType(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  throw new Error("Unsupported image type");
}
