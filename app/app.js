
const KEY="mygarage.v13.1";
const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const money=v=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(+v||0);
const num=v=>new Intl.NumberFormat("de-DE").format(+v||0);
function toast(text,type="good"){const h=$("toastHost");if(!h)return;const d=document.createElement("div");d.className="toast-msg "+type;d.textContent=text;h.appendChild(d);setTimeout(()=>d.remove(),1800)}


const VEHICLE_DB=[
["Audi","A3 Sportback","35 TFSI",2021,150,250,"Benzin","S tronic"],
["Audi","A4 Avant","40 TDI",2021,204,400,"Diesel","S tronic"],
["Audi","A5 Sportback","40 TDI",2021,204,400,"Diesel","S tronic"],
["Audi","S4 Avant","3.0 TDI quattro",2021,347,700,"Diesel","Tiptronic"],
["Audi","S4 Limousine","3.0 TDI quattro",2021,347,700,"Diesel","Tiptronic"],
["Audi","S4 Avant","3.0 TFSI quattro",2018,354,500,"Benzin","Tiptronic"],
["Audi","RS4 Avant","2.9 TFSI quattro",2021,450,600,"Benzin","Tiptronic"],
["Audi","A6 Avant","50 TDI quattro",2021,286,620,"Diesel","Tiptronic"],
["Audi","S6 Avant","3.0 TDI quattro",2021,344,700,"Diesel","Tiptronic"],
["Audi","RS6 Avant","4.0 TFSI quattro",2021,600,800,"Benzin","Tiptronic"],
["Audi","Q5","50 TDI quattro",2020,286,620,"Diesel","Tiptronic"],
["Audi","SQ5","3.0 TDI quattro",2021,341,700,"Diesel","Tiptronic"],
["BMW","318i","E46 2.0",2002,143,200,"Benzin","Manuell"],
["BMW","320d","G20",2021,190,400,"Diesel","Steptronic"],
["BMW","330i","G20",2021,258,400,"Benzin","Steptronic"],
["BMW","M340i xDrive","G20",2021,374,500,"Benzin","Steptronic"],
["BMW","M3 Competition","G80",2021,510,650,"Benzin","Steptronic"],
["BMW","M4 Competition","G82",2021,510,650,"Benzin","Steptronic"],
["BMW","M5 Competition","F90",2021,625,750,"Benzin","Steptronic"],
["BMW","X3 M40i","G01",2021,360,500,"Benzin","Steptronic"],
["Mercedes-Benz","A 35 AMG","4MATIC",2021,306,400,"Benzin","DCT"],
["Mercedes-Benz","A 45 S AMG","4MATIC+",2021,421,500,"Benzin","DCT"],
["Mercedes-Benz","C 220 d","W205",2020,194,400,"Diesel","9G-Tronic"],
["Mercedes-Benz","C 63 S AMG","W205",2020,510,700,"Benzin","MCT"],
["Mercedes-Benz","E 400 d","4MATIC",2021,330,700,"Diesel","9G-Tronic"],
["Mercedes-Benz","GLK 250 CDI","4MATIC",2011,204,500,"Diesel","7G-Tronic"],
["Volkswagen","Golf 2","1.6",1989,70,118,"Benzin","Manuell"],
["Volkswagen","Golf 3","1.8",1991,90,145,"Benzin","Automatik"],
["Volkswagen","Golf 7 GTI","2.0 TSI",2019,245,370,"Benzin","DSG"],
["Volkswagen","Golf 7 R","2.0 TSI 4Motion",2019,300,400,"Benzin","DSG"],
["Volkswagen","Golf 8 GTI","2.0 TSI",2021,245,370,"Benzin","DSG"],
["Volkswagen","Golf 8 GTI Clubsport","2.0 TSI",2021,300,400,"Benzin","DSG"],
["Volkswagen","Golf 8 R","2.0 TSI 4Motion",2021,320,420,"Benzin","DSG"],
["Volkswagen","Passat Variant","2.0 TDI",2021,200,400,"Diesel","DSG"],
["Volkswagen","T4","2.5 TDI",1998,102,250,"Diesel","Manuell"],
["Porsche","Boxster","986 2.5",1998,204,245,"Benzin","Manuell"],
["Porsche","718 Cayman","2.0",2021,300,380,"Benzin","PDK"],
["Porsche","911 Carrera","992",2021,385,450,"Benzin","PDK"],
["Porsche","911 Turbo S","992",2021,650,800,"Benzin","PDK"],
["Toyota","GR Supra","3.0",2021,340,500,"Benzin","Automatik"],
["Toyota","GR Yaris","1.6 Turbo AWD",2021,261,360,"Benzin","Manuell"],
["Honda","Civic Type R","FK8",2021,320,400,"Benzin","Manuell"],
["Honda","Civic Type R","FL5",2023,329,420,"Benzin","Manuell"],
["Nissan","GT-R","R35",2021,570,637,"Benzin","DCT"],
["Ford","Mustang GT","5.0 V8",2021,449,529,"Benzin","Automatik"],
["Ford","Focus ST","2.3 EcoBoost",2021,280,420,"Benzin","Manuell"],
["Ford","Fiesta ST","1.5 EcoBoost",2021,200,320,"Benzin","Manuell"],
["Opel","Omega B","2.0 16V",1998,136,185,"Benzin","Automatik"],
["Opel","Insignia GSi","2.0 Turbo",2021,230,350,"Benzin","Automatik"],
["Škoda","Octavia RS","2.0 TSI",2021,245,370,"Benzin","DSG"],
["Škoda","Octavia RS","2.0 TDI",2021,200,400,"Diesel","DSG"],
["SEAT","Leon Cupra","2.0 TSI",2020,300,380,"Benzin","DSG"],
["Cupra","Formentor VZ","2.0 TSI 4Drive",2021,310,400,"Benzin","DSG"],
["Hyundai","i30 N","2.0 T-GDI",2021,280,392,"Benzin","DCT"],
["Kia","Stinger GT","3.3 T-GDI AWD",2021,366,510,"Benzin","Automatik"],
["Tesla","Model 3","Long Range AWD",2021,498,493,"Elektro","1-Gang"],
["Tesla","Model 3","Performance AWD",2021,513,660,"Elektro","1-Gang"]
].map((x,i)=>({id:i,make:x[0],model:x[1],variant:x[2],year:x[3],power:x[4],torque:x[5],fuel:x[6],gearbox:x[7]}));
function vehicleLabel(v){return `${v.make} ${v.model} ${v.variant}`.trim()}
function fillVehicle(v){
 $("carMake").value=v.make;$("carModel").value=v.model;$("carVariant").value=v.variant||"";
 $("carYear").value=v.year||"";$("carPower").value=v.power||"";$("carTorque").value=v.torque||"";
 $("carFuel").value=v.fuel||"";$("carGearbox").value=v.gearbox||"";
 $("vehicleSearch").value=vehicleLabel(v);$("vehicleSuggestions").classList.remove("open");
 toast("Fahrzeugdaten übernommen");
}
let suggestionIndex=-1;
function searchVehicles(q){
 q=(q||"").trim().toLowerCase();
 if(q.length<1)return[];
 const terms=q.split(/\s+/);
 return VEHICLE_DB.filter(v=>terms.every(t=>vehicleLabel(v).toLowerCase().includes(t))).slice(0,10)
}
function renderSuggestions(){
 const q=$("vehicleSearch").value,arr=searchVehicles(q),box=$("vehicleSuggestions");
 suggestionIndex=-1;
 if(!arr.length){box.classList.remove("open");box.innerHTML="";return}
 box.innerHTML=arr.map((v,i)=>`<button type="button" class="suggestion" data-vid="${v.id}"><div><strong>${v.make} ${v.model}</strong><span>${v.variant} · ${v.year} · ${v.fuel}</span></div><div class="suggestion-spec">${v.power} PS · ${v.torque} Nm</div></button>`).join("");
 box.classList.add("open");
 box.querySelectorAll(".suggestion").forEach(b=>b.onclick=()=>fillVehicle(VEHICLE_DB.find(v=>v.id==b.dataset.vid)));
}
$("vehicleSearch").addEventListener("input",renderSuggestions);
$("vehicleSearch").addEventListener("keydown",e=>{
 const items=[...$("vehicleSuggestions").querySelectorAll(".suggestion")];if(!items.length)return;
 if(e.key==="ArrowDown"){e.preventDefault();suggestionIndex=(suggestionIndex+1)%items.length}
 else if(e.key==="ArrowUp"){e.preventDefault();suggestionIndex=(suggestionIndex-1+items.length)%items.length}
 else if(e.key==="Enter"&&suggestionIndex>=0){e.preventDefault();items[suggestionIndex].click();return}
 else if(e.key==="Escape"){$("vehicleSuggestions").classList.remove("open");return}else return;
 items.forEach((x,i)=>x.classList.toggle("active",i===suggestionIndex));items[suggestionIndex]?.scrollIntoView({block:"nearest"})
});
document.addEventListener("click",e=>{if(!e.target.closest(".smart-search-wrap"))$("vehicleSuggestions")?.classList.remove("open")});


