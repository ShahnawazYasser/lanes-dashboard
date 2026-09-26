/** Compares strings so embedded numbers sort numerically ("R2" before "R10"). */
export function naturalCompare(a: string, b: string): number {
  const re = /(\d+)|(\D+)/g;
  const ap = a.match(re) ?? [];
  const bp = b.match(re) ?? [];
  const len = Math.max(ap.length, bp.length);
  for (let i = 0; i < len; i++) {
    const av = ap[i] ?? "";
    const bv = bp[i] ?? "";
    if (av === bv) continue;
    const an = Number(av);
    const bn = Number(bv);
    if (!Number.isNaN(an) && !Number.isNaN(bn) && String(an) === av && String(bn) === bv) {
      return an - bn;
    }
    return av < bv ? -1 : 1;
  }
  return 0;
}

/** Distinct, non-empty space IDs across contracts and prospects, natural-sorted. */
export function knownSpaces(
  contracts: { space: string }[],
  prospects: { space: string }[] = [],
): string[] {
  const set = new Set<string>();
  for (const c of contracts) if (c.space) set.add(c.space);
  for (const p of prospects) if (p.space) set.add(p.space);
  return Array.from(set).sort(naturalCompare);
}
