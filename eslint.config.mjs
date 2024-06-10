import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


export default [
  {
    files: ["**/*.js", "**/*.ts"],
    languageOptions: {
      sourceType: "commonjs"
    },
  },
  {
    languageOptions: { globals: globals.browser }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-var-requires": "off",
      "no-undef": "off"
    }
  },
  {
    ignores: ["**/archive/**", "**/dist/*"],
  },
];