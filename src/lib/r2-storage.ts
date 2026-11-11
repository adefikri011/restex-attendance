import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export class R2NotConfiguredError extends Error {
  constructor() {
    super("Penyimpanan foto belum dikonfigurasi.");
    this.name = "R2NotConfiguredError";
  }
}

let client: S3Client | undefined;

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();

  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    throw new R2NotConfiguredError();
  }

  return { accountId, bucket, accessKeyId, secretAccessKey };
}

function getClient() {
  const { accountId, accessKeyId, secretAccessKey } = getR2Config();
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

export function isProfileObjectKey(value: string, userId?: string) {
  const prefix = userId ? `profiles/${userId}/` : "profiles/";
  return (
    value.startsWith(prefix) &&
    /^profiles\/[0-9a-f-]{36}\/[A-Za-z0-9._-]+$/i.test(value) &&
    !value.includes("..")
  );
}

export async function putProfileImage(
  key: string,
  body: Uint8Array,
  contentType: string,
) {
  const { bucket } = getR2Config();
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentLength: body.byteLength,
      ContentType: contentType,
      CacheControl: "private, no-store",
    }),
  );
}

export async function getProfileImage(key: string) {
  const { bucket } = getR2Config();
  return getClient().send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

export async function deleteProfileImage(key: string) {
  const { bucket } = getR2Config();
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}