const MEDIA_DB="mygarage.media.v1",MEDIA_STORE="files";
function mediaDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(MEDIA_DB,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(MEDIA_STORE))db.createObjectStore(MEDIA_STORE,{keyPath:"id"})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function mediaPut(file){const db=await mediaDb(),id=uid();await new Promise((resolve,reject)=>{const tx=db.transaction(MEDIA_STORE,"readwrite");tx.objectStore(MEDIA_STORE).put({id,name:file.name,type:file.type,size:file.size,blob:file,created:Date.now()});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();return{id,name:file.name,type:file.type,size:file.size}}
async function mediaGet(id){const db=await mediaDb();const out=await new Promise((resolve,reject)=>{const r=db.transaction(MEDIA_STORE,"readonly").objectStore(MEDIA_STORE).get(id);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)});db.close();return out}
async function mediaDelete(id){const db=await mediaDb();await new Promise((resolve,reject)=>{const tx=db.transaction(MEDIA_STORE,"readwrite");tx.objectStore(MEDIA_STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close()}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function fmtDate(s){if(!s)return"";try{return new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(s+"T12:00:00"))}catch{return s}}
async function mediaUrl(id){const x=await mediaGet(id);return x?URL.createObjectURL(x.blob):""}
async function renderLogbook(){
 const box=$("logTimeline");if(!box)return;
 const filter=$("logFilterCar")?.value||state.activeCarId;
 const rows=[...(state.logs||[])].filter(x=>!filter||x.carId===filter).sort((a,b)=>(b.date||"").localeCompare(a.date||"")||(b.created||0)-(a.created||0));
 if(!rows.length){box.innerHTML='<div class="log-empty">Noch keine Logbuch-Einträge für dieses Fahrzeug.</div>';return}
 box.innerHTML=rows.map(x=>`<article class="log-entry"><div class="log-top"><div><div class="log-date">${fmtDate(x.date)}</div><h4 class="log-title">${esc(x.title)}</h4><div class="log-meta">${esc(x.category||"")} · ${esc(cname(car(x.carId)))}</div></div><button class="mini danger" onclick="deleteLog('${x.id}')">Löschen</button></div>${x.text?`<div class="log-text">${esc(x.text)}</div>`:""}<div class="log-media" id="log-media-${x.id}"></div></article>`).join("");
 for(const x of rows){const mbox=$(`log-media-${x.id}`);for(const m of x.media||[]){try{const url=await mediaUrl(m.id);if(!url)continue;const b=document.createElement("button");b.type="button";b.className="log-media-btn";b.innerHTML=m.type?.startsWith("video/")?`<video src="${url}" muted preload="metadata"></video><span class="media-kind">▶ Video</span>`:`<img src="${url}" alt=""><span class="media-kind">Foto</span>`;b.onclick=()=>openMedia(m.id,m.type);mbox.appendChild(b)}catch(e){console.warn(e)}}}
}
async function openMedia(id,type){const x=await mediaGet(id);if(!x)return;const url=URL.createObjectURL(x.blob);$("mediaStage").innerHTML=type?.startsWith("video/")?`<video src="${url}" controls autoplay></video>`:`<img src="${url}" alt="">`;$("mediaLightbox").classList.add("open");$("mediaLightbox").setAttribute("aria-hidden","false")}
function closeMedia(){$("mediaLightbox")?.classList.remove("open");$("mediaLightbox")?.setAttribute("aria-hidden","true");$("mediaStage").innerHTML=""}
window.closeMedia=closeMedia;
async function deleteLog(id){const x=(state.logs||[]).find(v=>v.id===id);if(!x||!confirm("Diesen Logbuch-Eintrag wirklich löschen?"))return;for(const m of x.media||[]){try{await mediaDelete(m.id)}catch{}}state.logs=state.logs.filter(v=>v.id!==id);save();toast("Logbuch-Eintrag gelöscht","warn");renderLogbook()}

function blank(){return{cars:[],service:[],legal:[],fuel:[],builds:[],gallery:[],logs:[],activeCarId:null}}
function load(){
  try{
    let raw=localStorage.getItem(KEY)
      ||localStorage.getItem("mygarage.v13")
      ||localStorage.getItem("mygarage.v12")
      ||localStorage.getItem("mygarage.v11")
      ||localStorage.getItem("mygarage.v10")
      ||localStorage.getItem("mygarage.v9")
      ||localStorage.getItem("mygarage.v8")
      ||localStorage.getItem("mygarage.v7")
      ||localStorage.getItem("mygarage.v6")
      ||localStorage.getItem("mygarage.v5")
      ||localStorage.getItem("mygarage.v4")
      ||"{}";
    let old=JSON.parse(raw),s=blank();
    s.cars=old.cars||[];
    s.service=old.service||old.services||[];
    s.legal=old.legal||[];
    s.fuel=old.fuel||[];
    s.builds=old.builds||[];s.gallery=old.gallery||[];
    s.activeCarId=old.activeCarId||s.cars[0]?.id||null;
    return s
  }catch{return blank()}
}
let state=load();
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function car(id=state.activeCarId){return state.cars.find(c=>c.id===id)||state.cars[0]||null}
function cname(c){return c?[c.make,c.model,c.variant].filter(Boolean).join(" "):"Kein Fahrzeug"}
function setActive(id){if(!id)return;state.activeCarId=id;save();render()}
function show(view){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.querySelectorAll(".nav").forEach(v=>v.classList.remove("active"));
  $(view+"View")?.classList.add("active");
  document.querySelector(`.nav[data-view="${view}"]`)?.classList.add("active");
  const titles={home:"Übersicht",cars:"Fahrzeuge",service:"Service",legal:"TÜV & ABE",fuel:"Tankbuch",build:"Umbauten",logbook:"Logbuch",more:"Mehr"};
  const subs={home:"Alles Wichtige zu deinem Fahrzeug auf einen Blick.",cars:"Fahrzeuge hinzufügen, auswählen und verwalten.",service:"Wartung und nächste Termine übersichtlich festhalten.",legal:"ABE, Eintragungen und TÜV-Themen einfach dokumentieren.",fuel:"Tankungen und Kraftstoffkosten im Blick behalten.",build:"Geplante und verbaute Umbauten verwalten.",logbook:"Deine Umbauten und Veränderungen als Foto- und Video-Chronik.",more:"Backup und selten benötigte Funktionen."};
  $("pageTitle").textContent=titles[view]||"MyGarage"; $("pageSub").textContent=subs[view]||"";
  $("sidebar").classList.remove("open");
  refreshSelectors();
  renderLogbook();
  renderLists();
}
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>show(b.dataset.view));
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>show(b.dataset.go));
$("mobileMenu").onclick=()=>$("sidebar").classList.toggle("open");

function refreshSelectors(){
  const ids=["globalCar","serviceCar","legalCar","fuelCar","buildCar","logCar","logFilterCar"];
  ids.forEach(id=>{
    const el=$(id);if(!el)return;
    const old=el.value;el.innerHTML="";
    if(!state.cars.length){
      const o=document.createElement("option");o.value="";o.textContent="Kein Fahrzeug vorhanden";el.appendChild(o);el.disabled=true;return;
    }
    el.disabled=false;
    state.cars.forEach(c=>{const o=document.createElement("option");o.value=c.id;o.textContent=cname(c);el.appendChild(o)});
    const wanted=state.cars.some(c=>c.id===old)?old:(state.activeCarId||state.cars[0].id);
    el.value=wanted;
  });
}
$("globalCar").onchange=e=>setActive(e.target.value);
["serviceCar","legalCar","fuelCar","buildCar"].forEach(id=>$(id).onchange=e=>setActive(e.target.value));

async function fileData(file){
  if(!file)return"";
  if(file.size>3_000_000)throw new Error("Bild zu groß");
  return new Promise((res,rej)=>{let r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})
}

$("carForm").onsubmit=async e=>{
  e.preventDefault();
  let image="";try{image=await fileData($("carImage").files[0])}catch{return alert("Bild bitte kleiner als 3 MB wählen.")}
  const c={id:uid(),make:$("carMake").value.trim(),model:$("carModel").value.trim(),variant:$("carVariant").value.trim(),year:+$("carYear").value||0,km:+$("carKm").value||0,power:+$("carPower").value||0,torque:+$("carTorque").value||0,fuel:$("carFuel").value.trim(),gearbox:$("carGearbox").value.trim(),purchase:+$("carPurchase").value||0,plate:$("carPlate").value.trim(),image};
  state.cars.push(c);state.activeCarId=c.id;save();e.target.reset();toast("Fahrzeug gespeichert");render();show("home")
};
$("serviceDate").value=today();$("fuelDate").value=today();

$("serviceForm").onsubmit=e=>{
  e.preventDefault();if(!state.cars.length)return alert("Bitte zuerst ein Fahrzeug anlegen.");
  const id=$("serviceCar").value;
  state.service.push({id:uid(),carId:id,type:$("serviceType").value,date:$("serviceDate").value,km:+$("serviceKm").value||0,cost:+$("serviceCost").value||0,nextKm:+$("serviceNextKm").value||0,note:$("serviceNote").value.trim()});
  let c=car(id);if(c&&+$("serviceKm").value>+c.km)c.km=+$("serviceKm").value;
  save();e.target.reset();$("serviceDate").value=today();toast("Service gespeichert");render()
};
$("legalForm").onsubmit=e=>{
  e.preventDefault();if(!state.cars.length)return alert("Bitte zuerst ein Fahrzeug anlegen.");
  state.legal.push({id:uid(),carId:$("legalCar").value,part:$("legalPart").value.trim(),status:$("legalStatus").value,number:$("legalNumber").value.trim()});
  save();e.target.reset();toast("TÜV / ABE gespeichert");render()
};
$("fuelForm").onsubmit=e=>{
  e.preventDefault();if(!state.cars.length)return alert("Bitte zuerst ein Fahrzeug anlegen.");
  const id=$("fuelCar").value,km=+$("fuelKm").value||0;
  state.fuel.push({id:uid(),carId:id,date:$("fuelDate").value,km,liters:+$("fuelLiters").value||0,cost:+$("fuelCost").value||0});
  let c=car(id);if(c&&km>+c.km)c.km=km;save();e.target.reset();$("fuelDate").value=today();toast("Tankung gespeichert");render()
};
$("buildForm").onsubmit=e=>{
  e.preventDefault();if(!state.cars.length)return alert("Bitte zuerst ein Fahrzeug anlegen.");
  state.builds.push({id:uid(),carId:$("buildCar").value,name:$("buildName").value.trim(),price:+$("buildPrice").value||0,saved:+$("buildSaved").value||0,category:$("buildCategory").value,status:$("buildStatus").value,date:today()});
  save();e.target.reset();toast("Umbau gespeichert");render()
};


$("logDate").value=today();
$("logForm").onsubmit=async e=>{
 e.preventDefault();const carId=$("logCar").value||state.activeCarId;if(!carId){toast("Bitte zuerst ein Fahrzeug anlegen","warn");return}
 const files=[...$("logMedia").files].slice(0,12),media=[];
 try{for(const f of files){if(f.size>250*1024*1024){toast(`${f.name} ist größer als 250 MB`,"warn");continue}media.push(await mediaPut(f))}}catch(err){console.error(err);toast("Medien konnten nicht gespeichert werden","warn");return}
 state.logs=state.logs||[];state.logs.push({id:uid(),carId,date:$("logDate").value||today(),category:$("logCategory").value,title:$("logTitle").value.trim(),text:$("logText").value.trim(),media,created:Date.now()});
 save();e.target.reset();$("logDate").value=today();$("logCar").value=carId;$("logFilterCar").value=carId;toast("Logbuch-Eintrag gespeichert");renderLogbook()
};
$("logFilterCar").onchange=renderLogbook;
const mediaCloseBtn=$("mediaClose"),mediaLightbox=$("mediaLightbox");
if(mediaCloseBtn){
  mediaCloseBtn.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();closeMedia()});
}
if(mediaLightbox){
  mediaLightbox.addEventListener("click",e=>{if(e.target===mediaLightbox)closeMedia()});
}
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMedia()});

