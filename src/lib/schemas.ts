import { z } from 'zod';

export const signUpSchema = z.object({
	name: z.string().min(2, 'Nama minimal 2 karakter').max(64),
	email: z.email('Format email tidak valid').max(254),
	username: z
		.string()
		.regex(/^[a-zA-Z0-9_.]*$/, 'Username hanya boleh huruf, angka, titik, underscore')
		.max(30, 'Username maksimal 30 karakter')
		.optional()
		.or(z.literal('')),
	password: z.string().min(8, 'Password minimal 8 karakter').max(72)
});
export type SignUpSchema = typeof signUpSchema;

export const signInSchema = z.object({
	email: z.string().min(1, 'Email atau username wajib diisi').max(254),
	password: z.string().min(1, 'Password wajib diisi').max(72)
});
export type SignInSchema = typeof signInSchema;

export const exampleSchema = z.object({
	message: z.string().min(1, 'Message wajib diisi').max(500)
});
export type ExampleSchema = typeof exampleSchema;

export const forgotPasswordSchema = z.object({
	email: z.email('Format email tidak valid').max(254)
});
export type ForgotPasswordSchema = typeof forgotPasswordSchema;

export const resetPasswordSchema = z
	.object({
		token: z.string().min(1, 'Token reset tidak ditemukan'),
		password: z.string().min(8, 'Password minimal 8 karakter').max(72),
		confirmPassword: z.string().min(8, 'Konfirmasi password minimal 8 karakter').max(72)
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Password dan konfirmasi tidak sama',
		path: ['confirmPassword']
	});
export type ResetPasswordSchema = typeof resetPasswordSchema;
