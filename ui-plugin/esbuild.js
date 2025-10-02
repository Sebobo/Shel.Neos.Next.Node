const esbuild = require('esbuild');
const extensibilityMap = require('@neos-project/neos-ui-extensibility/extensibilityMap.json');
const isWatch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const options = {
    alias: extensibilityMap, bundle: true, entryPoints: { Plugin: 'src/index.js' }, loader: {
        '.js': 'tsx'
    },
    logLevel: 'info',
    minify: !isWatch,
    outdir: '../Resources/Public/Assets',
    sourcemap: true,
    target: 'es2020'
};

if (isWatch) {
    esbuild.context(options).then((ctx) => ctx.watch());
} else {
    esbuild.build(options);
}
