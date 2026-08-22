import { describe, expect, it } from 'vitest';
import { domainAllowed, normalizeDomain } from './domains';

describe('normalizeDomain', () => {
	it('memisahkan koma, trim, lowercase, buang @', () => {
		expect(normalizeDomain('Perusahaan.com, @cabang.co.id ,  bad!')).toEqual([
			'perusahaan.com',
			'cabang.co.id'
		]);
	});

	it('hasil kosong untuk input kosong', () => {
		expect(normalizeDomain('')).toEqual([]);
	});
});

describe('domainAllowed', () => {
	it('true saat domain cocok', () => {
		expect(domainAllowed('budi@perusahaan.com', ['perusahaan.com'])).toBe(true);
	});

	it('false saat daftar kosong', () => {
		expect(domainAllowed('budi@perusahaan.com', [])).toBe(false);
	});

	it('false saat domain tidak cocok', () => {
		expect(domainAllowed('budi@gmail.com', ['perusahaan.com'])).toBe(false);
	});
});
