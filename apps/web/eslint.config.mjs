import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const nextPlugin = require('eslint-config-next');

// Filter out React Compiler plugin from Next.js config
const filteredNextConfig = nextPlugin.map((config) => {
  if (config.plugins && 'react-compiler' in config.plugins) {
    const { 'react-compiler': _, ...rest } = config.plugins;
    return { ...config, plugins: rest };
  }
  if (config.rules && Object.keys(config.rules).some(key => key.startsWith('react-compiler/'))) {
    const filteredRules = Object.fromEntries(
      Object.entries(config.rules).filter(([key]) => !key.startsWith('react-compiler/'))
    );
    return { ...config, rules: filteredRules };
  }
  return config;
});

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      '*.config.js',
      '*.config.ts',
      'public/**',
    ],
  },
  ...filteredNextConfig,
  {
    rules: {
      // Relax overly strict Next.js rules
      '@next/next/no-html-link-for-pages': 'warn',
      '@next/next/no-img-element': 'warn',
      'react/no-unescaped-entities': 'warn',
      'import/no-anonymous-default-export': 'off',
      // Allow React hooks dependency warnings (can be noisy)
      'react-hooks/exhaustive-deps': 'warn',
      // Allow setState in effects for initialization patterns (SSR hydration, async fetching)
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];

export default eslintConfig;
