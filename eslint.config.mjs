import { defineConfig } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-plugin-prettier";
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

export default defineConfig([{
    files: ["**/**.ts"],

    extends: compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
    ),

    plugins: {
        "@typescript-eslint": typescriptEslint,
        prettier,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "commonjs",

        parserOptions: {
            project: "./tsconfig.json",
        },
    },

    rules: {
        "@typescript-eslint/explicit-function-return-type": "warn",
        "@typescript-eslint/restrict-template-expressions": "warn",
        "@typescript-eslint/restrict-plus-operands": "warn",
        "@typescript-eslint/no-unsafe-member-access": "warn",

        "@typescript-eslint/no-unused-vars": ["error", {
            argsIgnorePattern: "^_",
            caughtErrors: "none",
        }],

        "@typescript-eslint/no-unsafe-argument": "error",
        "@typescript-eslint/no-unsafe-call": "warn",
        "@typescript-eslint/no-unsafe-assignment": "warn",
        "@typescript-eslint/no-explicit-any": "warn",
        "no-loss-of-precision": "warn",
        "@typescript-eslint/no-unnecessary-condition": "warn",
        "@typescript-eslint/no-base-to-string": "off",
        "no-case-declarations": "error",
        "prettier/prettier": "error",
        "no-mixed-spaces-and-tabs": "error",
        "require-await": "off",
        "@typescript-eslint/require-await": "error",
    },
}]);