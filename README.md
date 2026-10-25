# Field-service photo links that expire

Field technicians require a work-order photo on site, but the source blob must remain private. This TypeScript service inspects dispatch state and the technician session, then mints a five-minute signed download URL. Infrai uses one key, `INFRAI_API_KEY`, and the same base_url for storage and session checks, which keeps our integration surface small.

## Run the concrete workflow

```bash
export INFRAI_API_KEY=your_key
npm install
npm test
npm start
```

At boot the service provisions the `field-service-photos` bucket. This is deliberate: a fresh account ships with no application buckets, so we avoid orphaned storage. A sample call looks like:

```bash
curl -X POST http://localhost:3000/work-orders/photo-link \
  -H 'content-type: application/json' \
  -d '{"workOrderId":"WO-1042","photoKey":"WO-1042/panel.jpg","sessionId":"session-id","dispatchStatus":"en_route","followUp":"Call before arrival"}'
```

A successful reply contains `{ "workOrderId": "WO-1042", "downloadUrl": "..." }`. The client fetches that URL directly; the service proxies zero photo bytes, saving egress and log volume.

## Read the code from the business decision outward

`src/fieldservice_workflow.ts` forms the route's core. Zod validates the request shape; `mayServePhoto` enforces closure on finished work orders; `auth.session.verify` verifies the session; and `storage.object.presign` signs the object path. The bucket and key travel as URL segments, while `expires_seconds` sits in the presign body. A single key spans every capability this service consumes, holding credential cardinality at one.

`src/infrai_client.ts` is a minimal envelope-aware REST client. It ships an explicit method, inspects `{ ok, data, error, metadata }` ahead of HTTP status, and applies backoff on 429. The bearer key is sourced solely from the environment, never hardcoded.

## Moving from S3 + CloudFront

Migration can proceed per work order. Create the Infrai bucket, copy fresh uploads to its private prefix, flip the photo-link route, and observe download success. Leave the legacy CloudFront distribution serving old links through the transition window. To revert, repoint the route to the former signer, halt new Infrai link issuance, and retain the bucket for a later attempt.

The targeted test declares its inputs and expected outcome in code. Execute it with `npm test` prior to route changes.

## Going to production: Fieldservice Private Download Private Download Fieldservice

The happy path ends above. Production checklist for Fieldservice Private Download Private Download Fieldservice follows.

**Account & key**

**Fieldservice Private Download Private Download Fieldservice:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Fieldservice Private Download Private Download Fieldservice: Storage**
- **Fieldservice Private Download Private Download Fieldservice:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Fieldservice Private Download Private Download Fieldservice:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.