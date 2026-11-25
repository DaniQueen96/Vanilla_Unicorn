const {test}=require('node:test'), assert=require('node:assert/strict'), vm=require('node:vm'),fs=require('node:fs'),{webcrypto}=require('node:crypto');
function harness(){
 const events=new Map(),records=new Map(),results=[];
 const document={addEventListener:(name,fn)=>events.set(name,fn),dispatchEvent:e=>results.push(e)};
 const context={document,db:{},auth:{currentUser:{uid:'owner'}},OWNER_UID:'owner',crypto:webcrypto,serverTimestamp:()=> 'SERVER_TIME',doc:(_db,...parts)=>parts.join('/'),onSnapshot:()=>()=>{},setDoc:async(key,value)=>records.set(key,value),beginPackageSync:()=>{},packagePlans:[],customerCache:[],CustomEvent:class{constructor(type,args){this.type=type;this.detail=args?.detail;}},Event:class{constructor(type){this.type=type;}},console,Number,JSON,Object,Array,Date,Error,Uint8Array,TextEncoder};
 context.runTransaction=async(_db,fn)=>{const pending=[];await fn({get:async key=>({exists:()=>records.has(key),data:()=>records.get(key)}),set:(key,value)=>pending.push([key,structuredClone(value)])});pending.forEach(([k,v])=>records.set(k,v));};
 const source=fs.readFileSync(require.resolve('../auth.js'),'utf8').split('let stopBookingSettings = null;')[1];
 vm.runInNewContext('let stopBookingSettings = null;'+source,context);
 return {records,results,context,send:async p=>{results.length=0;await events.get('vu:booking-save')({detail:p});return results.at(-1)?.detail;}};
}
const booking=(id='one')=>({schema:2,id,customer:{name:'TEST',phone:'000',title:'TEST Event',save:false},status:'On hold',notes:'',quote:{total:1500},items:[],reservations:[{start:'2026-12-01T20:00:00.000Z',end:'2026-12-01T23:00:00.000Z',resources:['truck']} ]});
test('complete record persisted and unpaid hold reserves resource',async()=>{const h=harness(),r=await h.send(booking());assert(!r.error);assert.equal(h.records.get('packagePlans/one').quote.total,1500);assert(h.records.get('ownerSettings/packageReservations').bookings.one);assert.equal([...h.records.keys()].filter(x=>x.startsWith('customers/')).length,0);});
test('second booking conflicts and cancelling releases the hold',async()=>{const h=harness(),first=await h.send(booking());assert.match((await h.send(booking('two'))).error,/held/);await h.send({...first.record,status:'Cancelled'});assert(!(await h.send(booking('two'))).error);});
test('stale edits cannot overwrite a newer quote',async()=>{const h=harness();const first=await h.send(booking());const old=structuredClone(first.record);assert(!(await h.send(first.record)).error);assert.match((await h.send(old)).error,/another device/);});
test('explicit customer consent creates reusable directory record',async()=>{const h=harness(),b=booking();b.customer.save=true;assert(!(await h.send(b)).error);assert.equal([...h.records.keys()].filter(x=>x.startsWith('customers/')).length,1);});
test('partial draft saves without reservations',async()=>{const h=harness(),b=booking();b.status='Draft';b.reservations=[];b.customer.phone='';assert(!(await h.send(b)).error);assert.deepEqual(Object.keys(h.records.get('ownerSettings/packageReservations').bookings),[]);});
test('non-owner save is ignored',async()=>{const h=harness();h.context.auth.currentUser.uid='staff';await h.send(booking());assert.equal(h.records.size,0);});
