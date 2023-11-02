module.exports = {
	extends: '@blake.regalia/eslint-config-elite',
	parserOptions: {
		ecmaVersion: 2022,
		sourceType: 'module',
		tsconfigRootDir: __dirname,
		project: 'tsconfig.json',
	},
	plugins: ['unused-imports'],
	rules: {
		'@typescript-eslint/no-unsafe-argument': 'off',
		'unused-imports/no-unused-imports': 'warn',
		'@typescript-eslint/naming-convention': 'off',
	},
	overrides: [
		{
			files: ['./*.ts'],
			parserOptions: {
				project: 'tsconfig.vite.json',
			},
		},
	],
};