function item(title,sub,status,actions=""){return `<div class="item"><div class="item-main"><div class="item-title">${title}</div><div class="item-sub">${sub||""}</div></div><div class="item-actions">${status||""}${actions}</div></div>`}
function del(type,id){state[type]=state[type].filter(x=>x.id!==id);save();render()}
window.del=del;
window.activate=id=>setActive(id);

function renderHome(){
  const c=car();
  $("homeCarName").textContent=c?cname(c):"Noch kein Fahrzeug";
  $("homeCarInfo").textContent=c?[c.year||"",c.plate||""].filter(Boolean).join(" · ")||"Fahrzeugdetails":"Lege dein erstes Fahrzeug an.";
  $("statKm").textContent=c?num(c.km)+" km":"—";$("statPower").textContent=c&&c.power?num(c.power)+" PS":"—";
  let next=state.service.filter(x=>c&&x.carId===c.id&&x.nextKm>+c.km).sort((a,b)=>a.nextKm-b.nextKm)[0];
  $("statService").textContent=next?num(next.nextKm)+" km":"—";
  const cost=(c?(+c.purchase||0)+state.service.filter(x=>x.carId===c.id).reduce((a,x)=>a+(+x.cost||0),0)+state.fuel.filter(x=>x.carId===c.id).reduce((a,x)=>a+(+x.cost||0),0)+state.builds.filter(x=>x.carId===c.id).reduce((a,x)=>a+(+x.price||0),0):0);
  $("statCost").textContent=money(cost);
  const hi=$("heroImage");hi.innerHTML=c?.image?`<img src="${c.image}" alt="">`:"<span>🚘</span>";
  let acts=[];
  state.service.filter(x=>c&&x.carId===c.id).forEach(x=>acts.push({d:x.date,t:x.type,s:money(x.cost)}));
  state.fuel.filter(x=>c&&x.carId===c.id).forEach(x=>acts.push({d:x.date,t:"Tankung",s:`${x.liters||0} l · ${money(x.cost)}`}));
  state.builds.filter(x=>c&&x.carId===c.id).forEach(x=>acts.push({d:x.date||"",t:x.name,s:x.status}));
  acts.sort((a,b)=>(b.d||"").localeCompare(a.d||""));
  $("activityList").innerHTML=acts.length?acts.slice(0,5).map(x=>item(x.t,[x.d,x.s].filter(Boolean).join(" · "),"")).join(""):'<div class="empty">Noch keine Aktivitäten.</div>';
}

