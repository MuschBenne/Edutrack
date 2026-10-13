// Datum hanteras som 'YYYY-MM-DD'-strängar, samma format som kolumnen studied_on

/** Dagens datum i svensk tid. Workers kör i UTC, så utan tidszon blir det fel dag mellan 00 och 02. */
export function todayIso(now = new Date()): string {
	// sv-SE formaterar som 'YYYY-MM-DD'
	return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm' }).format(now);
}

export function addDays(isoDate: string, days: number): string {
	const [y, m, d] = isoDate.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
	return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000);
}

/** 'Today', 'Yesterday', '3 days ago' eller '–'. */
export function relativeDay(isoDate: string | null, today: string): string {
	if (!isoDate) return '–';
	const days = daysBetween(isoDate, today);
	if (days <= 0) return 'Today';
	if (days === 1) return 'Yesterday';
	return `${days} days ago`;
}

/** 95 → '1 h 35 min'. */
export function formatMinutes(minutes: number): string {
	return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
}
