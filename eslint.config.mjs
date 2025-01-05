import elite from '@blake.regalia/eslint-config-elite';
import unused_imports from 'eslint-plugin-unused-imports';

export default [
	...elite,
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',

			parserOptions: {
				tsconfigRootDir: import.meta.dirname,
				project: 'tsconfig.json',
			},
		},
		plugins: {
			'unused-imports': unused_imports(),
		},
		rules: {
			'@typescript-eslint/no-unsafe-argument': 'off',
			'unused-imports/no-unused-imports': 'warn',
			'@typescript-eslint/naming-convention': 'off',
		},
	},
	{
		files: ['./*.ts'],
		languageOptions: {
			parserOptions: {
				project: 'tsconfig.vite.json',
			},
		},
	},
];
