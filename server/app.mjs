import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { randomBytes,createHash,timingSafeEqual } from 'node:crypto';
import { resolve,join } from 'node:path';
import { existsSync } from 'node:fs';
import { openDatabase,configureAdmin,hashPassword,verifyPassword } from './db.mjs';
const digest=t=>createHash('sha256').update(t).digest('hex');
const select=`SELECT g.*,c.name AS category,c.slug AS category_slug FROM games g JOIN categories c ON c.id=g.category_id`;
const engines=['racing','snake','2048','memory','breaker','mines','tictactoe','reaction','simon','sliding'];
const slugPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function validUrl(value,kind='image') {
  if(typeof value!=='string' || value.length>500) return false;
  if(kind==='local') return /^\/games\/[a-zA-Z0-9_/-]+\.html$/.test(value) && !value.includes('..');
  if(kind==='image' && /^\/art\/[a-zA-Z0-9_-]+\.svg$/.test(value)) return true;
  try { const u=new URL(value); return u.protocol==='https:' && !u.username && !u.password; } catch {return false;}
}
function gameValues(body,db) {
  const b=body||{};
  for(const [key,min,max] of [['title',2,70],['slug',2,80],['description',10,1500],['instructions',10,2000]]) if(typeof b[key]!=='string'||b[key].trim().length<min||b[key].length>max) throw new Error(`Invalid ${key}. Must be ${min}–${max} characters.`);
  if(!slugPattern.test(b.slug)) throw new Error('Slug must contain lowercase letters, numbers and single hyphens.');
  if(!Number.isInteger(b.category_id)||!db.prepare('SELECT id FROM categories WHERE id=?').get(b.category_id)) throw new Error('Choose an existing category.');
  if(!validUrl(b.thumbnail)) throw new Error('Thumbnail must be /art/name.svg or an HTTPS URL.');
  if(!['builtin','local','embed','link'].includes(b.source_kind)) throw new Error('Invalid game source type.');
  if(b.source_kind==='builtin' ? !engines.includes(b.source) : !validUrl(b.source,b.source_kind==='local'?'local':'url')) throw new Error('Invalid game source.');
  if(b.source_kind!=='builtin' && b.authorised!==true && b.authorised!==1) throw new Error('Confirm you have permission to distribute or embed this game.');
  return [b.slug,b.title.trim(),b.description.trim(),b.instructions.trim(),b.category_id,b.thumbnail,b.source_kind,b.source,1,...['featured','popular','is_new','enabled'].map(k=>b[k]===true||b[k]===1?1:0)];
}
export function createApp({databasePath,production=process.env.NODE_ENV==='production'}={}) {
  const app=express(), db=openDatabase(databasePath);
  app.locals.db=db;
  if(process.env.ADMIN_PASSWORD && !db.prepare('SELECT id FROM admins LIMIT 1').get()) configureAdmin(db,process.env.ADMIN_USERNAME||'admin',process.env.ADMIN_PASSWORD);
  const dummyHash=hashPassword(randomBytes(20).toString('hex'));
  app.disable('x-powered-by');
  if(process.env.TRUST_PROXY==='1') app.set('trust proxy',1);
  app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],imgSrc:["'self'",'https:','data:'],fontSrc:["'self'"],frameSrc:["'self'",'https:'],connectSrc:["'self'"],upgradeInsecureRequests:production?[]:null}},crossOriginEmbedderPolicy:false,strictTransportSecurity:production?undefined:false}));
  app.use(express.json({limit:'32kb'}));
  app.use('/api',rateLimit({windowMs:60_000,limit:240,standardHeaders:'draft-8',legacyHeaders:false}));
  app.use('/api',(req,res,next)=>{
    res.set('Cache-Control','no-store');
    if(!['GET','HEAD','OPTIONS'].includes(req.method) && req.headers.origin) {
      const allowed=[process.env.APP_ORIGIN,...(!production?['http://localhost:5173','http://127.0.0.1:5173','http://localhost:3001','http://127.0.0.1:3001']:[])].filter(Boolean);
      if(!allowed.includes(req.headers.origin)) return res.status(403).json({error:'Request origin is not allowed.'});
    } next();
  });
  const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(s=>s.trim().split('=')));
  function protect(req,res,next) {
    const token=cookies(req).pn_session;
    const session=token&&/^[a-f0-9]{64}$/.test(token)?db.prepare('SELECT s.*,a.username FROM sessions s JOIN admins a ON a.id=s.admin_id WHERE token_hash=? AND expires>?').get(digest(token),Date.now()):null;
    if(!session) return res.status(401).json({error:'Please sign in to continue.'});
    if(!['GET','HEAD'].includes(req.method)) {
      const header=String(req.headers['x-csrf-token']||'');
      if(!/^[a-f0-9]{48}$/.test(header) || !timingSafeEqual(Buffer.from(header),Buffer.from(session.csrf))) return res.status(403).json({error:'Session verification failed. Refresh and try again.'});
    }
    req.session=session; next();
  }
  app.get('/api/health',(_req,res)=>res.json({ok:true}));
  app.post('/api/contact',rateLimit({windowMs:60*60_000,limit:5,legacyHeaders:false,message:{error:'Thanks for reaching out. Please wait an hour before sending another message.'}}),(req,res)=>{
    const {name,email,message}=req.body||{};
    if(typeof name!=='string'||name.trim().length<1||name.length>80||typeof email!=='string'||email.length>160||!/^\S+@\S+\.\S+$/.test(email)||typeof message!=='string'||message.trim().length<10||message.length>3000) return res.status(400).json({error:'Enter your name, a valid email, and a message of 10–3000 characters.'});
    db.prepare('INSERT INTO messages(name,email,message) VALUES(?,?,?)').run(name.trim(),email.trim(),message.trim());res.status(201).json({ok:true});
  });
  app.get('/api/categories',(_req,res)=>res.json(db.prepare(`SELECT c.*,COUNT(CASE WHEN g.enabled=1 THEN 1 END) AS game_count FROM categories c LEFT JOIN games g ON c.id=g.category_id GROUP BY c.id ORDER BY c.id`).all()));
  app.get('/api/games',(_req,res)=>res.json(db.prepare(`${select} WHERE g.enabled=1 ORDER BY g.created_at DESC,g.id`).all()));
  app.get('/api/games/:slug',(req,res)=>{const game=db.prepare(`${select} WHERE g.slug=? AND g.enabled=1`).get(req.params.slug);game?res.json(game):res.status(404).json({error:'This game is unavailable.'});});
  app.post('/api/games/:slug/play',rateLimit({windowMs:60_000,limit:30,legacyHeaders:false}),(req,res)=>{const result=db.prepare('UPDATE games SET plays=plays+1 WHERE slug=? AND enabled=1').run(req.params.slug);res.status(result.changes?200:404).json({ok:!!result.changes});});
  const loginLimit=rateLimit({windowMs:15*60_000,limit:8,skipSuccessfulRequests:true,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Too many attempts. Please try again in 15 minutes.'}});
  app.post('/api/auth/login',loginLimit,(req,res)=>{
    const {username,password}=req.body||{};
    if(typeof username!=='string'||typeof password!=='string'||username.length>40||password.length>128) return res.status(400).json({error:'Enter a valid username and password.'});
    const admin=db.prepare('SELECT * FROM admins WHERE username=?').get(username);
    const valid=verifyPassword(password,admin?.password_hash||dummyHash);
    if(!admin||!valid) return res.status(401).json({error:'Incorrect username or password.'});
    const token=randomBytes(32).toString('hex'),csrf=randomBytes(24).toString('hex');
    db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
    db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(digest(token),admin.id,csrf,Date.now()+8*60*60_000);
    res.cookie('pn_session',token,{httpOnly:true,sameSite:'strict',secure:production,maxAge:8*60*60_000,path:'/'}).json({username:admin.username,csrf});
  });
  app.get('/api/auth/me',protect,(req,res)=>res.json({username:req.session.username,csrf:req.session.csrf}));
  app.post('/api/auth/logout',protect,(req,res)=>{db.prepare('DELETE FROM sessions WHERE token_hash=?').run(req.session.token_hash);res.clearCookie('pn_session',{path:'/',httpOnly:true,sameSite:'strict',secure:production}).json({ok:true});});
  app.use('/api/admin',protect);
  app.get('/api/admin/messages',(_req,res)=>res.json(db.prepare('SELECT * FROM messages ORDER BY id DESC').all()));
  app.delete('/api/admin/messages/:id',(req,res)=>{const r=db.prepare('DELETE FROM messages WHERE id=?').run(req.params.id);res.status(r.changes?200:404).json(r.changes?{ok:true}:{error:'Message not found.'});});
  app.get('/api/admin/games',(_req,res)=>res.json(db.prepare(`${select} ORDER BY g.id`).all()));
  app.post('/api/admin/games',(req,res,next)=>{try {const values=gameValues(req.body,db);const r=db.prepare(`INSERT INTO games(slug,title,description,instructions,category_id,thumbnail,source_kind,source,authorised,featured,popular,is_new,enabled) VALUES(${values.map(()=>'?').join(',')})`).run(...values);res.status(201).json(db.prepare(`${select} WHERE g.id=?`).get(r.lastInsertRowid));} catch(e){next(e);}});
  app.put('/api/admin/games/:id',(req,res,next)=>{try {const values=gameValues(req.body,db);const r=db.prepare('UPDATE games SET slug=?,title=?,description=?,instructions=?,category_id=?,thumbnail=?,source_kind=?,source=?,authorised=?,featured=?,popular=?,is_new=?,enabled=? WHERE id=?').run(...values,req.params.id);r.changes?res.json({ok:true}):res.status(404).json({error:'Game not found.'});} catch(e){next(e);}});
  app.delete('/api/admin/games/:id',(req,res)=>{const r=db.prepare('DELETE FROM games WHERE id=?').run(req.params.id);res.status(r.changes?200:404).json(r.changes?{ok:true}:{error:'Game not found.'});});
  app.post('/api/admin/categories',(req,res,next)=>{try {const {name,slug}=req.body||{};if(typeof name!=='string'||name.trim().length<2||name.length>40||typeof slug!=='string'||slug.length>50||!slugPattern.test(slug)) throw new Error('Enter a name (2–40 characters) and a valid lowercase slug.');const r=db.prepare('INSERT INTO categories(name,slug) VALUES(?,?)').run(name.trim(),slug);res.status(201).json({id:Number(r.lastInsertRowid)});}catch(e){next(e);}});
  app.put('/api/admin/categories/:id',(req,res,next)=>{try {const {name}=req.body||{};if(typeof name!=='string'||name.trim().length<2||name.length>40) throw new Error('Name must be 2–40 characters.');const r=db.prepare('UPDATE categories SET name=? WHERE id=?').run(name.trim(),req.params.id);res.status(r.changes?200:404).json(r.changes?{ok:true}:{error:'Category not found.'});}catch(e){next(e);}});
  app.delete('/api/admin/categories/:id',(req,res,next)=>{try {const r=db.prepare('DELETE FROM categories WHERE id=?').run(req.params.id);res.status(r.changes?200:404).json(r.changes?{ok:true}:{error:'Category not found.'});}catch(e){next(e);}});
  app.use('/api',(_req,res)=>res.status(404).json({error:'API route not found.'}));
  // Optional licensed local games are separate documents with their own scripts/styles.
  app.use('/games',express.static(resolve('public/games'),{dotfiles:'deny',setHeaders:(res,file)=>{
    if(file.endsWith('.html')) res.set('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; connect-src 'none'; frame-ancestors 'self'");
  }}));
  app.use((req,res,next)=>{
    if(/^\/games\/.+\.html$/.test(req.path)) return res.status(404).type('html').send('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Game unavailable</title><body style="background:#101629;color:#f7f8ff;font:16px system-ui;padding:30px"><h1>This local game is unavailable.</h1><p>The administrator needs to install the licensed game files at the configured path.</p></body></html>');
    next();
  });
  if(existsSync(resolve('dist/index.html'))) {
    app.use(express.static(resolve('dist'),{maxAge:production?'1h':0}));
    app.get('/{*path}',(req,res)=>res.sendFile(join(resolve('dist'),'index.html')));
  }
  app.use((err,_req,res,_next)=>{
    if(err.type==='entity.parse.failed') return res.status(400).json({error:'Invalid JSON.'});
    if(err.code?.includes('CONSTRAINT')||/^(UNIQUE|FOREIGN KEY|CHECK|NOT NULL) constraint failed/.test(err.message)) return res.status(409).json({error:err.message.includes('FOREIGN KEY')?'Move this category’s games before deleting it.':'This slug or name is already in use.'});
    const validation=/^(Invalid |Choose |Confirm |Slug |Thumbnail |Enter |Name |Use )/.test(err.message);
    if(!validation) console.error(err.message);
    res.status(validation?400:500).json({error:validation?err.message:'Something went wrong. Please try again.'});
  });
  return app;
}
