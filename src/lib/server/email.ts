import { dev } from '$app/environment';

type EmailPayload = { to: string; subject: string; text: string };

export async function sendEmail({ to, subject, text }: EmailPayload): Promise<void> {
	if (dev) {
		console.log('---------- EMAIL (stub dev) ----------');
		console.log(`Kepada : ${to}`);
		console.log(`Subjek : ${subject}`);
		console.log(text);
		console.log('--------------------------------------');
		return;
	}

	console.warn(
		`[email] sendEmail belum dikonfigurasi untuk produksi. Email "${subject}" ke ${to} TIDAK terkirim. Ganti implementasi di src/lib/server/email.ts dengan provider sungguhan (mis. Resend/SMTP).`
	);
}
