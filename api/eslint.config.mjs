import { defineConfig } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import jest from "eslint-plugin-jest";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig({
    ignores: [
        "**/*.{js,mjs}",
        "*",
        "!src/**",
        "!types/**",
    ],
    extends: compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:jest/recommended",
        "prettier",
    ),
    plugins: {
        "@typescript-eslint": typescriptEslint,
        jest,
    },
    languageOptions: {
        globals: {
            ...Object.fromEntries(Object.entries(globals.browser).map(([key]) => [key, "off"])),
            ...globals.node,
        },
        parser: tsParser,
        ecmaVersion: 2020,
        sourceType: "module",
        parserOptions: {
            project: "tsconfig.json",
        },
    },
    rules: {
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "off",
        quotes: ["error", "single", {
            avoidEscape: true,
        }],
    },
});