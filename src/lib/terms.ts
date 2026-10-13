// Terminer skrivs 'VT26' (jan–jun) och 'HT26' (jul–dec)

export function termFor(isoDate: string): string {
	const [year, month] = isoDate.split('-').map(Number);
	return `${month <= 6 ? 'VT' : 'HT'}${String(year % 100).padStart(2, '0')}`;
}

function shift(term: string, steps: number): string {
	// Räkna i halvår: VT = 0, HT = 1. Modulo 200 så att tvåsiffriga år går runt (HT99 → VT00).
	const index = (((Number(term.slice(2)) * 2 + (term.startsWith('HT') ? 1 : 0) + steps) % 200) + 200) % 200;
	return `${index % 2 === 0 ? 'VT' : 'HT'}${String(Math.floor(index / 2)).padStart(2, '0')}`;
}

/** Terminerna man kan skapa kurser för: förra, nuvarande och nästa. */
export function termOptions(today: string): string[] {
	const current = termFor(today);
	return [shift(current, -1), current, shift(current, 1)];
}

/** SQL-uttryck som sorterar terminer kronologiskt, t.ex. 'HT25' före 'VT26'. */
export function termOrderSql(column = 'term'): string {
	return `substr(${column}, 3) || CASE substr(${column}, 1, 2) WHEN 'HT' THEN '2' ELSE '1' END`;
}
