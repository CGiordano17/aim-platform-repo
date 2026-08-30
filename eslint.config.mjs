import nextConfig from "eslint-config-next";

const eslintConfig = [...nextConfig, { ignores: ["prototype/**", ".next/**", "node_modules/**"] }];

export default eslintConfig;
