// Ritar graferna på kurssidan. Paketeras av Astro, så Chart.js serveras från vår egen domän.
import { ArcElement, BarController, BarElement, CategoryScale, Chart, DoughnutController, Legend, LinearScale, Tooltip } from 'chart.js';
import { type ChartSession, type TypeMinutes, minutesByType, minutesByWeek } from '../lib/chartData';
import { STUDY_TYPES, type StudyType } from '../lib/studyTypes';

Chart.register(ArcElement, BarController, BarElement, CategoryScale, DoughnutController, Legend, LinearScale, Tooltip);

// Samma palett som master.css
const COLORS: Record<StudyType, string> = {
	Lecture: '#152242',
	Selfstudies: '#B8953F',
	Lesson: '#5B7BB2',
	Homework: '#9AAFD3',
	Labs: '#2F6B48',
	Project: '#D9C08A',
	TentaP: '#6B7389',
	Other: '#C9C2B2',
};
const TYPES = Object.keys(STUDY_TYPES) as StudyType[];

Chart.defaults.font.family = "'IBM Plex Sans', system-ui, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#4A5672';
Chart.defaults.borderColor = '#EEEAE1';
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.plugins.legend.position = 'bottom';
Chart.defaults.plugins.legend.labels.boxWidth = 10;
Chart.defaults.plugins.legend.labels.boxHeight = 10;
Chart.defaults.plugins.tooltip.backgroundColor = '#152242';
Chart.defaults.plugins.tooltip.cornerRadius = 4;

function readSessions(id: string): ChartSession[] | null {
	const el = document.getElementById(id);
	return el?.textContent ? (JSON.parse(el.textContent) as ChartSession[]) : null;
}

function doughnut(canvasId: string, totals: TypeMinutes): void {
	const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
	if (!canvas) return;
	const types = TYPES.filter((t) => totals[t] > 0);
	new Chart(canvas, {
		type: 'doughnut',
		data: {
			labels: types.map((t) => STUDY_TYPES[t]),
			datasets: [
				{
					label: 'Minutes',
					data: types.map((t) => totals[t]),
					backgroundColor: types.map((t) => COLORS[t]),
					borderColor: '#FFFFFF',
					hoverOffset: 4,
				},
			],
		},
		options: { cutout: '60%', plugins: { legend: { position: window.innerWidth < 600 ? 'bottom' : 'right' } } },
	});
}

function weeklyBars(canvasId: string, sessions: ChartSession[]): void {
	const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
	if (!canvas) return;
	const weeks = minutesByWeek(sessions);
	// Året visas bara när veckorna spänner över flera år
	const manyYears = new Set(weeks.map((w) => w.year)).size > 1;
	const types = TYPES.filter((t) => weeks.some((w) => w.minutes[t] > 0));
	new Chart(canvas, {
		type: 'bar',
		data: {
			labels: weeks.map((w) => (manyYears ? `w${w.week} '${String(w.year).slice(-2)}` : `w${w.week}`)),
			datasets: types.map((t) => ({ label: STUDY_TYPES[t], data: weeks.map((w) => w.minutes[t]), backgroundColor: COLORS[t] })),
		},
		options: {
			responsive: true,
			scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true } },
		},
	});
}

const own = readSessions('course-sessions') ?? [];
weeklyBars('weeklyGraf', own);
doughnut('totalGraf', minutesByType(own));

const all = readSessions('all-course-sessions');
if (all) doughnut('allCourseGraf', minutesByType(all));
