import { defineConfig } from 'eslint/config';
import { builtinRules } from 'eslint/use-at-your-own-risk';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import jest from 'eslint-plugin-jest';
import prettier from 'eslint-config-prettier/flat';

// ESLint's own recommended rules (the same set @eslint/js exports as `recommended`)
const eslintRecommended = Object.fromEntries(
	[...builtinRules].filter(([, rule]) => rule.meta?.docs?.recommended).map(([name]) => [name, 'error']),
);

export default defineConfig([
	{
		ignores: ['**/*.{js,mjs}', '*', '!src/**', '!types/**'],
	},
	{
		files: ['src/**/*.{ts,mts}', 'types/**/*.{ts,mts}'],
		languageOptions: {
			parser: tsParser,
			ecmaVersion: 2020,
			sourceType: 'module',
			parserOptions: {
				project: 'tsconfig.json',
			},
		},
		rules: eslintRecommended,
	},
	// typescript-eslint's recommended set (also turns off core rules TypeScript already covers, like no-undef)
	...typescriptEslint.configs['flat/recommended'],
	jest.configs['flat/recommended'],
	prettier,
	{
		files: ['src/**/*.{ts,mts}', 'types/**/*.{ts,mts}'],
		rules: {
			'@typescript-eslint/ban-ts-comment': 'off',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			quotes: ['error', 'single', { avoidEscape: true }],
		},
	},
]);
