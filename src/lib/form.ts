/** Formulärdata från en POST, eller null om body inte är ett formulär (request.formData() kastar då). */
export async function readForm(request: Request): Promise<FormData | null> {
	try {
		return await request.formData();
	} catch {
		return null;
	}
}
