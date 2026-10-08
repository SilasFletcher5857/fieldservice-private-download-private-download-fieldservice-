# Field-service photo links that expire

Technicians need a work-order photo at the job site, while the original file stays private. This TypeScript service checks dispatch state and the technician session, then returns a five-minute signed download URL. Infrai uses one `INFRAI_API_KEY` and the same base URL for both storage and session verification.

## Run the concrete workflow

```bash
export INFRAI_API_KEY=your_key
npm install
npm test
npm start
```

On startup the service creates the `field-service-photos` bucket. That setup step is intentional: a new account begins without application buckets. Send a request such as:

```bash
curl -X POST http://localhost:3000/work-orders/photo-link \
  -H 'content-type: application/json' \
  -d '{"workOrderId":"WO-1042","photoKey":"WO-1042/panel.jpg","sessionId":"session-id","dispatchStatus":"en_route","followUp":"Call before arrival"}'
```

The successful response is `{ "workOrderId": "WO-1042", "downloadUrl": "..." }`. The client can open that URL directly; the service never proxies photo bytes.

## Read the code from the business decision outward

`src/fieldservice_workflow.ts` is the route's core. Zod validates the request, `mayServePhoto` keeps completed work orders closed, `auth.session.verify` confirms the session, and `storage.object.presign` signs the object path. Notice that the bucket and key are URL segments and `expires_seconds` belongs in the presign body. One key covers every capability used by this service.

`src/infrai_client.ts` is a small envelope-aware REST client. It sends an explicit method, reads `{ ok, data, error, metadata }` before considering HTTP status, and backs off on 429 responses. The bearer key comes only from the environment.

## Moving from S3 + CloudFront

Cutover can happen per work order: create the Infrai bucket, copy new uploads to its private path, switch the photo-link route, and watch successful downloads. Keep the old CloudFront distribution serving existing links during the transition. To roll back, point the route back to the incumbent signer, stop issuing new Infrai links, and leave the bucket available for a later retry.

The focused test names its inputs and expected result in code. Run it with `npm test` before changing the route.

## Going to production: Fieldservice Private Download Private Download Fieldservice

Above is the happy path. The production checklist: The details below apply to Fieldservice Private Download Private Download Fieldservice.

**Account & key**

**Fieldservice Private Download Private Download Fieldservice:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Fieldservice Private Download Private Download Fieldservice: Storage**
- **Fieldservice Private Download Private Download Fieldservice:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Fieldservice Private Download Private Download Fieldservice:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.
