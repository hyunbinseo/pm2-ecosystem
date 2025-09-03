import { writeFileSync } from 'node:fs';
import { simpleGit } from 'simple-git';
import pkg from './package.json' with { type: 'json' };

const git = simpleGit();

await git.checkout('main');
await git.fetch('origin');

const status = await git.status();
if (!status.isClean()) throw new Error();

const localCommit = await git.revparse(['HEAD']);
const remoteCommit = await git.revparse(['origin/main']);
if (localCommit !== remoteCommit) throw new Error();

let response = await fetch('https://unpkg.com/pm2/types/index.d.ts');
if (!response.redirected || !response.url) throw new Error();

const version = response.url.match(/(?<=^https:\/\/unpkg\.com\/pm2@)[\d\.]+/)?.[0];
if (!version || version === pkg.version) throw new Error();

response = await fetch(response.url);
if (!response.ok || response.redirected) throw new Error();

const regex = /export interface StartOptions {.+?}(?=\n)/s;
const type = (await response.text()).match(regex)?.at(0);

if (!version || !type) throw new Error();

writeFileSync(
	'src/index.ts',
	`// pm2@${version}` +
		'\n\n' +
		type +
		'\n\n' +
		'export const defineApp = (options: StartOptions) => options;' +
		'\n',
);

pkg.version = version;
writeFileSync('package.json', JSON.stringify(pkg, null, '\t') + '\n');

// NOTE New version is unknown until runtime.
// Static lifecycle script(s) cannot be used.

await git.add('.');
await git.commit(version);
await git.addTag(`v${version}`);
await git.push('origin', 'main');
await git.pushTags('origin');

const github = pkg.repository.url.replace(/^git\+|\.git$/g, '');

console.table({
	'New Tag': `${github}/releases/tag/v${pkg.version}`,
	'Create Release': `${github}/releases/new?tag=v${pkg.version}`,
});
