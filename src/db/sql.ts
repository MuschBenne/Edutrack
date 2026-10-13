/** 'id, name' + 'c' → 'c.id, c.name', för kolumnlistor i JOIN-frågor. */
export function qualify(columns: string, alias: string): string {
	return columns
		.split(', ')
		.map((c) => `${alias}.${c}`)
		.join(', ');
}
