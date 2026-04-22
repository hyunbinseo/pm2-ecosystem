import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: 'src/index.ts',
	dts: true,
	format: ['cjs', 'esm'],
	platform: 'neutral',
	target: false,
	exports: true,
	publint: true,
	attw: true,
});
