import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { isConfigured } from "../../common/env";

type MediaAssetKind = "product" | "hero" | "banner" | "logo" | "evidence";

interface UploadFileInput {
  buffer: Buffer;
  mimetype?: string;
  originalname?: string;
}

interface UploadPreparedAsset {
  objectKey: string;
  url: string;
  buffer: Buffer;
  contentType: string;
  width?: number;
  height?: number;
  sizeBytes: number;
}

interface UploadOptions {
  kind: MediaAssetKind;
  slug: string;
  preserveSvg?: boolean;
}

type SharpFailOn = "error" | "none";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 6000;

const rasterMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const svgMimeTypes = new Set(["image/svg+xml"]);
const truncatedEvidenceJpegPattern = /premature end of JPEG image/i;

const resizeProfiles: Record<MediaAssetKind, { maxWidth: number; maxHeight: number; quality: number }> = {
  product: { maxWidth: 1600, maxHeight: 1600, quality: 82 },
  hero: { maxWidth: 2400, maxHeight: 2400, quality: 78 },
  banner: { maxWidth: 1920, maxHeight: 1920, quality: 80 },
  logo: { maxWidth: 512, maxHeight: 512, quality: 86 },
  evidence: { maxWidth: 1920, maxHeight: 1920, quality: 80 }
};

function sanitizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "asset";
}

function buildObjectKey(kind: MediaAssetKind, slug: string) {
  return `${kind}/${sanitizeSlug(slug)}/${Date.now()}-${randomUUID()}.webp`;
}

function buildSvgObjectKey(kind: MediaAssetKind, slug: string, originalname?: string) {
  const extension = extname(originalname ?? "").toLowerCase() || ".svg";
  return `${kind}/${sanitizeSlug(slug)}/${Date.now()}-${randomUUID()}${extension}`;
}

