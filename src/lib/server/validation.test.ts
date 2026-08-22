import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { sanitizeEmail, sanitizeText, validateJson } from './validation.js';

const schema = z.object({ message: z.string().min(1).max(10) });

describe('sanitizeText', () => {
	it('menghapus tag HTML', () => {
		expect(sanitizeText('<script>alert(1)</script>Halo')).toBe('alert(1)Halo');
	});

	it('menghapus karakter kontrol tapi menyisakan whitespace biasa', () => {
		const nul = String.fromCharCode(0);
		const bel = String.fromCharCode(7);
		const tab = String.fromCharCode(9);
		expect(sanitizeText(`a${nul}b${bel}c${tab}d`)).toBe('abc' + tab + 'd');
	});

	it('trim dan memotong ke maxLength', () => {
		expect(sanitizeText('  abcdefghij  ', 4)).toBe('abcd');
	});
});

describe('sanitizeEmail', () => {
	it('lowercase, trim, dan menghapus whitespace dalam', () => {
		expect(sanitizeEmail('  U ser@ Example.COM ')).toBe('user@example.com');
	});
});

describe('validateJson', () => {
	const requestDengan = (body: string): Request =>
		new Request('http://localhost/api/uji', { method: 'POST', body });

	const tangkap = async (p: Promise<unknown>): Promise<unknown> => {
		try {
			await p;
			return null;
		} catch (e) {
			return e;
		}
	};

	it('mengembalikan data valid yang sudah di-parse', async () => {
		const data = await validateJson(requestDengan(JSON.stringify({ message: 'hai' })), schema);
		expect(data).toEqual({ message: 'hai' });
	});

	it('melempar Response 400 untuk payload tidak sesuai skema', async () => {
		const err = (await tangkap(
			validateJson(requestDengan(JSON.stringify({ message: '' })), schema)
		)) as Response | null;
		expect(err).toBeInstanceOf(Response);
		expect(err?.status).toBe(400);
	});

	it('melempar Response 400 untuk body bukan JSON', async () => {
		const err = (await tangkap(
			validateJson(requestDengan('bukan json'), schema)
		)) as Response | null;
		expect(err).toBeInstanceOf(Response);
		expect(err?.status).toBe(400);
	});
});
