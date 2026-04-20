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
      "obsidianmd/ui/sentence-case": "warn"
    },
  },
];
