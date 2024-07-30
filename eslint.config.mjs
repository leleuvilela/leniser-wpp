import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

export default [
    {
        files: ['**/*.ts'],
        rules: {
            semi: ['error', 'always'],
            'max-len': ['error', { code: 90, ignoreUrls: true }],
            indent: 'error',
        },
    },
    {
        ignores: ['dist/', '**/*.js'],
    },
    { languageOptions: { globals: globals.browser } },
    pluginJs.configs.recommended,
    ...tseslint.configs.strict,
    ...tseslint.configs.stylistic,
    eslintPluginPrettier,
];
