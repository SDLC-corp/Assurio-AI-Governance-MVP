import fs from 'node:fs';
const out = new URL('../docs/assets/', import.meta.url);
const escape = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const text=(x,y,s,size=16,color='#77718a',weight=400)=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}">${escape(s)}</text>`;
const rect=(x,y,w,h,fill='#ffffff',stroke='#e6e0ef',r=14)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
const line=(d,dashed=false)=>`<path d="${d}" fill="none" stroke="#b29acb" stroke-width="2" ${dashed?'stroke-dasharray="6 5"':''} marker-end="url(#arrow)"/>`;
function svg(name,title,description,height,body){
 const source=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${height}" viewBox="0 0 1200 ${height}" role="img" aria-labelledby="title desc">
<title id="title">${escape(title)}</title><desc id="desc">${escape(description)}</desc>
<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M1 1 7 4 1 7" fill="none" stroke="#b29acb" stroke-width="1.5"/></marker></defs>
${rect(1,1,1198,height-2,'#faf8fd','#e8e1f0',20)}
<g font-family="Segoe UI, Arial, sans-serif">${text(38,40,'ASSURIO / SDLC CORP',12,'#8c6bb9',600)}${text(38,80,title,28,'#30243f',700)}${body}
${text(38,height-24,'Connected AI assurance',12,'#92859f')}${text(1040,height-24,'sdlccorp.com',12,'#92859f')}</g></svg>\n`;
 fs.writeFileSync(new URL(name,out),source);
}
const steps=[
 ['Scope','Declare intended use','and operating limits.'],
 ['Govern','Assign owners, controls,','and review responsibilities.'],
 ['Assess','Record exposure, impact,','and mitigations.'],
 ['Test','Capture methods, metrics,','and observed results.'],
 ['Evidence','Review provenance,','currency, and limitations.'],
 ['Decide','Record an accountable,','scoped approval.'],
 ['Monitor change','Record changes to models,','permissions, and context.'],
 ['Reassess','Revisit affected evidence','and decision records.']
];
let lifecycle=text(38,112,'A repeatable review cycle, from system scope to evidence-backed decisions.',16);
for(let i=0;i<8;i++){
 const col=i<4?i:7-i, row=i<4?0:1, x=38+col*286,y=148+row*193;
 lifecycle+=rect(x,y,266,150,i===5?'#33234e':'#fff',i===5?'#33234e':'#e3dbea');
 lifecycle+=rect(x+18,y+18,34,29,i===5?'#58416f':'#f0eafa',i===5?'#58416f':'#f0eafa',8);
 lifecycle+=text(x+25,y+38,String(i+1).padStart(2,'0'),13,i===5?'#e7d7fd':'#9675bd',600);
 lifecycle+=text(x+18,y+78,steps[i][0],21,i===5?'#fff':'#41324f',600);
 lifecycle+=text(x+18,y+105,steps[i][1],14,i===5?'#d0c1df':'#83778f');
 lifecycle+=text(x+18,y+126,steps[i][2],14,i===5?'#d0c1df':'#83778f');
 if(i<3)lifecycle+=line(`M${x+267} ${y+75}h17`);
 if(i===3)lifecycle+=line(`M${x+133} ${y+151}v40`);
 if(i>=4&&i<7)lifecycle+=line(`M${x-1} ${y+75}h-17`);
}
lifecycle+=line('M171 341V301',true);
svg('assurio-lifecycle.svg','One connected assurance lifecycle','Eight stages: Scope, Govern, Assess, Test, Evidence, Decide, Monitor change, and Reassess. Monitoring refers to recorded change events.',550,lifecycle);
let evidence=text(38,112,'A model change should prompt a new review of the evidence behind a decision.',16);
const cards=[
 {x:38,n:'01',title:'System baseline',rows:['Declared scope & owner','Model version & limits','Requirements & controls']},
 {x:435,n:'02',title:'Evidence record',rows:['Evaluation findings','Provenance & SHA-256','Review status & validity']},
 {x:832,n:'03',title:'Scoped decision',rows:['Accountable owner','Conditions & review date','Approval & revision history']}
];
for(const c of cards){
 evidence+=rect(c.x,151,330,194);
 evidence+=text(c.x+23,184,c.n+' / ASSURANCE RECORD',11,'#9c7bbe',600);
 evidence+=text(c.x+23,220,c.title,23,'#3b2d4b',600);
 c.rows.forEach((s,i)=>{evidence+=`<circle cx="${c.x+27}" cy="${246+i*29}" r="3" fill="#b69acb"/>`+text(c.x+40,251+i*29,s,15);});
}
evidence+=line('M370 248H431')+line('M766 248H828');
evidence+=rect(38,380,1124,86,'#eee7f7','#dfd2ee',12);
evidence+=text(61,413,'CHANGE DETECTED',12,'#8461a8',700);
evidence+=text(61,442,'New model, operating scope, or limits',16,'#4c385f',600);
evidence+=line('M438 423H500');
evidence+=text(523,413,'EVIDENCE → STALE',12,'#8461a8',700);
evidence+=text(523,442,'Review affected records',16,'#4c385f',600);
evidence+=line('M786 423H841');
evidence+=text(866,413,'DECISION → REASSESS',12,'#8461a8',700);
evidence+=text(866,442,'Record a fresh conclusion',16,'#4c385f',600);
svg('assurio-evidence-flow.svg','Make the basis for every decision visible','System baselines connect to evidence and scoped decisions. Recorded changes mark linked evidence stale and decisions for reassessment.',530,evidence);
let architecture=text(38,112,'The implemented application: a private workspace with persistent records and artifacts.',16);
architecture+=rect(38,148,1124,54,'#eee8f6','#e2d7ee',10);
architecture+=text(62,181,'HOSTED ACCESS',12,'#8c6bb9',700)+text(238,181,'Owner-private Sites authentication boundary',17,'#51405f',600);
architecture+=rect(38,254,285,210);
architecture+=text(62,291,'WORKSPACE',12,'#9a7bbb',600)+text(62,330,'React + TypeScript',23,'#3b2d4b',600);
architecture+=text(62,365,'Dashboard and record forms',15)+text(62,394,'Evidence and approval reviews',15)+text(62,423,'Search, filters, and exports',15);
architecture+=line('M326 358H423');
architecture+=rect(428,254,320,210,'#33234e','#33234e');
architecture+=text(453,291,'APPLICATION API',12,'#c1a4e1',600)+text(453,330,'Cloudflare Workers',23,'#fff',600);
architecture+=text(453,365,'Vinext server routes',15,'#d0c1df')+text(453,394,'Validation and workflow rules',15,'#d0c1df')+text(453,423,'Revisions and artifact handling',15,'#d0c1df');
architecture+=line('M751 358H793V287H840')+line('M793 358V430H840');
architecture+=rect(844,234,318,116);
architecture+=text(868,268,'D1 DATABASE',12,'#9a7bbb',600)+text(868,302,'Records & audit history',21,'#3b2d4b',600)+text(868,330,'Governance data and revisions',14);
architecture+=rect(844,376,318,116);
architecture+=text(868,410,'R2 OBJECT STORAGE',12,'#9a7bbb',600)+text(868,444,'Evidence artifacts',21,'#3b2d4b',600)+text(868,472,'Uploads and retained file versions',14);
architecture+=text(38,533,'Local development uses separate D1 / R2 state on the developer machine.',14);
svg('assurio-architecture.svg','A clear path from review to record','Private Sites access protects the React workspace and Worker API. Workers use D1 for records and audit history, and R2 for evidence artifacts.',590,architecture);
console.log('Generated three GitHub-ready SVG illustrations.');
