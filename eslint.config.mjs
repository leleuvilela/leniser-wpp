import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
    {
        files: ["**/*.ts"],
        ignores: ["dist/"],
        rules: {
            "semi": ["error", "always"],
            "max-len": ["error", { code: 80, ignoreUrls: true }],
        }
    },
    { languageOptions: { globals: globals.browser } },
    pluginJs.configs.recommended,
    ...tseslint.configs.strict,
    ...tseslint.configs.stylistic,
    eslintConfigPrettier
];
