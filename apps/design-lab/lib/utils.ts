/** Copy of `obj` without `keys` (used to clear optional fields immutably). */
export function omit<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
  const keep = Object.entries(obj).filter(([key]) => !keys.some((k) => k === key));
  return Object.fromEntries(keep) as Omit<T, K>;
}
