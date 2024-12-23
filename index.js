import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { argv, exit } from 'node:process';
import pkg from './package.json' with { type: 'json' };

const isBump = argv[2] === '--bump';

if (isBump) {
	execSync('git checkout main');
	execSync('git fetch origin');
	execSync('git reset --hard origin/main');
}

const response = await fetch('https://unpkg.com/pm2/types/index.d.ts');

if (!response.ok || !response.redirected) {
	console.error('Failed to fetch package');
	exit(1);
}

const version = response.url.replace('https://unpkg.com/pm2@', '').split('/')[0];

if(version === pkg.version) {
	console.error('Already up to date');
	exit(1);
}

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

if (isBump) {
	execSync('git add .');
	execSync(`pnpm version ${version} --force`, { stdio: 'inherit' });
}
