import express from 'express';import {resolve} from 'node:path';import {existsSync} from 'node:fs';import {createApi} from './api.mjs';
if(!existsSync('dist/index.html'))throw new Error('Jalankan npm run build terlebih dahulu.');
const app=express();app.disable('x-powered-by');app.use('/api',createApi());app.use(express.static(resolve('dist')));app.get('/{*path}',(req,res)=>res.sendFile(resolve('dist/index.html')));app.listen(Number(process.env.PORT)||4173,'0.0.0.0',()=>console.log('PFI workspace ready on port '+(process.env.PORT||4173)));
