// node tools/shotm.mjs <rootDir> <page> <out.png> [W] [H] [DPR]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'http'; import fs from 'fs'; import path from 'path';
const [, , rootArg, page, out, W = '1600', H = '900', DPR = '1'] = process.argv;
const root = path.resolve(rootArg);
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.svg':'image/svg+xml'};
const srv = http.createServer((q,res)=>{ const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'}); res.end(d);});}).listen(0);
const port = srv.address().port;
const b = await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p = await b.newPage({viewport:{width:+W,height:+H}, deviceScaleFactor:+DPR});
p.on('console', m=>{ if (['error','warning'].includes(m.type())) console.log('console:', m.text().slice(0,300)); });
p.on('pageerror', e=>console.log('pageerror:', e.message));
await p.goto(`http://127.0.0.1:${port}/${page}`);
await p.waitForFunction(()=>window.__done===true,{timeout:240000});
await p.screenshot({path: out});
await b.close(); srv.close(); console.log('ok', out);
