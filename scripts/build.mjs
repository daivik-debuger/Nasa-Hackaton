import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for (const weight of [400,600,700]) {
  const file = `space-grotesk-latin-${weight}-normal.woff2`;
  await writeFile(`dist/${file}`, await readFile(`node_modules/@fontsource/space-grotesk/files/${file}`));
}
await build({entryPoints:['src/react/global-workspace.jsx'],outfile:'dist/global-app.js',bundle:true,minify:true,format:'esm',target:['es2022'],jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
const css=await readFile('src/react/field.css','utf8');
const result=await postcss([tailwind()]).process(css,{from:'src/react/field.css',to:'dist/global-app.css',map:false});
await writeFile('dist/global-app.css',result.css);
console.log('React and Tailwind production assets built.');
