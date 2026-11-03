import fs from 'node:fs';
const targets=await (await fetch('http://127.0.0.1:9223/json')).json();
const ws=new WebSocket(targets.find(x=>x.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
let next=0;const pending=new Map();const errors=[];
ws.addEventListener('message',e=>{const d=JSON.parse(e.data);if(d.id){const p=pending.get(d.id);pending.delete(d.id);if(d.error)p.reject(Error(JSON.stringify(d.error)));else p.resolve(d.result);}if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.text);});
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
await send('Runtime.enable');await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'http://127.0.0.1:8787'});
for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,250));if(await evaluate("document.querySelectorAll('tbody tr').length>0"))break;}
const desktop=await evaluate("({title:document.title,heading:document.querySelector('h1')?.textContent,rows:document.querySelectorAll('tbody tr').length,overflow:document.documentElement.scrollWidth>innerWidth})");
fs.mkdirSync('outputs',{recursive:true});
let shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('outputs/desktop.png',Buffer.from(shot.data,'base64'));
await evaluate("[...document.querySelectorAll('nav button')].find(x=>x.textContent.includes('AI inventory')).click()");
await new Promise(r=>setTimeout(r,300));
await evaluate("[...document.querySelectorAll('.heading-actions button')].find(x=>x.textContent.includes('Register')).click()");
const form=await evaluate("({fields:document.querySelectorAll('form input,form select,form textarea').length,dialog:!!document.querySelector('[role=dialog]')})");
await evaluate("document.querySelector('[aria-label=\"Close form\"]').click()");
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
await new Promise(r=>setTimeout(r,300));
const mobile=await evaluate("({overflow:document.documentElement.scrollWidth>innerWidth,menu:getComputedStyle(document.querySelector('.mobile-menu')).display})");
shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('outputs/mobile.png',Buffer.from(shot.data,'base64'));
console.log(JSON.stringify({desktop,form,mobile,errors}));
ws.close();
