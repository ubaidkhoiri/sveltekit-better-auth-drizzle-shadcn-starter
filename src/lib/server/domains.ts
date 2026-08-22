export function domainAllowed(email: string, domains: string[]): boolean {
	if (domains.length === 0) return false;
	const domain = email.split('@')[1]?.toLowerCase() ?? '';
	return domains.includes(domain);
}

export function normalizeDomain(input: string): string[] {
	return input
		.split(',')
		.map((d) => d.trim().toLowerCase().replace(/^@/, ''))
		.filter((d) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(d));
}
