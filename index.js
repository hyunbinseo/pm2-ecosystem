import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const bump = process.env.npm_lifecycle_event === 'bump';

if (bump) {
	execSync('git checkout main');
	execSync('git fetch origin');
	execSync('git reset --hard origin/main');
}

execSync(`pnpm add pm2@latest`, { stdio: 'inherit' });

const regex = /export interface StartOptions {.+?}(?=\n)/s;
const matches = readFileSync('node_modules/pm2/types/index.d.ts', 'utf8').match(regex);
const { version } = JSON.parse(readFileSync('node_modules/pm2/package.json', 'utf8'));

if (!matches) throw new Error('StartOptions not found.');

writeFileSync(
	'src/index.ts',
	`// pm2@${version}\n
${matches[0]}\n
export const defineApp = (options: StartOptions) => options;\n`
);

if (bump) {
	execSync('git add .');
	execSync(`pnpm version ${version} --force`, { stdio: 'inherit' });
	execSync('git push');
	execSync('git push --tags');
}
