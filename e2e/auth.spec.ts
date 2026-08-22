import { expect, test } from '@playwright/test';

const email = `e2e-${Date.now()}@example.com`;
const password = 'password123';

test('daftar → dashboard → keluar → masuk kembali', async ({ page }) => {
	await page.goto('/auth/sign-up');
	await page.getByLabel('Nama').fill('Tester E2E');
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password').fill(password);
	await page.getByRole('button', { name: /daftar/i }).click();

	await expect(page).toHaveURL(/\/dashboard/);
	await expect(page.getByText(email)).toBeVisible();

	await page.getByRole('button', { name: /keluar/i }).click();
	await expect(page).not.toHaveURL(/\/dashboard/);

	await page.goto('/auth/sign-in');
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password').fill(password);
	await page.getByRole('button', { name: /^masuk$/i }).click();
	await expect(page).toHaveURL(/\/dashboard/);
});

test('forgot-password menampilkan pesan generik', async ({ page }) => {
	await page.goto('/auth/forgot-password');
	await page.getByLabel('Email').fill(`tidak-ada-${Date.now()}@example.com`);
	await page.getByRole('button', { name: /kirim tautan/i }).click();
	await expect(page.getByText(/tautan reset telah dikirim/i)).toBeVisible();
});
