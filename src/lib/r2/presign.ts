import "server-only";

import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getR2Client, getR2Config } from "@/src/lib/r2/client";

export async function createR2PresignedPutUrl(params: {
  storageKey: string;
  contentType: string;
  expiresInSeconds?: number;
}) {
  const client = getR2Client();
  const { bucket } = getR2Config();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.storageKey,
    ContentType: params.contentType,
  });

  return getSignedUrl(client, command, {
    expiresIn: params.expiresInSeconds ?? 60 * 10,
  });
}

export async function deleteFromR2(storageKey: string) {
  const client = getR2Client();
  const { bucket } = getR2Config();

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: storageKey,
  });

  return client.send(command);
}

export function buildPublicR2Url(storageKey: string) {
  const { publicBaseUrl } = getR2Config();
  return `${publicBaseUrl}/${storageKey}`;
}
