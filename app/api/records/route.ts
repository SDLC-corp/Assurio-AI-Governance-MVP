import { env } from 'cloudflare:workers';
import { validate } from '../../../lib/modules';
import { seed } from '../../../lib/seed';
const json=(data:any,status=200)=>Response.json(data,{status});
export async function GET(){try{const db=env.DB!; const [r,a]=await Promise.all([db.prepare('SELECT * FROM records ORDER BY updated DESC').all(),db.prepare('SELECT * FROM audit ORDER BY at DESC LIMIT 500').all()]);return json({records:r.results.map((x:any)=>({...JSON.parse(x.data),id:x.id,kind:x.kind,revision:x.revision,updated:x.updated})),audit:a.results});}catch{return json({error:'Database unavailable. Apply migrations and retry.'},503);}}
export async function POST(req:Request){
 try{
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return json({error:'Origin not allowed'},403);
 const body:any=await req.json();const db=env.DB!;const now=new Date().toISOString();const actor=req.headers.get('oai-authenticated-user-email')||'Local workspace owner';
 const log=(action:string,target:string,detail:any)=>db.prepare('INSERT INTO audit(id,actor,action,target,detail,at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),actor,action,target,JSON.stringify(detail),now);
 if(body.action==='seed'){
 const statements=seed.map(({id,kind,...data})=>db.prepare('INSERT OR IGNORE INTO records(id,kind,data,revision,updated) VALUES(?,?,?,1,?)').bind(id,kind,JSON.stringify(data),now));
 await db.batch([...statements,log('Sample data loaded','Workspace',{})]);return json({ok:true});
 }
 const existing=body.id?await db.prepare('SELECT * FROM records WHERE id=?').bind(body.id).first<any>():null;
 if(body.id&&!existing)return json({error:'Record not found'},404);
 if(existing&&existing.revision!==body.revision)return json({error:'This record changed. Refresh and try again.'},409);
 const kind=existing?.kind||body.kind;const data=validate(kind,body.data||{});
 if(existing&&kind==='evidence'){const old=JSON.parse(existing.data);if(old.attachment)data.attachment=old.attachment;if(old.attachmentName)data.attachmentName=old.attachmentName;if(old.hash)data.hash=old.hash;}
 const all=(await db.prepare('SELECT * FROM records').all()).results.map((x:any)=>({...JSON.parse(x.data),id:x.id,kind:x.kind}));
 if(data.system&&!all.some(x=>x.id===data.system&&x.kind==='systems'))throw new Error('Select an existing AI system');
 if(kind==='evaluations'&&['Passed','Failed'].includes(data.status)){
 if(data.observed==='')throw new Error('An observed result is required');
 data.status=Number(data.observed)>=Number(data.threshold)?'Passed':'Failed';
 }
 if(kind==='decisions'&&data.status==='Approved'&&data.validUntil<now.slice(0,10))throw new Error('The review date must not be in the past');
 if(kind==='evidence'&&data.status==='Current'&&data.validUntil<now.slice(0,10))throw new Error('Current evidence must have a valid future expiry date');
 if((kind==='decisions'||kind==='systems')&&data.status==='Approved'){
 const sid=kind==='systems'?body.id:data.system;
 const linked=all.filter(x=>x.system===sid);
 if(!linked.some(x=>x.kind==='evidence'&&x.status==='Current'&&x.validUntil>=now.slice(0,10)))throw new Error('Approval requires at least one current, unexpired evidence record');
 if(linked.some(x=>x.kind==='evaluations'&&['Failed','Inconclusive'].includes(x.status)))throw new Error('Resolve failed or inconclusive evaluations before approval');
 if(linked.some(x=>x.kind==='changes'&&x.status!=='Resolved'))throw new Error('Resolve pending change reviews before approval');
 }
 const previous=existing?JSON.parse(existing.data):null;
 const changedSystem=kind==='systems'&&previous&&['model','scope','limits'].some(k=>previous[k]!==data[k]);
 if(changedSystem&&data.status==='Approved')data.status='In review';
 const id=body.id||kind.slice(0,3).toUpperCase()+'-'+crypto.randomUUID().slice(0,8);
 const statements:any[]=[];
 if(existing)statements.push(db.prepare('UPDATE records SET data=?,revision=revision+1,updated=? WHERE id=? AND revision=?').bind(JSON.stringify(data),now,id,body.revision));
 else statements.push(db.prepare('INSERT INTO records(id,kind,data,revision,updated) VALUES(?,?,?,1,?)').bind(id,kind,JSON.stringify(data),now));
 if(existing)statements.push(db.prepare('INSERT INTO audit(id,actor,action,target,detail,at) VALUES(CASE WHEN changes()=1 THEN ? ELSE NULL END,?,?,?,?,?)').bind(crypto.randomUUID(),actor,'Record revised',id,JSON.stringify({before:JSON.parse(existing.data),after:data}),now));
 else statements.push(log('Record created',id,{before:null,after:data}));
 if((kind==='changes'&&data.status!=='Resolved')||changedSystem){
 const sid=changedSystem?id:data.system;
 for(const row of all.filter(x=>x.system===sid&&(x.kind==='evidence'||x.kind==='decisions'))){
 const {id:rid,kind:rk,...value}=row;value.status=rk==='evidence'?'Stale':'Reassessment required';
 statements.push(db.prepare("UPDATE records SET data=json_set(data,'$.status',?),revision=revision+1,updated=? WHERE id=?").bind(value.status,now,rid),log('Reassessment triggered',rid,{trigger:id,before:row,after:value}));
 }
 const sys=all.find(x=>x.id===sid);
 if(sys&&sys.status==='Approved'&&!changedSystem){statements.push(db.prepare("UPDATE records SET data=json_set(data,'$.status','In review'),revision=revision+1,updated=? WHERE id=?").bind(now,sys.id),log('System review required',sys.id,{trigger:id}));}
 }
 if((kind==='evidence'&&existing)||(kind==='evaluations'&&['Failed','Inconclusive'].includes(data.status))){
 for(const row of all.filter(x=>x.system===data.system&&x.kind==='decisions'&&x.status==='Approved')){
 statements.push(db.prepare("UPDATE records SET data=json_set(data,'$.status','Reassessment required'),revision=revision+1,updated=? WHERE id=?").bind(now,row.id),log('Evidence review required',row.id,{trigger:id}));
 }
 }
 const result=await db.batch(statements);
 if(existing&&result[0].meta.changes===0)return json({error:'Concurrent update detected. Refresh.'},409);
 return json({ok:true,id});
 }catch(e){return json({error:e instanceof Error?e.message:'Unable to save'},400);}
}

