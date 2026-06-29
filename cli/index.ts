import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { simpleGit } from 'simple-git';
import { check, object, parse, pipe, string } from 'valibot';
import pkg from '../package.json' with { type: 'json' };
import { root } from './utilities.ts';

const git = simpleGit();

await git.checkout('main');
await git.fetch('origin');

const status = await git.status();
if (!status.isClean()) throw new Error('Working tree is not clean');
if (status.ahead || status.behind) throw new Error('Mismatch with origin/main');

const metaRes = await fetch('https://registry.npmjs.org/pm2/latest');
if (!metaRes.ok) throw new Error(`HTTP ${metaRes.status} - ${metaRes.url}`);

const npm = parse(
	pipe(
		object({ version: string() }),
		check((meta) => meta.version !== pkg.version, 'No update available'),
	),
	await metaRes.json(),
);

const typeRes = await fetch(`https://unpkg.com/pm2@${npm.version}/types/index.d.ts`).then((res) =>
	res.ok
		? res
		: fetch(`https://raw.githubusercontent.com/Unitech/pm2/v${npm.version}/types/index.d.ts`),
);

if (!typeRes.ok) throw new Error(`HTTP ${typeRes.status} - ${typeRes.url}`);

const startOptions = (await typeRes.text())
	.match(/export interface StartOptions {.+?}(?=\n)/s)
	?.at(0);

if (!startOptions) throw new Error('Content not found');

writeFileSync(
	resolve(root, './src/index.ts'),
	`// pm2@${npm.version}` +
		'\n\n' +
		startOptions +
		'\n\n' +
		'export const defineApp = (options: StartOptions) => options;' +
		'\n',
);

pkg.version = npm.version;
writeFileSync('package.json', JSON.stringify(pkg, null, '\t') + '\n');

// NOTE `pnpm version` command requires version to be predefined

await git.add('.');
await git.commit(npm.version);
await git.addTag(`v${npm.version}`);
await git.push('origin', 'main');
await git.pushTags('origin');

const github = pkg.repository.url.replace(/^git\+|\.git$/g, '');

console.table({
	'New Tag': `${github}/releases/tag/v${pkg.version}`,
	'Create Release': `${github}/releases/new?tag=v${pkg.version}`,
});
