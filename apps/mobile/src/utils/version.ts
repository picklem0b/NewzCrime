/**
 * Version comparison for the update check.
 *
 * Only the numeric parts are compared, so `0.2.0` is newer than `0.1.9` and a
 * suffix such as `-beta` is ignored rather than treated as a number.
 */

export function compareVersions(left: string, right: string): number {
  const toParts = (value: string): number[] =>
    value
      .split('-')[0]
      ?.split('.')
      .map((part) => Number.parseInt(part, 10))
      .map((part) => (Number.isFinite(part) ? part : 0)) ?? [];

  const leftParts = toParts(left);
  const rightParts = toParts(right);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;
    if (leftPart !== rightPart) return leftPart - rightPart;
  }

  return 0;
}
