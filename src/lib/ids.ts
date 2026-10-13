/** Positivt heltals-id från URL eller formulär, annars null. */
export function parseId(value: unknown): number | null {
	const n = Number(value);
	return Number.isSafeInteger(n) && n > 0 ? n : null;
}
