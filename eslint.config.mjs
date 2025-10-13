import eslint from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    globalIgnores(['dist']),
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unsafe-declaration-merging': 'off',
            '@typescript-eslint/no-empty-object-type': [
                'error',
                { allowInterfaces: 'always' }
            ],
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_'
                }
            ]
        }
    }
)
