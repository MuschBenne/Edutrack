/** Betygsskalor, betygen i stigande ordning. Nycklarna måste matcha CHECK i migrations/0003_final_grades.sql. */
export const GRADING_SCALES = {
	UG: { label: 'U / G', grades: ['U', 'G'] },
	UGVG: { label: 'U / G / VG', grades: ['U', 'G', 'VG'] },
	U345: { label: 'U / 3 / 4 / 5', grades: ['U', '3', '4', '5'] },
	AF: { label: 'A–F (ECTS)', grades: ['F', 'Fx', 'E', 'D', 'C', 'B', 'A'] },
} as const;

export type GradingScale = keyof typeof GRADING_SCALES;

export function isGradingScale(value: string): value is GradingScale {
	return Object.hasOwn(GRADING_SCALES, value);
}

export function isGradeOnScale(scale: GradingScale, grade: string): boolean {
	return (GRADING_SCALES[scale].grades as readonly string[]).includes(grade);
}

export function gradingScaleLabel(scale: string): string {
	return isGradingScale(scale) ? GRADING_SCALES[scale].label : scale;
}
