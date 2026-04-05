import typescript from '@rollup/plugin-typescript'
import { dts } from 'rollup-plugin-dts'

const external = ['@playwright/test', 'url']

export default [
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/index.js',
            format: 'es'
        },
        external,
        plugins: [
            typescript({
                tsconfig: 'tsconfig.lib.json',
                compilerOptions: {
                    declaration: true,
                    declarationDir: 'dist/types'
                }
            })
        ]
    },
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/index.cjs',
            format: 'cjs'
        },
        external,
        plugins: [typescript({ tsconfig: 'tsconfig.lib.json' })]
    },
    {
        input: 'dist/types/index.d.ts',
        output: [{ file: 'dist/index.d.ts', format: 'es' }],
        external,
        plugins: [dts({ tsconfig: 'tsconfig.lib.json' })]
    }
]
