import { z } from "zod";
import { infrai } from "./infrai_client.js";

export const requestSchema = z.object({ workOrderId: z.string().min(1), photoKey: z.string().min(1), sessionId: z.string().min(1), dispatchStatus: z.enum(["assigned", "en_route", "completed"]), followUp: z.string().min(1) });
export type DownloadRequest = z.infer<typeof requestSchema>;
export function mayServePhoto(input: Pick<DownloadRequest, "dispatchStatus" | "followUp">): boolean { return ["assigned", "en_route"].includes(input.dispatchStatus) && input.followUp.trim().length > 0; }

const BUCKET = "field-service-photos";
export async function prepareBucket(): Promise<void> { await infrai.storage.bucket.create({ name: BUCKET }); }
export async function servePhoto(raw: unknown): Promise<{ workOrderId: string; downloadUrl: string }> {
  const input = requestSchema.parse(raw);
  if (!mayServePhoto(input)) throw new Error("photo access is closed for this work order");
  const session = await infrai.auth.session.verify(input.sessionId);
  if (!session.valid) throw new Error("session is not valid");
  const signed = await infrai.storage.object.presign(BUCKET, input.photoKey, { op: "get", expires_seconds: 300, response_disposition: "inline" });
  return { workOrderId: input.workOrderId, downloadUrl: signed.url };
}
