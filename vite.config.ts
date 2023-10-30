// import nodeResolve from '@rollup/plugin-node-resolve';
import {defineConfig} from 'vite';

export default defineConfig(({mode:si_mode}) => ({
	plugins: [
		// nodeResolve(),
	],

	build: {
		sourcemap: true,
		minify: false,
		emptyOutDir: true,

		// rollupOptions: {
		// 	output: {
		// 		entryFileNames: '[name].js',
		// 		chunkFileNames: 'assets/[name].js',
		// 		assetFileNames: '[name].[ext]',
		// 	},
		// },
	},
}));
