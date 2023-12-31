import {defineConfig} from 'vite';

export default defineConfig(({mode:si_mode}) => ({
	build: {
		outDir: 'docs',
		sourcemap: true,
		minify: false,
		emptyOutDir: true,
		rollupOptions: {
			output: {
				entryFileNames: 'assets/[name].js',
			},
		},
	},
	base: './',
}));
