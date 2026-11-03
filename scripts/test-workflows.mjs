import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:8787';
let checks=0;
async function post(body,status=200){const r=await fetch(base+'/api/records',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));checks++;return d;}
async function read(){return (await fetch(base+'/api/records')).json();}
async function get(id){return (await read()).records.find(r=>r.id===id);}
const system={name:'Workflow test '+Date.now(),owner:'QA',domain:'Engineering',risk:'High',status:'Draft',scope:'Integration test',model:'v1',limits:'Human approval'};
await post({kind:'systems',data:{}},400);
const {id:sid}=await post({kind:'systems',data:system});
const decision={name:'QA approval',system:sid,owner:'QA',scope:'Test scope',conditions:'Human oversight',validUntil:'2099-01-01',status:'Approved'};
await post({kind:'decisions',data:decision},400);
const {id:eid}=await post({kind:'evidence',data:{name:'QA evidence',system:sid,owner:'QA',baseline:'v1',method:'Integration test',validUntil:'2099-01-01',status:'Current'}});
const evaluation={name:'QA evaluation',system:sid,owner:'QA',method:'Synthetic check',metric:'Score',threshold:'95',observed:'80',status:'Passed'};
const {id:vid}=await post({kind:'evaluations',data:evaluation});
assert.equal((await get(vid)).status,'Failed');checks++;
await post({kind:'decisions',data:decision},400);
let row=await get(vid);
await post({id:vid,revision:row.revision,data:{...row,observed:'98',status:'Passed'}});
await post({id:vid,revision:row.revision,data:row},409);
const {id:did}=await post({kind:'decisions',data:decision});
await post({kind:'changes',data:{name:'QA model change',system:sid,owner:'QA',category:'Model',before:'v1',after:'v2',reason:'New baseline',status:'Detected'}});
assert.equal((await get(eid)).status,'Stale');assert.equal((await get(did)).status,'Reassessment required');checks+=2;
const ev=await get(eid),form=new FormData();form.set('id',eid);form.set('revision',String(ev.revision));form.set('file',new Blob(['test evidence artifact']),'test.txt');
const uploaded=await fetch(base+'/api/artifacts',{method:'POST',body:form});assert.equal(uploaded.status,200,await uploaded.text());checks++;
const artifact=await fetch(base+'/api/artifacts?id='+eid);assert.equal(await artifact.text(),'test evidence artifact');checks++;
assert.equal((await get(eid)).hash.length,64);assert.equal((await get(eid)).status,'Pending review');checks+=2;
const forbidden=await fetch(base+'/api/records',{method:'POST',headers:{Origin:'https://invalid.example','Content-Type':'application/json'},body:'{}'});assert.equal(forbidden.status,403);checks++;
const state=await read();assert(state.audit.some(a=>a.target===did&&a.action==='Reassessment triggered'));checks++;
await post({action:'seed'});
console.log(JSON.stringify({passed:checks,system:sid,note:'QA records exist only in the local test database.'}));
