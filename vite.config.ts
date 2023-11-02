import {defineConfig} from 'vite';

export default defineConfig(({mode:si_mode}) => ({
	build: {
		sourcemap: true,
		minify: false,
		emptyOutDir: true,
	},
}));
