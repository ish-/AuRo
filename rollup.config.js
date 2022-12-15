import path from 'path';

import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { chromeExtension, simpleReloader } from 'rollup-plugin-chrome-extension';
import copy from 'rollup-plugin-copy';

export default (args) => {
  const commonPlugins = [
    replace({
      preventAssignment: true,
      values: {
        '__log_namespace__': JSON.stringify('AuRo ::'),
        '__log_verbose__': !!args.configVerbose,
      }
    }),
    nodeResolve(),
  ];

  return [
    {
      input: './src/background/library.js',
      output: {
        file: 'dist/lib.js',
        format: 'umd',
        name: 'auro',
      },
      plugins: [
        ...commonPlugins,
      ],
    },
    {
      input: `./src/manifest.json`,
      output: {
        dir: 'dist',
        format: 'es',
        globals: [ 'chrome' ],
        // HACK: Bypass a bug in chromeExtension() with chunk generation on Windows.
        // https://github.com/crxjs/chrome-extension-tools/issues/111
        chunkFileNames: path.join('chunks', '[name]-[hash].js'),
      },
      treeshake: false,
      plugins: [
        chromeExtension(),
        simpleReloader(),
        ...commonPlugins,
        copy({
          targets: [
            { src: 'src/Icon128-white.png', dest: 'dist' }
          ]
        })
      ],
    }
  ];
};
