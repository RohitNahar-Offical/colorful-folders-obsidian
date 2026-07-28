import tsparser from "@typescript-eslint/parser";
import obsidianmd from "eslint-plugin-obsidianmd";

export default [
  ...obsidianmd.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      "obsidianmd/no-sample-code": "error",
      "obsidianmd/prefer-active-doc": "warn",
      "obsidianmd/no-tfile-tfolder-cast": "error",
      "obsidianmd/ui/sentence-case": "warn",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
      "no-useless-escape": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "obsidianmd/rule-custom-message": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "obsidianmd/ui/sentence-case": "off",
      "@typescript-eslint/no-deprecated": "off",
      "obsidianmd/prefer-create-el": "off"
    },
  },
];
