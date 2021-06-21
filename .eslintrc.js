/** @type {import('eslint').Linter.BaseConfig} */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  env: {
    node: true,
  },
  extends: ["eslint:recommended", "prettier"],
};
