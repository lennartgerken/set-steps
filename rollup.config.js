import typescript from '@rollup/plugin-typescript'

export default [
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/esm/index.js',
            format: 'es'
        },
        external: ['@playwright/test', 'url'],
        plugins: [
            typescript({
                compilerOptions: {
                    declaration: true,
                    declarationDir: 'dist/esm'
                }
            })
        ]
    },
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/cjs/index.cjs',
            format: 'cjs'
        },
        external: ['@playwright/test', 'url'],
        plugins: [typescript()]
    }
]
