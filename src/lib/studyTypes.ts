/** Lagrade värden och visningsnamn. Värdena måste matcha `colors` i public/graph_logic.js. */
export const STUDY_TYPES = {
	Selfstudies: 'Self studies',
	Lecture: 'Lecture',
	Lesson: 'Lesson',
	Homework: 'Homework',
	Labs: 'Labs',
	Project: 'Project',
	TentaP: 'Exam prep',
	Other: 'Other',
} as const;

export type StudyType = keyof typeof STUDY_TYPES;

export function isStudyType(value: string): value is StudyType {
	return Object.hasOwn(STUDY_TYPES, value);
}

export function studyTypeLabel(value: string): string {
	return isStudyType(value) ? STUDY_TYPES[value] : value;
}