@Injectable()
export class MediaService {
  private readonly endpoint = process.env.R2_ENDPOINT;
  private readonly bucket = process.env.R2_BUCKET_PUBLIC;
  private readonly publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;
  private readonly client =
    isConfigured(process.env.R2_ACCESS_KEY_ID) &&
    isConfigured(process.env.R2_SECRET_ACCESS_KEY) &&
    isConfigured(process.env.R2_ENDPOINT)
      ? new S3Client({
          region: process.env.R2_REGION || "auto",
          endpoint: process.env.R2_ENDPOINT,
          forcePathStyle: true,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
          }
        })
      : null;

  isReady() {
    return Boolean(this.client && isConfigured(this.bucket) && isConfigured(this.publicBaseUrl));
  }

  async uploadImage(file: UploadFileInput, options: UploadOptions) {
    this.assertConfigured();

    if (!file.buffer?.length) {
      throw new BadRequestException("No recibimos un archivo para subir.");
    }

    if (file.buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException("El archivo excede el límite máximo permitido.");
    }

    const prepared = await this.prepareAsset(file, options);

    try {
      await this.client!.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: prepared.objectKey,
          Body: prepared.buffer,
          ContentType: prepared.contentType,
          CacheControl: "public, max-age=31536000, immutable"
        })
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `No pudimos subir el archivo a R2. ${error instanceof Error ? error.message : "Storage error."}`
      );
    }

    return {
      objectKey: prepared.objectKey,
      url: prepared.url,
      contentType: prepared.contentType,
      width: prepared.width,
      height: prepared.height,
      sizeBytes: prepared.sizeBytes
    };
  }

  async deleteByPublicUrl(url: string) {
    if (!this.isReady()) {
      return;
    }

    const objectKey = this.resolveObjectKey(url);
    if (!objectKey) {
      return;
    }

    await this.client!.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: objectKey
      })
    );
  }

  private async prepareAsset(file: UploadFileInput, options: UploadOptions): Promise<UploadPreparedAsset> {
    const mimetype = file.mimetype?.toLowerCase() ?? "";

    if (options.preserveSvg && svgMimeTypes.has(mimetype)) {
      const key = buildSvgObjectKey(options.kind, options.slug, file.originalname);
      return {
        objectKey: key,
        url: `${this.publicBaseUrl!.replace(/\/$/, "")}/${key}`,
        buffer: file.buffer,
        contentType: "image/svg+xml",
        sizeBytes: file.buffer.length
      };
    }

    if (!rasterMimeTypes.has(mimetype)) {
      throw new BadRequestException("Formato de imagen no soportado. Usa JPG, PNG, WebP o AVIF.");
    }

    try {
      return await this.prepareRasterAsset(file, options, "error");
    } catch (error) {
      if (this.shouldRetryTruncatedEvidence(error, options, mimetype)) {
        try {
          // Some mobile wallets export JPEGs that browsers can preview but libvips
          // flags as truncated. Recover them only for payment evidence uploads.
          console.warn("[media] retrying truncated JPEG payment evidence with failOn=none", {
            originalname: file.originalname,
            mimetype,
            sizeBytes: file.buffer.length
          });
          return await this.prepareRasterAsset(file, options, "none");
        } catch (retryError) {
          this.throwImageProcessingError(retryError);
        }
      }

      this.throwImageProcessingError(error);
    }
  }

  private async prepareRasterAsset(
    file: UploadFileInput,
    options: UploadOptions,
    failOn: SharpFailOn
  ): Promise<UploadPreparedAsset> {
    const profile = resizeProfiles[options.kind];
    const pipeline = sharp(file.buffer, { failOn }).rotate();
    const metadata = await pipeline.metadata();

    if (!metadata.width || !metadata.height) {
      throw new BadRequestException("No pudimos leer las dimensiones de la imagen.");
    }

    if (metadata.width > MAX_IMAGE_DIMENSION || metadata.height > MAX_IMAGE_DIMENSION) {
      throw new BadRequestException("La imagen es demasiado grande para procesarla de forma segura.");
    }

    const buffer = await pipeline
      .resize({
        width: profile.maxWidth,
        height: profile.maxHeight,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({
        quality: profile.quality,
        effort: 5
      })
      .toBuffer();

    const outputMetadata = await sharp(buffer).metadata();
    const objectKey = buildObjectKey(options.kind, options.slug);

    return {
      objectKey,
      url: `${this.publicBaseUrl!.replace(/\/$/, "")}/${objectKey}`,
      buffer,
      contentType: "image/webp",
      width: outputMetadata.width,
      height: outputMetadata.height,
      sizeBytes: buffer.length
    };
  }

  private shouldRetryTruncatedEvidence(error: unknown, options: UploadOptions, mimetype: string) {
    return (
      options.kind === "evidence" &&
      mimetype === "image/jpeg" &&
      error instanceof Error &&
      truncatedEvidenceJpegPattern.test(error.message)
    );
  }

  private throwImageProcessingError(error: unknown): never {
    if (error instanceof BadRequestException) {
      throw error;
    }

    throw new BadRequestException(`No pudimos procesar la imagen. ${this.formatImageProcessingError(error)}`);
  }

  private formatImageProcessingError(error: unknown) {
    if (!(error instanceof Error)) {
      return "Archivo inválido.";
    }

    if (truncatedEvidenceJpegPattern.test(error.message)) {
      return "El archivo JPG parece incompleto. Intenta subirlo de nuevo o exportarlo como PNG o WebP.";
    }

    return error.message;
  }

  private resolveObjectKey(url: string) {
    if (!isConfigured(this.publicBaseUrl) || !url.startsWith(this.publicBaseUrl!)) {
      return null;
    }

    return url.slice(this.publicBaseUrl!.length).replace(/^\/+/, "");
  }

  private assertConfigured() {
    if (!this.isReady()) {
      throw new InternalServerErrorException(
        `Cloudflare R2 no está configurado. Revisa R2_ENDPOINT, R2_BUCKET_PUBLIC y R2_PUBLIC_BASE_URL.`
      );
    }
  }
}
