import 'dotenv/config';
import { createApp } from './app.mjs';
if(process.env.NODE_ENV==='production' && !/^https:\/\//.test(process.env.APP_ORIGIN||'')) throw new Error('Production requires APP_ORIGIN=https://your-domain.');
const app=createApp();
const server=app.listen(Number(process.env.PORT)||3001,process.env.HOST||'127.0.0.1',()=>console.log(`PlayNova API → http://${process.env.HOST||'127.0.0.1'}:${process.env.PORT||3001}`));
for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close(()=>{app.locals.db.close();process.exit(0);}));
