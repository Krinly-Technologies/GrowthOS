/**
 * The design lab renders only under `next dev` with an explicit opt-in (`KRINLY_DESIGN_LAB=1` in
 * `apps/design-lab/.env.local`). It holds fictional sample data and no API clients or auth, so
 * there is nothing real to protect; the gate exists so the prototype can never be mistaken for,
 * or shipped as, product.
 */
export function isLabEnabled(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.KRINLY_DESIGN_LAB === '1';
}
