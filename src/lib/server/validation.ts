import { json } from '@sveltejs/kit';
import type { ZodType } from 'zod';

function stripControlChars(value: string): string {
	let result = '';
	for (const ch of value) {
		const code = ch.codePointAt(0) ?? 0;
		const isAllowedWhitespace = code === 9 || code === 10 || code === 13;
		if (isAllowedWhitespace || (code >= 32 && code !== 127)) {
			result += ch;
		}
	}
	return result;
}

export function sanitizeText(value: string, maxLength = 255): string {
	return stripControlChars(value)
		.replace(/<[^>]*>/g, '')
		.trim()
		.slice(0, maxLength);
}

export function sanitizeEmail(value: string): string {
	return value.trim().toLowerCase().replace(/\s+/g, '');
}

export async function validateJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw json({ error: 'Body harus JSON valid' }, { status: 400 });
	}

	const parsed = schema.safeParse(body);
	if (!parsed.success) {
		const issues = parsed.error.issues.map((issue) => ({
			path: issue.path.join('.'),
			message: issue.message
		}));
		throw json({ error: 'Validasi gagal', issues }, { status: 400 });
	}

	return parsed.data;
}
