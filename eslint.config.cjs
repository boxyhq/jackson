const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const i18Next = require("eslint-plugin-i18next");
const globals = require("globals");
const tsParser = require("@typescript-eslint/parser");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = [{
    ignores: [
        ".next",
        "**/node_modules",
        "**/dist",
        "npm/dist",
        "npm/migration",
        "internal-ui/dist",
        "eslint.config.cjs"
    ],
}, ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "next/core-web-vitals",
    "plugin:i18next/recommended",
), {
    plugins: {
        "@typescript-eslint": typescriptEslint,
        i18next: i18Next,
    },

    languageOptions: {
        globals: {
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: 13,
        sourceType: "module",
    },
}, {
    files: ["**/*.ts", "**/*.tsx"],

    rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "import/no-anonymous-default-export": "off",
        "@typescript-eslint/no-require-imports": "off",
    },
}, {
    files: ["**/*.js"],

    rules: {
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/no-require-imports": "off",
    },
}, {
    files: ["sdk/**/*"],

    rules: {
        "@next/next/no-img-element": "off",
    },
}];