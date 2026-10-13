import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import * as courses from '../../db/courses';
import * as enrollments from '../../db/enrollments';
import * as universities from '../../db/universities';
import * as users from '../../db/users';
import { readForm } from '../../lib/form';
import { isGradingScale } from '../../lib/grades';
import { parseId } from '../../lib/ids';

/** Alla formulär på /admin. Middleware släpper bara igenom admins hit; kontrollen upprepas om en route skulle ändras. */
export const POST: APIRoute = async ({ locals, request, redirect }) => {
	if (!locals.user?.isAdmin) return new Response('Access denied, admins only!', { status: 403 });
	const form = await readForm(request);
	if (!form) return new Response('Expected a form', { status: 400 });
	const courseId = parseId(form.get('courseId'));
	const userId = parseId(form.get('userId'));
	const name = String(form.get('name') ?? '').trim().replace(/\s+/g, ' ');
	const validName = name.length >= 3 && name.length <= 100;

	// Bara relativa adresser inom /admin, så att formuläret inte kan skicka vidare till en annan sajt
	const backValue = String(form.get('back') ?? '');
	const back = /^\/admin(\?university=\d+)?$/.test(backValue) ? backValue : '/admin';
	const done = (msg: string) => redirect(`${back}${back.includes('?') ? '&' : '?'}msg=${msg}`, 303);

	switch (form.get('action')) {
		case 'renameCourse':
			if (!validName) return done('invalid-name');
			return done(courseId && (await courses.rename(env.DB, courseId, name)) ? 'course-renamed' : 'not-found');
		case 'setGradingScale': {
			const scale = String(form.get('gradingScale') ?? '');
			if (!isGradingScale(scale)) return done('invalid-scale');
			return done(courseId && (await courses.setGradingScale(env.DB, courseId, scale)) ? 'scale-changed' : 'not-found');
		}
		case 'deleteCourse':
			return done(courseId && (await courses.remove(env.DB, courseId)) ? 'course-deleted' : 'not-found');
		case 'removeStudent':
			return done(userId && courseId && (await enrollments.unenroll(env.DB, userId, courseId)) ? 'student-removed' : 'not-found');
		case 'deleteUser':
			if (userId === locals.user.id) return done('not-self');
			return done(userId && (await users.remove(env.DB, userId)) ? 'user-deleted' : 'not-found');
		case 'addUniversity':
			if (!validName) return done('invalid-name');
			return done((await universities.create(env.DB, name)) ? 'university-added' : 'university-exists');
		default:
			return new Response('Unknown action', { status: 400 });
	}
};
