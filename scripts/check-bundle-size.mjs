import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const CLIENT_DIR = resolve('.svelte-kit/output/client/_app');
const BUDGET_KB = Number(process.env.BUNDLE_BUDGET_KB || 100);
const BUDGET_BYTES = BUDGET_KB * 1024;

function findEntryFiles() {
	const results = [];
	const scan = (dir) => {
		for (const name of readdirSync(dir, { withFileTypes: true })) {
			const full = join(dir, name.name);
			if (name.isDirectory()) scan(full);
			else if (/^start\..*\.js$/.test(name.name)) results.push(full);
		}
	};
	try {
		scan(join(CLIENT_DIR, 'immutable'));
	} catch {
		console.error('Tidak menemukan output build di ' + CLIENT_DIR);
		console.error('Jalankan `npm run build` terlebih dahulu.');
		process.exit(2);
	}
	return results;
}

function staticImports(file) {
	const source = readFileSync(file, 'utf8');
	const deps = new Set();
	const re = /\bimport\s*"([^"]+)"|\bfrom\s*"([^"]+)"/g;
	let match;
	while ((match = re.exec(source)) !== null) {
		const spec = match[1] || match[2];
		if (spec && (spec.startsWith('./') || spec.startsWith('../'))) {
			deps.add(resolve(dirname(file), spec));
		}
	}
	return [...deps];
}

const firstLoadFiles = new Set();
const queue = findEntryFiles();
while (queue.length > 0) {
	const file = queue.pop();
	if (!file.endsWith('.js') || firstLoadFiles.has(file)) continue;
	firstLoadFiles.add(file);
	queue.push(...staticImports(file));
}

let totalGzip = 0;
const rows = [];
for (const file of firstLoadFiles) {
	const gz = gzipSync(readFileSync(file)).length;
	totalGzip += gz;
	rows.push([file.replace(CLIENT_DIR + '/', ''), gz]);
}
rows.sort((a, b) => b[1] - a[1]);

console.log('First-load JS chunks (static import graph dari entry):');
for (const [name, gz] of rows) {
	console.log('  ' + String((gz / 1024).toFixed(1)).padStart(8) + ' KB  ' + name);
}
console.log(
	'TOTAL first-load JS (gzip): ' +
		(totalGzip / 1024).toFixed(1) +
		' KB — budget ' +
		BUDGET_KB +
		' KB'
);

let cssTotal = 0;
try {
	for (const name of readdirSync(join(CLIENT_DIR, 'immutable', 'assets'))) {
		if (name.endsWith('.css')) cssTotal += gzipSync(readFileSync(join(CLIENT_DIR, 'immutable', 'assets', name))).length;
	}
} catch {}
if (cssTotal > 0) {
	console.log('(info) Total CSS (gzip): ' + (cssTotal / 1024).toFixed(1) + ' KB');
}

if (totalGzip > BUDGET_BYTES) {
	console.error('GAGAL: first-load JS melebihi budget ' + BUDGET_KB + ' KB.');
	process.exit(1);
}
console.log('OK: dalam budget.');
