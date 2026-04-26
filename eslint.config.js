import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      
      // --- FIXES FOR YOUR CURRENT ERRORS ---
      
      // 1. Allows the use of 'any' so your build doesn't crash
      "@typescript-eslint/no-explicit-any": "off", 
      
      // 2. Suppresses warnings about empty interfaces (common in shadcn UI)
      "@typescript-eslint/no-empty-object-type": "off",
      
      // 3. Allows 'require' (needed for your tailwind.config.ts)
      "@typescript-eslint/no-require-imports": "off",

      // Already off in your code
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);