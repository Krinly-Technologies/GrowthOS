/**
 * The Today and Acquisition screens are built against **provisional frontend models**, not an
 * approved API contract (core-api exposes no acquisition or revenue endpoints yet — see
 * `packages/contracts/openapi/core-api.json`). They therefore live behind a development-only
 * preview that renders only under `next dev` with an explicit opt-in
 * (`KRINLY_MERCHANT_PREVIEW=1` in `apps/merchant-web/.env.local`).
 *
 * The preview has no auth bypass and no access to a real workspace: it renders the same feature
 * components production will use, fed from typed fictional fixtures. Production workspace
 * navigation (`components/shell/nav-items.ts`) deliberately does not link to it, so no merchant
 * ever sees fictional financial records.
 */
export function isPreviewEnabled(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.KRINLY_MERCHANT_PREVIEW === '1';
}