function renderExtras(){
 const c=car();
 if(!c){
   $("vehicleStatus").innerHTML='<div class="empty">Lege zuerst ein Fahrzeug an.</div>';
   $("reminderList").innerHTML='<div class="empty">Keine Erinnerungen.</div>';
   $("nextBuildCard").innerHTML='<div class="empty">Noch kein Umbau geplant.</div>';
   $("costBreakdown").innerHTML='<div class="empty">Noch keine Kosten.</div>';
   $("statusCount").textContent="—";$("nextBuildStatus").textContent="—";return;
 }
 let issues=[], reminders=[];
 const services=state.service.filter(x=>x.carId===c.id);
 services.forEach(x=>{
   if(x.nextKm){
     let left=(+x.nextKm||0)-(+c.km||0);
     if(left<=0){issues.push({level:"bad",text:`${x.type} fällig`,sub:`seit ${num(Math.abs(left))} km`});reminders.push({t:x.type,s:"Jetzt fällig",level:"bad"})}
     else if(left<=3000){issues.push({level:"warn",text:`${x.type} bald`,sub:`in ${num(left)} km`});reminders.push({t:x.type,s:`in ${num(left)} km`,level:"warn"})}
   }
 });
 const hu=state.legal.filter(x=>x.carId===c.id&&/Eintragung nötig|Unbekannt/.test(x.status));
 hu.forEach(x=>issues.push({level:x.status==="Eintragung nötig"?"bad":"warn",text:x.part,sub:x.status}));
 if(!issues.length)$("vehicleStatus").innerHTML='<div class="status-main"><span class="status-dot"></span><div><strong>Alles OK</strong><span>Aktuell ist nichts dringend.</span></div></div>';
 else $("vehicleStatus").innerHTML=issues.slice(0,3).map(x=>`<div class="status-main ${x.level}"><span class="status-dot"></span><div><strong>${x.text}</strong><span>${x.sub}</span></div></div>`).join("");
 $("statusCount").textContent=issues.length?`${issues.length} Hinweis${issues.length===1?"":"e"}`:"Alles OK";
 $("reminderList").innerHTML=reminders.length?reminders.slice(0,4).map(x=>item(x.t,x.s,`<span class="status ${x.level}">${x.level==="bad"?"Fällig":"Bald"}</span>`)).join(""):'<div class="empty">Keine anstehenden Service-Erinnerungen.</div>';

 const builds=state.builds.filter(x=>x.carId===c.id&&x.status!=="Verbaut");
 const n=builds[0];
 if(n){
   let saved=Math.min(+n.saved||0,+n.price||0),pct=n.price?Math.round(saved/n.price*100):0;
   $("nextBuildStatus").textContent=n.status;
   $("nextBuildCard").innerHTML=`<h4>${n.name}</h4><p>${n.category} · ${money(n.price)}</p><div class="progress-soft"><i style="width:${pct}%"></i></div><div class="save-info"><span>${money(saved)} gespart</span><span>${pct}%</span></div>`;
 }else{$("nextBuildStatus").textContent="—";$("nextBuildCard").innerHTML='<div class="empty">Kein offener Umbau. Dein Build ist aktuell komplett.</div>'}

 const fuel=state.fuel.filter(x=>x.carId===c.id).reduce((a,x)=>a+(+x.cost||0),0);
 const service=services.reduce((a,x)=>a+(+x.cost||0),0);
 const buildsCost=state.builds.filter(x=>x.carId===c.id).reduce((a,x)=>a+(+x.price||0),0);
 const purchase=+c.purchase||0;
 $("costBreakdown").innerHTML=[["Kaufpreis",purchase],["Tanken",fuel],["Service",service],["Umbauten",buildsCost],["Gesamt",purchase+fuel+service+buildsCost]].map((x,i)=>`<div class="cost-row ${i===4?"total":""}"><span>${x[0]}</span><b>${money(x[1])}</b></div>`).join("");
}
let galleryPending=false;
$("galleryInput").onchange=async e=>{
 if(!state.cars.length)return alert("Bitte zuerst ein Fahrzeug anlegen.");
 const file=e.target.files?.[0];if(!file)return;
 try{
   const mine=state.gallery.filter(x=>x.carId===state.activeCarId);
   if(mine.length>=5)return alert("Maximal 5 Bilder pro Fahrzeug.");
   const image=await fileData(file);
   state.gallery.push({id:uid(),carId:state.activeCarId,image,cover:mine.length===0});
   if(mine.length===0){let c=car();if(c)c.image=image}
   save();e.target.value="";render()
 }catch{alert("Bild bitte kleiner als 3 MB wählen.")}
};
window.coverPhoto=id=>{
 const x=state.gallery.find(g=>g.id===id);if(!x)return;
 state.gallery.forEach(g=>{if(g.carId===x.carId)g.cover=false});x.cover=true;
 let c=car(x.carId);if(c)c.image=x.image;save();render()
};
window.delPhoto=id=>{state.gallery=state.gallery.filter(x=>x.id!==id);save();render()};
function renderGallery(){
 const c=car(),a=state.gallery.filter(x=>c&&x.carId===c.id);
 $("miniGallery").innerHTML=a.length?a.map(x=>`<div class="mini-photo ${x.cover?"cover":""}"><img src="${x.image}" alt=""><div class="mini-photo-actions"><button onclick="coverPhoto('${x.id}')">${x.cover?"Titel":"Titelbild"}</button><button onclick="delPhoto('${x.id}')">×</button></div></div>`).join(""):'<div class="empty">Noch keine Bilder.</div>';
}
function renderLists(){
  const c=car();
  $("carList").innerHTML=state.cars.length?state.cars.map(x=>`<div class="vehicle-card">
    <div class="vehicle-thumb">${x.image?`<img src="${x.image}" alt="">`:"<span>🚗</span>"}</div>
    <div class="vehicle-main"><h4>${cname(x)}</h4><p>${[x.year?`Baujahr ${x.year}`:"",`${num(x.km)} km`,x.purchase?money(x.purchase):"",x.plate].filter(Boolean).join(" · ")}</p></div>
    <div class="vehicle-actions">${x.id===state.activeCarId?'<span class="status good">Aktiv</span>':""}<button class="mini" onclick="activate('${x.id}')">Auswählen</button><button class="mini danger" onclick="del('cars','${x.id}')">Löschen</button></div>
  </div>`).join(""):'<div class="empty">Noch kein Fahrzeug angelegt.</div>';

  $("serviceList").innerHTML=state.service.filter(x=>c&&x.carId===c.id).sort((a,b)=>(b.date||"").localeCompare(a.date||"")).map(x=>item(x.type,[x.date,`${num(x.km)} km`,money(x.cost),x.note].filter(Boolean).join(" · "),"",`<button class="mini danger" onclick="del('service','${x.id}')">Löschen</button>`)).join("")||'<div class="empty">Noch keine Service-Einträge.</div>';

  $("legalList").innerHTML=state.legal.filter(x=>c&&x.carId===c.id).map(x=>{let cls=/Eingetragen|ABE|ECE|Serie/.test(x.status)?"good":/nötig|Unbekannt/.test(x.status)?"bad":"warn";return item(x.part,[x.number].filter(Boolean).join(" · "),`<span class="status ${cls}">${x.status}</span>`,`<button class="mini danger" onclick="del('legal','${x.id}')">Löschen</button>`)}).join("")||'<div class="empty">Noch keine TÜV/ABE-Einträge.</div>';

  $("fuelList").innerHTML=state.fuel.filter(x=>c&&x.carId===c.id).sort((a,b)=>(b.date||"").localeCompare(a.date||"")).map(x=>item("Tankung",[x.date,`${num(x.km)} km`,`${x.liters||0} l`,money(x.cost)].join(" · "),"",`<button class="mini danger" onclick="del('fuel','${x.id}')">Löschen</button>`)).join("")||'<div class="empty">Noch keine Tankungen.</div>';

  $("buildList").innerHTML=state.builds.filter(x=>c&&x.carId===c.id).map(x=>item(x.name,[x.category,money(x.price)].join(" · "),`<span class="status ${x.status==="Verbaut"?"good":""}">${x.status}</span>`,`<button class="mini danger" onclick="del('builds','${x.id}')">Löschen</button>`)).join("")||'<div class="empty">Noch keine Umbauten.</div>';
}
function render(){refreshSelectors();renderHome();renderExtras();renderGallery();renderLists()}
$("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="MyGarage_Backup.json";a.click();URL.revokeObjectURL(a.href)}
$("importFile").onchange=async e=>{try{let s=JSON.parse(await e.target.files[0].text());state=Object.assign(blank(),s);save();render();show("home")}catch{alert("Backup konnte nicht gelesen werden.")}}
$("resetBtn").onclick=()=>{if(confirm("Wirklich alle lokalen MyGarage-Daten löschen?")){state=blank();save();render();show("home")}}
render();

async function initDesktopUpdateUI(){
  const versionEl=document.getElementById("appVersion");
  const btn=document.getElementById("checkUpdatesBtn");
  const status=document.getElementById("updateStatus");
  if(!window.myGarageDesktop){
    if(versionEl) versionEl.textContent="Web-Version";
    if(btn) btn.disabled=true;
    if(status) status.textContent="Updateprüfung ist nur in der Windows-App verfügbar.";
    return;
  }
  try{if(versionEl) versionEl.textContent=await window.myGarageDesktop.getVersion();}catch(e){}
  if(btn) btn.addEventListener("click",async()=>{
    btn.disabled=true; const old=btn.textContent; btn.textContent="Suche…";
    if(status) status.textContent="Suche nach einer neuen Version…";
    try{
      const r=await window.myGarageDesktop.checkForUpdates();
      if(!r?.ok && status) status.textContent="Updateprüfung fehlgeschlagen: "+(r?.error||"Unbekannter Fehler");
    }catch(e){if(status) status.textContent="Updateprüfung fehlgeschlagen.";}
    setTimeout(()=>{btn.disabled=false;btn.textContent=old;},1200);
  });
}
document.addEventListener("DOMContentLoaded",initDesktopUpdateUI);


/* MyGarage 1.3 - Vehicle Share Cards */
let shareCarId=null;
const shareImgCache=new Map();

function shareActiveCar(){
  return state.cars.find(c=>c.id===shareCarId)||state.cars.find(c=>c.id===state.activeCarId)||state.cars[0];
}
function shareCarTitle(c){return [c.make,c.model,c.variant].filter(Boolean).join(" ");}
function shareMoney(v){const n=Number(v||0);return n?new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n):"—";}
function roundedRect(ctx,x,y,w,h,r){
  const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
}
function fitText(ctx,text,maxWidth,startSize,minSize=24){
  let s=startSize;do{ctx.font=`800 ${s}px Arial`;if(ctx.measureText(text).width<=maxWidth)return s;s-=2;}while(s>minSize);return minSize;
}
async function loadShareImage(src){
  if(!src)return null;
  if(shareImgCache.has(src))return shareImgCache.get(src);
  return await new Promise(resolve=>{
    const im=new Image();im.onload=()=>{shareImgCache.set(src,im);resolve(im)};im.onerror=()=>resolve(null);im.src=src;
  });
}
function findCarImage(c){
  const g=(state.gallery||[]).filter(x=>x.carId===c.id);
  return c.image||c.photo||c.imageData||g[0]?.data||g[0]?.src||g[0]?.image||null;
}
function drawCover(ctx,img,x,y,w,h){
  const ir=img.width/img.height, r=w/h;let sx=0,sy=0,sw=img.width,sh=img.height;
  if(ir>r){sw=img.height*r;sx=(img.width-sw)/2}else{sh=img.width/r;sy=(img.height-sh)/2}
  ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);
}
async function renderShareCard(){
  const c=shareActiveCar(),canvas=document.getElementById("shareCanvas");if(!c||!canvas)return;
  const format=document.getElementById("shareFormat")?.value||"post";
  const theme=document.getElementById("shareTheme")?.value||"dark";
  const purchase=document.getElementById("sharePurchase")?.checked;
  const brand=document.getElementById("shareBrand")?.checked!==false;
  canvas.width=1080;canvas.height=format==="story"?1920:1350;
  const ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height;
  const themes={
    dark:{bg:"#0b0d10",panel:"#15181d",text:"#ffffff",sub:"#a8adb7",accent:"#e33434"},
    performance:{bg:"#080808",panel:"#121212",text:"#ffffff",sub:"#b6b6b6",accent:"#ff3030"},
    minimal:{bg:"#f3f1ec",panel:"#ffffff",text:"#111111",sub:"#666666",accent:"#222222"}
  },t=themes[theme];
  ctx.fillStyle=t.bg;ctx.fillRect(0,0,W,H);
  if(theme==="performance"){ctx.fillStyle=t.accent;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(330,0);ctx.lineTo(0,330);ctx.fill()}
  const pad=70, imageY=format==="story"?180:80, imageH=format==="story"?780:600;
  roundedRect(ctx,pad,imageY,W-pad*2,imageH,34);ctx.save();ctx.clip();
  const img=await loadShareImage(findCarImage(c));
  if(img)drawCover(ctx,img,pad,imageY,W-pad*2,imageH);
  else{ctx.fillStyle=t.panel;ctx.fillRect(pad,imageY,W-pad*2,imageH);ctx.fillStyle=t.sub;ctx.font="700 34px Arial";ctx.textAlign="center";ctx.fillText("FAHRZEUGBILD",W/2,imageY+imageH/2)}
  ctx.restore();
  const grad=ctx.createLinearGradient(0,imageY+imageH*.5,0,imageY+imageH);grad.addColorStop(0,"rgba(0,0,0,0)");grad.addColorStop(1,"rgba(0,0,0,.72)");ctx.fillStyle=grad;ctx.fillRect(pad,imageY,W-pad*2,imageH);
  const title=shareCarTitle(c)||"Mein Fahrzeug";ctx.textAlign="left";ctx.fillStyle="#fff";const fs=fitText(ctx,title,W-pad*2-70,58,32);ctx.font=`800 ${fs}px Arial`;ctx.fillText(title,pad+35,imageY+imageH-55);
  let infoY=imageY+imageH+65;
  ctx.fillStyle=t.text;ctx.font="800 30px Arial";ctx.fillText("FAHRZEUGDATEN",pad,infoY);
  ctx.fillStyle=t.accent;ctx.fillRect(pad,infoY+18,90,6);
  infoY+=75;
  const rows=[
    ["Baujahr",c.year||"—"],["Leistung",c.power?`${c.power} PS`:"—"],["Drehmoment",c.torque?`${c.torque} Nm`:"—"],
    ["Kraftstoff",c.fuel||"—"],["Getriebe",c.gearbox||"—"]
  ];
  if(purchase)rows.push(["Kaufpreis",shareMoney(c.purchase)]);
  const cols=2, gap=22, boxW=(W-pad*2-gap)/2, boxH=105;
  rows.forEach((r,i)=>{
    const x=pad+(i%cols)*(boxW+gap),y=infoY+Math.floor(i/cols)*(boxH+gap);
    ctx.fillStyle=t.panel;roundedRect(ctx,x,y,boxW,boxH,20);ctx.fill();
    ctx.fillStyle=t.sub;ctx.font="600 21px Arial";ctx.fillText(r[0].toUpperCase(),x+24,y+34);
    ctx.fillStyle=t.text;ctx.font="800 30px Arial";ctx.fillText(String(r[1]),x+24,y+75);
  });
  if(brand){ctx.fillStyle=t.sub;ctx.font="600 22px Arial";ctx.textAlign="center";ctx.fillText("Made with MyGarage",W/2,H-45)}
}
function openShareCard(carId){
  shareCarId=carId||state.activeCarId;const m=document.getElementById("shareModal");if(!m)return;m.classList.add("open");m.setAttribute("aria-hidden","false");renderShareCard();
}
function closeShareCard(){const m=document.getElementById("shareModal");m?.classList.remove("open");m?.setAttribute("aria-hidden","true")}
async function shareCardBlob(){const c=document.getElementById("shareCanvas");return await new Promise(r=>c.toBlob(r,"image/png",1))}
async function downloadShareCard(){
  const blob=await shareCardBlob();if(!blob)return;const car=shareActiveCar();const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`MyGarage-${(shareCarTitle(car)||"Fahrzeug").replace(/[^a-z0-9äöüß]+/gi,"-")}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
}
async function nativeShareCard(){
  const blob=await shareCardBlob();if(!blob)return;const file=new File([blob],"MyGarage-Share.png",{type:"image/png"});
  if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({title:"MyGarage",text:"Mein Fahrzeug in MyGarage",files:[file]});return}catch(e){if(e.name==="AbortError")return}}
  downloadShareCard();
}
function ensureShareButtons(){
  document.querySelectorAll(".car-card").forEach(card=>{
    if(card.querySelector(".share-car-btn"))return;
    const id=card.dataset.id||card.getAttribute("data-car-id");
    if(!id)return;
    const b=document.createElement("button");b.type="button";b.className="btn ghost share-car-btn";b.textContent="Share Card";b.addEventListener("click",e=>{e.stopPropagation();openShareCard(id)});card.appendChild(b);
  });
}
document.addEventListener("click",e=>{
  if(e.target?.id==="shareClose")closeShareCard();
  if(e.target?.id==="shareDownload")downloadShareCard();
  if(e.target?.id==="shareNative")nativeShareCard();
  if(e.target?.id==="shareModal")closeShareCard();
});
document.addEventListener("change",e=>{if(["shareFormat","shareTheme","sharePurchase","shareBrand"].includes(e.target?.id))renderShareCard()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeShareCard()});
const shareObserver=new MutationObserver(()=>ensureShareButtons());
document.addEventListener("DOMContentLoaded",()=>{ensureShareButtons();const root=document.getElementById("cars")||document.body;shareObserver.observe(root,{childList:true,subtree:true})});
window.openShareCard=openShareCard;


/* MyGarage 1.3.1 - Share Button Fix for dashboard hero */
function ensureDashboardShareButton(){
  if(document.getElementById("dashboardShareBtn")) return;

  // Find the "Fahrzeug verwalten" button in the current dashboard hero.
  const buttons=[...document.querySelectorAll("button, a")];
  const manageBtn=buttons.find(el => (el.textContent||"").trim().toLowerCase()==="fahrzeug verwalten");
  if(!manageBtn) return;

  const parent=manageBtn.parentElement;
  if(!parent) return;

  const btn=document.createElement("button");
  btn.id="dashboardShareBtn";
  btn.type="button";
  btn.className="btn ghost";
  btn.textContent="↗ Share Card";
  btn.addEventListener("click", e=>{
    e.preventDefault();
    e.stopPropagation();
    openShareCard(state.activeCarId);
  });

  parent.appendChild(btn);
}

document.addEventListener("DOMContentLoaded", ()=>{
  ensureDashboardShareButton();
  setTimeout(ensureDashboardShareButton, 250);
  setTimeout(ensureDashboardShareButton, 1000);
});

const dashboardShareObserver=new MutationObserver(()=>ensureDashboardShareButton());
document.addEventListener("DOMContentLoaded", ()=>{
  dashboardShareObserver.observe(document.body,{childList:true,subtree:true});
});
