import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettierPlugin from "eslint-plugin-prettier";

export default [
    {
        ignores: ["build/**", "node_modules/**"],
        linterOptions: {
            reportUnusedDisableDirectives: "error"
        }
    },
    {
        files: ["**/*.ts"],
        languageOptions: {
            parserOptions: {
                project: "./tsconfig.json"
            }
        }
    },
    js.configs.recommended,
    ...tsPlugin.configs["flat/recommended"],
    ...tsPlugin.configs["flat/recommended-type-checked"],
    {
        files: ["**/*.ts"],
        plugins: {
            prettier: prettierPlugin
        },
        rules: {
            "@typescript-eslint/consistent-type-imports": "error",
            "@typescript-eslint/explicit-function-return-type": "error",
            "@typescript-eslint/no-base-to-string": "off",
            "@typescript-eslint/no-deprecated": "warn",
            "@typescript-eslint/no-empty-object-type": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unnecessary-condition": "error",
            "@typescript-eslint/no-unsafe-argument": "error",
            "@typescript-eslint/no-unsafe-assignment": "error",
            "@typescript-eslint/no-unsafe-call": "error",
            "@typescript-eslint/no-unsafe-member-access": "error",
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrors: "none" }],
            "@typescript-eslint/require-await": "error",
            "@typescript-eslint/restrict-plus-operands": "error",
            "@typescript-eslint/restrict-template-expressions": "error",
            "no-case-declarations": "error",
            "no-loss-of-precision": "error",
            "no-mixed-spaces-and-tabs": "error",
            "prettier/prettier": "error"
        }
    }
];
