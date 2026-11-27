/**
 * The admin support dashboard is built against fictional workspace fixtures — core-api exposes
 * no per-workspace support, activity or audit endpoint for operators yet (only
 * `GET /v1/operator/session`, listing the operator's own active grants). It therefore lives
 * behind a development-only preview, gated the same way `apps/merchant-web/lib/preview/guard.ts`
 * gates its own: `next dev` plus an explicit opt-in. Nothing here bypasses operator
 * authentication — this still runs inside the authenticated admin app — and no real merchant data
 * is read or shown.
 */
export function isAdminPreviewEnabled(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.KRINLY_ADMIN_PREVIEW === '1';
}
