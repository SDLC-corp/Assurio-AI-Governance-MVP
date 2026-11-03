import {env} from 'cloudflare:workers';
export async function GET(req:Request){
 const id=new URL(req.url).searchParams.get('id');
 const record=await env.DB!.prepare('SELECT data FROM records WHERE id=? AND kind=?').bind(id,'evidence').first<any>();
 if(!record)return new Response('Evidence not found',{status:404});
 const data=JSON.parse(record.data);if(!data.attachment)return new Response('No attachment',{status:404});
 const object=await env.BUCKET!.get(data.attachment);if(!object)return new Response('Artifact not found',{status:404});
 return new Response(object.body,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(data.attachmentName),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
export async function POST(req:Request){
 let key:string|undefined;
 try{
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return Response.json({error:'Origin not allowed'},{status:403});
 if(Number(req.headers.get('content-length'))>11*1024*1024)throw Error('Maximum file size is 10 MB');
 const form=await req.formData();const id=String(form.get('id'));const file=form.get('file');
 if(!(file instanceof File)||!file.size||file.size>10*1024*1024)throw Error('Choose a file between 1 byte and 10 MB');
 const record=await env.DB!.prepare('SELECT * FROM records WHERE id=? AND kind=?').bind(id,'evidence').first<any>();
 if(!record)throw Error('Evidence record not found');
 if(record.revision!==Number(form.get('revision')))throw Error('Record changed. Refresh before uploading.');
 const data=JSON.parse(record.data);const before={...data};const buffer=await file.arrayBuffer();
 const digest=await crypto.subtle.digest('SHA-256',buffer);data.hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 key='evidence/'+id+'/'+crypto.randomUUID();data.attachment=key;data.attachmentName=file.name;data.status='Pending review';
 await env.BUCKET!.put(key,buffer);
 const at=new Date().toISOString();
 await env.DB!.batch([
 env.DB!.prepare('UPDATE records SET data=?,revision=revision+1,updated=? WHERE id=? AND revision=?').bind(JSON.stringify(data),at,id,record.revision),
 env.DB!.prepare('INSERT INTO audit(id,actor,action,target,detail,at) VALUES(CASE WHEN changes()=1 THEN ? ELSE NULL END,?,?,?,?,?)').bind(crypto.randomUUID(),req.headers.get('oai-authenticated-user-email')||'Local workspace owner','Evidence artifact uploaded',id,JSON.stringify({before,after:data}),at),
 env.DB!.prepare("UPDATE records SET data=json_set(data,'$.status','Reassessment required'),revision=revision+1,updated=? WHERE kind='decisions' AND json_extract(data,'$.system')=? AND json_extract(data,'$.status')='Approved'").bind(at,data.system)
 ]);
 return Response.json({ok:true});
 }catch(e){if(key)await env.BUCKET!.delete(key);return Response.json({error:e instanceof Error?e.message:'Upload failed'},{status:400});}
}
