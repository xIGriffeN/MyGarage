
const KEY="mygarage.v13.1";
const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const money=v=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(+v||0);
const num=v=>new Intl.NumberFormat("de-DE").format(+v||0);
function toast(text,type="good"){const h=$("toastHost");if(!h)return;const d=document.createElement("div");d.className="toast-msg "+type;d.textContent=text;h.appendChild(d);setTimeout(()=>d.remove(),1800)}


const VEHICLE_DB=window.JIGGY_VEHICLE_DB||[];
function vehicleLabel(v){return `${v.make} ${v.model} ${v.variant}`.trim()}
let pendingExampleImage=null,pendingExampleSkip=0,pendingVehicle=null;
function setExamplePreview(data,status){
 const visual=$("vehicleExampleVisual"),credit=$("vehicleExampleCredit"),btn=$("changeExampleImage"),label=$("vehicleExampleStatus");
 if(!visual)return;
 if(data?.url){visual.innerHTML=`<img src="${esc(data.url)}" alt="Beispielbild">`;pendingExampleImage=data;label.textContent=status||"Beispielbild gefunden – eigenes Foto hat später Vorrang.";btn.disabled=false;credit.hidden=false;credit.href=data.sourceUrl||"#";credit.textContent=`${data.source||"Wikimedia"}${data.license?` · ${data.license}`:""}`;}
 else{visual.innerHTML=`<div class="example-fallback"><span>JIGGY.</span><small>${pendingVehicle?esc(`${pendingVehicle.make} ${pendingVehicle.model}`):"Vehicle preview"}</small></div>`;label.textContent=status||"Kein Online-Beispielbild verfügbar. JIGGY nutzt einen lokalen Platzhalter.";credit.hidden=true;btn.disabled=!pendingVehicle;}
}
async function loadExampleImageForVehicle(v,skip=0){
 pendingVehicle=v;pendingExampleSkip=skip;pendingExampleImage=null;
 setExamplePreview(null,"Suche passendes Beispielbild …");
 if(!window.myGarageDesktop?.getVehicleImage){setExamplePreview(null,"Beispielbilder werden in der Windows-App automatisch geladen.");return}
 try{const r=await window.myGarageDesktop.getVehicleImage(v.imageQuery||vehicleLabel(v),skip);if(r?.ok)setExamplePreview(r);else setExamplePreview(null,r?.error||"Kein Beispielbild gefunden.")}catch(e){setExamplePreview(null,"Beispielbild konnte nicht geladen werden.")}
}
async function fillVehicle(v){
 $("carMake").value=v.make;$("carModel").value=v.model;$("carVariant").value=v.variant||"";
 $("carYear").value=v.year||"";$("carPower").value=v.power||"";$("carTorque").value=v.torque||"";
 $("carFuel").value=v.fuel||"";$("carGearbox").value=v.gearbox||"";
 $("vehicleSearch").value=vehicleLabel(v);$("vehicleSuggestions").classList.remove("open");
 toast("Fahrzeugdaten übernommen");
 await loadExampleImageForVehicle(v,0);
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
$("changeExampleImage").onclick=()=>{if(pendingVehicle)loadExampleImageForVehicle(pendingVehicle,pendingExampleSkip+1)};


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

function blank(){return{cars:[],service:[],legal:[],fuel:[],fuelPrices:[],fuelVouchers:[],builds:[],gallery:[],logs:[],documents:[],reminders:[],activeCarId:null}}
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
    s.fuelPrices=old.fuelPrices||[];
    s.fuelVouchers=old.fuelVouchers||[];
    s.builds=old.builds||[];s.gallery=old.gallery||[];s.logs=old.logs||[];s.documents=old.documents||[];s.reminders=old.reminders||[];
    s.activeCarId=old.activeCarId||s.cars[0]?.id||null;
    return s
  }catch{return blank()}
}
let state=load();
let cloudSyncTimer=null,cloudSyncApplying=false,cloudSyncRunning=false;
function save(){
  localStorage.setItem(KEY,JSON.stringify(state));
  if(!cloudSyncApplying && typeof scheduleCloudSync==="function")scheduleCloudSync();
}
function car(id=state.activeCarId){return state.cars.find(c=>c.id===id)||state.cars[0]||null}
function cname(c){return c?[c.make,c.model,c.variant].filter(Boolean).join(" "):"Kein Fahrzeug"}
function setActive(id){if(!id)return;state.activeCarId=id;save();render()}

/* ===== JIGGY 1.7.4 — WORKING SIDEBAR SUBMENUS ===== */
function setSubmenuOpen(id, open){
  const menu = document.getElementById(id);
  const toggle = document.querySelector(`.nav-toggle[data-submenu="${id}"]`);
  if(!menu || !toggle) return;
  menu.classList.toggle("open", !!open);
  toggle.classList.toggle("open", !!open);
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  toggle.closest(".nav-parent-row")?.classList.toggle("open", !!open);
}

function toggleSubmenu(id){
  const menu = document.getElementById(id);
  if(!menu) return;
  setSubmenuOpen(id, !menu.classList.contains("open"));
}

function syncSidebarGroups(view){
  const serviceActive = view === "service" || view === "reminders";
  const legalActive = view === "legal" || view === "vault";

  // If one of the submenu pages is active, keep that group open.
  if(view === "reminders") setSubmenuOpen("serviceSubmenu", true);
  if(view === "vault") setSubmenuOpen("legalSubmenu", true);

  document.querySelector('.nav-toggle[data-submenu="serviceSubmenu"]')
    ?.closest(".nav-parent-row")?.classList.toggle("active-parent", serviceActive);

  document.querySelector('.nav-toggle[data-submenu="legalSubmenu"]')
    ?.closest(".nav-parent-row")?.classList.toggle("active-parent", legalActive);
}

document.querySelectorAll(".nav-toggle[data-submenu]").forEach(toggle => {
  toggle.setAttribute("aria-expanded", "false");
  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleSubmenu(toggle.dataset.submenu);
  });
});

function show(view){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.querySelectorAll(".nav").forEach(v=>v.classList.remove("active"));
  $(view+"View")?.classList.add("active");
  document.querySelector(`.nav[data-view="${view}"]`)?.classList.add("active");
  const titles={home:"Übersicht",cars:"Fahrzeuge",service:"Service",legal:"TÜV & ABE",fuel:"Tankbuch",build:"Umbauten",logbook:"Logbuch",stats:"Statistiken",jobs:"Jobs",vault:"Dokumente",reminders:"Erinnerungen",spots:"Spots",profile:"Public Profile",more:"Mehr"};
  const subs={home:"Alles Wichtige zu deinem Fahrzeug auf einen Blick.",cars:"Fahrzeuge hinzufügen, auswählen und verwalten.",service:"Wartung und nächste Termine übersichtlich festhalten.",legal:"ABE, Eintragungen und TÜV-Themen einfach dokumentieren.",fuel:"Tankungen und Kraftstoffkosten im Blick behalten.",build:"Geplante und verbaute Umbauten verwalten.",logbook:"Deine Umbauten und Veränderungen als Foto- und Video-Chronik.",stats:"Kosten, Verbrauch und Entwicklung deiner Garage.",jobs:"Arbeitsaufträge, Stunden, Material, Zahlungen und Rechnungen.",vault:"Rechnungen, ABEs und Fahrzeugunterlagen lokal archivieren.",reminders:"Termine und Kilometer-Intervalle nie mehr verpassen.",profile:"Ein öffentliches Fahrzeugprofil mit eigenem Share-Link.",more:"Backup und selten benötigte Funktionen."};
  $("pageTitle").textContent=titles[view]||"MyGarage"; $("pageSub").textContent=subs[view]||"";
  $("sidebar").classList.remove("open");
  refreshSelectors();
  renderLogbook();
  renderLists();
  renderStats();
  renderVault();
  renderReminderManager();
  renderPublicProfile();
  syncSidebarGroups(view);
}
document.querySelectorAll(".nav[data-view]").forEach(b=>b.onclick=()=>{show(b.dataset.view);if(b.dataset.view==="spots")setTimeout(initSpotsView,40);if(b.dataset.view==="jobs")setTimeout(initJobsView,20);if(b.dataset.view==="profile")setTimeout(loadProfileSlug,20);if(b.dataset.view==="more")setTimeout(loadInvoiceSettings,20)});
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>show(b.dataset.go));
$("mobileMenu").onclick=()=>$("sidebar").classList.toggle("open");

function refreshSelectors(){
  const ids=["globalCar","serviceCar","legalCar","fuelCar","buildCar","logCar","logFilterCar","vaultCar","vaultFilter","reminderCar","reminderFilter","profileCar"];
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


let pendingVinData=null;
function normalizeVin(v){return String(v||"").toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g,"").slice(0,17)}
function bestVehicleDbMatch(d){
  if(!d)return null;
  const make=(d.make||"").toLowerCase(), model=(d.model||"").toLowerCase(), year=+d.year||0;
  const candidates=VEHICLE_DB.filter(v=>{
    const vm=(v.make||"").toLowerCase(), vmod=(v.model||"").toLowerCase();
    const makeOk=vm===make || vm.includes(make) || make.includes(vm);
    const modelOk=vmod===model || vmod.includes(model) || model.includes(vmod);
    return makeOk&&modelOk;
  });
  if(!candidates.length)return null;
  return candidates.sort((a,b)=>{
    const ay=Math.abs((+a.year||year)-year), by=Math.abs((+b.year||year)-year);
    return ay-by;
  })[0]||null;
}
function renderVinFacts(d){
  const box=$("vinDecodeFacts");if(!box)return;
  if(!d){box.innerHTML="";return}
  const rows=[
    ["Hersteller",d.make],["Modell",d.model],["Modelljahr",d.year],
    ["Baureihe",d.series],["Karosserie",d.body],["Kraftstoff",d.fuel],
    ["Motor",d.engineLiters?`${d.engineLiters} l${d.cylinders?` · ${d.cylinders} Zyl.`:""}`:d.engineModel],
    ["Antrieb",d.drive],["Werk", [d.plantCity,d.plantCountry].filter(Boolean).join(", ")]
  ].filter(x=>x[1]);
  box.innerHTML=rows.map(x=>`<div class="vin-fact"><small>${esc(x[0])}</small><strong>${esc(x[1])}</strong></div>`).join("");
}
async function decodeCurrentVin(){
  const vin=normalizeVin($("carVin").value);$("carVin").value=vin;
  const status=$("vinDecodeStatus"),btn=$("decodeVinBtn");
  if(vin.length!==17){status.textContent="VIN muss genau 17 Zeichen haben.";status.className="vin-status bad";return}
  if(!window.myGarageDesktop?.decodeVin){status.textContent="VIN-Decoding ist nur in der Windows-App verfügbar.";status.className="vin-status bad";return}
  btn.disabled=true;btn.textContent="Analysiere…";status.textContent="VIN wird analysiert …";status.className="vin-status loading";renderVinFacts(null);
  try{
    const r=await window.myGarageDesktop.decodeVin(vin,$("carYear").value);
    if(!r?.ok){status.textContent=r?.error||"VIN konnte nicht decodiert werden.";status.className="vin-status bad";return}
    pendingVinData=r.data||{};
    renderVinFacts(pendingVinData);
    const d=pendingVinData,match=bestVehicleDbMatch(d);
    if(d.make)$("carMake").value=d.make;
    if(d.model)$("carModel").value=d.model;
    if(d.year)$("carYear").value=d.year;
    if(d.fuel)$("carFuel").value=d.fuel;
    if(d.series&&!$("carVariant").value)$("carVariant").value=d.series;
    if(match){
      if(!$("carVariant").value||$("carVariant").value===d.series)$("carVariant").value=match.variant||d.series||"";
      $("carPower").value=match.power||$("carPower").value;
      $("carTorque").value=match.torque||$("carTorque").value;
      $("carFuel").value=match.fuel||d.fuel||$("carFuel").value;
      $("carGearbox").value=match.gearbox||$("carGearbox").value;
      $("vehicleSearch").value=vehicleLabel(match);
      await loadExampleImageForVehicle(match,0);
      status.textContent="VIN erkannt · JIGGY-Datenbank hat passende Fahrzeugdaten ergänzt.";
    }else{
      const pseudo={make:d.make||"",model:d.model||"",variant:d.series||"",year:d.year||0,imageQuery:[d.make,d.model,d.year].filter(Boolean).join(" ")};
      if(d.make||d.model)await loadExampleImageForVehicle(pseudo,0);
      status.textContent="VIN erkannt. Nicht alle technischen Daten sind für dieses Fahrzeug verfügbar.";
    }
    status.className="vin-status good";toast("VIN erfolgreich decodiert");
  }catch(e){status.textContent="VIN-Abfrage fehlgeschlagen.";status.className="vin-status bad"}
  finally{btn.disabled=false;btn.textContent="VIN decodieren"}
}
$("decodeVinBtn")?.addEventListener("click",decodeCurrentVin);
$("carVin")?.addEventListener("input",e=>{e.target.value=normalizeVin(e.target.value);e.target.classList.toggle("vin-complete",e.target.value.length===17)});
$("carVin")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();decodeCurrentVin()}});

async function fileData(file){
  if(!file)return"";
  if(file.size>3_000_000)throw new Error("Bild zu groß");
  return new Promise((res,rej)=>{let r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})
}

let editingCarId=null;
function resetCarEditor(){
  editingCarId=null;$("carForm")?.reset();pendingExampleImage=null;pendingVehicle=null;pendingVinData=null;renderVinFacts(null);
  if($("vinDecodeStatus"))$("vinDecodeStatus").textContent="Noch keine VIN geprüft.";setExamplePreview(null,"Wähle ein Fahrzeug aus der Datenbank.");
  if($("carFormTitle"))$("carFormTitle").textContent="Fahrzeug hinzufügen";if($("carSubmitBtn"))$("carSubmitBtn").textContent="Fahrzeug speichern";if($("cancelCarEdit"))$("cancelCarEdit").hidden=true;
}
window.editCar=id=>{
  const c=car(id);if(!c)return;editingCarId=id;state.activeCarId=id;
  $("carVin").value=c.vin||"";$("carMake").value=c.make||"";$("carModel").value=c.model||"";$("carVariant").value=c.variant||"";$("carYear").value=c.year||"";$("carKm").value=c.km||"";$("carPower").value=c.power||"";$("carTorque").value=c.torque||"";$("carFuel").value=c.fuel||"";$("carGearbox").value=c.gearbox||"";$("carPurchase").value=c.purchase||"";$("carPlate").value=c.plate||"";
  pendingVinData=c.vinData||null;renderVinFacts(pendingVinData);pendingExampleImage=c.exampleImage?{url:c.exampleImage,sourceUrl:c.exampleImageSource||"",license:c.exampleImageLicense||"",artist:c.exampleImageArtist||""}:null;
  setExamplePreview(pendingExampleImage,c.exampleImage?"Gespeichertes Beispielbild":"Kein Beispielbild gespeichert.");
  if($("carFormTitle"))$("carFormTitle").textContent="Fahrzeug bearbeiten";if($("carSubmitBtn"))$("carSubmitBtn").textContent="Änderungen speichern";if($("cancelCarEdit"))$("cancelCarEdit").hidden=false;
  show("cars");document.querySelector("#carsView")?.scrollIntoView({behavior:"smooth",block:"start"});
};
$("cancelCarEdit")?.addEventListener("click",resetCarEditor);

$("carForm").onsubmit=async e=>{
  e.preventDefault();
  const oldCar=editingCarId?car(editingCarId):null;
  let image=oldCar?.image||"";const selected=$("carImage").files[0];if(selected){try{image=await fileData(selected)}catch{return alert("Bild bitte kleiner als 3 MB wählen.")}}
  const ex=pendingExampleImage||{};
  const c={id:oldCar?.id||uid(),vin:normalizeVin($("carVin")?.value),vinData:pendingVinData||oldCar?.vinData||null,make:$("carMake").value.trim(),model:$("carModel").value.trim(),variant:$("carVariant").value.trim(),year:+$("carYear").value||0,km:+$("carKm").value||0,power:+$("carPower").value||0,torque:+$("carTorque").value||0,fuel:$("carFuel").value.trim(),gearbox:$("carGearbox").value.trim(),purchase:+$("carPurchase").value||0,plate:$("carPlate").value.trim(),image,exampleImage:ex.url||oldCar?.exampleImage||"",exampleImageSource:ex.sourceUrl||oldCar?.exampleImageSource||"",exampleImageLicense:ex.license||oldCar?.exampleImageLicense||"",exampleImageArtist:ex.artist||oldCar?.exampleImageArtist||"",exampleImageQuery:(pendingVehicle?.imageQuery||oldCar?.exampleImageQuery||vehicleLabel(pendingVehicle||{make:$("carMake").value,model:$("carModel").value,variant:$("carVariant").value}))};
  if(oldCar){const i=state.cars.findIndex(x=>x.id===oldCar.id);state.cars[i]=c}else state.cars.push(c);
  state.activeCarId=c.id;save();const wasEdit=!!oldCar;resetCarEditor();toast(wasEdit?"Fahrzeug aktualisiert":"Fahrzeug gespeichert");render();if(!wasEdit)show("home")
};
$("serviceDate").value=today();$("fuelDate").value=today();$("legalDate").value=today();

$("serviceForm").onsubmit=e=>{
  e.preventDefault();if(!state.cars.length)return alert("Bitte zuerst ein Fahrzeug anlegen.");
  const id=$("serviceCar").value;
  state.service.push({id:uid(),carId:id,type:$("serviceType").value,date:$("serviceDate").value,km:+$("serviceKm").value||0,cost:+$("serviceCost").value||0,nextKm:+$("serviceNextKm").value||0,note:$("serviceNote").value.trim()});
  let c=car(id);if(c&&+$("serviceKm").value>+c.km)c.km=+$("serviceKm").value;
  save();e.target.reset();$("serviceDate").value=today();toast("Service gespeichert");render()
};
let editingLegalId=null;
function syncLegalType(){const hu=$("legalType")?.value==="HU";if($("huFields"))$("huFields").hidden=!hu;if($("abeFields"))$("abeFields").hidden=hu}
$("legalType")?.addEventListener("change",syncLegalType);syncLegalType();
function resetLegalEditor(){
  editingLegalId=null;
  $("legalForm")?.reset();
  if($("legalDate"))$("legalDate").value=today();
  if($("legalSubmitBtn"))$("legalSubmitBtn").textContent="TÜV / ABE speichern";
  if($("legalCancelEdit"))$("legalCancelEdit").hidden=true;
  if($("legalType"))$("legalType").disabled=false;
  syncLegalType();
}
function editLegal(id){
  const x=state.legal.find(v=>v.id===id);if(!x)return;
  editingLegalId=id;
  $("legalCar").value=x.carId||state.activeCarId||"";
  $("legalType").value=x.type==="HU"?"HU":"ABE";
  $("legalType").disabled=true;
  syncLegalType();
  if(x.type==="HU"){
    $("legalDate").value=x.date||today();
    $("legalKm").value=x.km||"";
    $("legalHuResult").value=x.result||x.status||"Bestanden";
    $("legalNextDate").value=x.nextDate||"";
    $("legalNumber").value=x.number||"";
  }else{
    $("legalPart").value=x.part||"";
    $("legalStatus").value=x.status||"ABE vorhanden";
    $("legalNumber").value=x.number||"";
  }
  if($("legalSubmitBtn"))$("legalSubmitBtn").textContent="Änderungen speichern";
  if($("legalCancelEdit"))$("legalCancelEdit").hidden=false;
  $("legalForm")?.scrollIntoView({behavior:"smooth",block:"center"});
}
window.editLegal=editLegal;
$("legalCancelEdit")?.addEventListener("click",resetLegalEditor);

$("legalForm").onsubmit=e=>{
  e.preventDefault();if(!state.cars.length)return alert("Bitte zuerst ein Fahrzeug anlegen.");
  const type=$("legalType")?.value||"ABE",carId=$("legalCar").value;
  let entry=editingLegalId?state.legal.find(x=>x.id===editingLegalId):null;
  if(type==="HU"){
    const km=+$("legalKm").value||0;
    const data={carId,type:"HU",part:"TÜV / HU",date:$("legalDate").value||today(),km,result:$("legalHuResult").value,nextDate:$("legalNextDate").value,number:$("legalNumber").value.trim(),status:$("legalHuResult").value};
    if(entry)Object.assign(entry,data);else state.legal.push({id:uid(),...data});
    const c=car(carId);if(c&&km>+c.km)c.km=km;
  }else{
    const part=$("legalPart").value.trim();if(!part)return toast("Bitte Teil / Umbau eintragen","warn");
    const data={carId,type:"ABE",part,status:$("legalStatus").value,number:$("legalNumber").value.trim()};
    if(entry)Object.assign(entry,data);else state.legal.push({id:uid(),...data});
  }
  const wasEdit=!!entry;
  save();resetLegalEditor();toast(wasEdit?"Eintrag aktualisiert":(type==="HU"?"TÜV / HU gespeichert":"ABE / Eintragung gespeichert"));render()
};
function fuelUnitPrice(cost,liters){
  const c=Number(cost||0),l=Number(liters||0);
  return l>0?c/l:0;
}
function fuelPriceText(v){
  return Number(v||0).toLocaleString("de-DE",{minimumFractionDigits:3,maximumFractionDigits:3})+" €/l";
}
function fuelVoucherBalanceText(v){return money(Number(v||0))}
function fuelVoucherById(id){return (state.fuelVouchers||[]).find(x=>x.id===id)||null}

function refreshFuelVoucherSelect(){
  const el=$("fuelVoucher");if(!el)return;
  const old=el.value;
  const rows=[...(state.fuelVouchers||[])].filter(x=>Number(x.balance||0)>0);
  el.innerHTML='<option value="">Kein Gutschein</option>'+rows.map(x=>`<option value="${esc(x.id)}">${esc(x.provider||"Gutschein")} · ${money(x.balance||0)}</option>`).join("");
  if(rows.some(x=>x.id===old))el.value=old;
  renderFuelVoucherHint();
}
function renderFuelVoucherHint(){
  const hint=$("fuelVoucherHint"),v=fuelVoucherById($("fuelVoucher")?.value);
  if(!hint)return;
  hint.textContent=v
    ? `${v.provider||"Gutschein"}: ${money(v.balance||0)} Restguthaben${v.expiry?` · gültig bis ${fmtDate(v.expiry)}`:""}`
    : "Optional. Das Restguthaben wird beim Speichern automatisch reduziert.";
}
function updateFuelCalculatedPrice(){
  const out=$("fuelCalculatedPrice");if(!out)return;
  const p=fuelUnitPrice($("fuelCost")?.value,$("fuelLiters")?.value);
  out.textContent=p?fuelPriceText(p):"–";
}
$("fuelCost")?.addEventListener("input",updateFuelCalculatedPrice);
$("fuelLiters")?.addEventListener("input",updateFuelCalculatedPrice);
$("fuelVoucher")?.addEventListener("change",()=>{
  renderFuelVoucherHint();
  const v=fuelVoucherById($("fuelVoucher").value);
  if(v){
    const cost=Number($("fuelCost")?.value||0);
    $("fuelVoucherAmount").value=Math.min(cost||0,Number(v.balance||0)).toFixed(2);
  }
});

$("fuelForm").onsubmit=async e=>{
  e.preventDefault();
  if(!state.cars.length)return alert("Bitte zuerst ein Fahrzeug anlegen.");

  const id=$("fuelCar").value,
        km=+$("fuelKm").value||0,
        liters=+$("fuelLiters").value||0,
        cost=+$("fuelCost").value||0,
        file=$("fuelReceipt")?.files?.[0];

  let receipt=null;
  if(file){
    if(file.size>15*1024*1024)return toast("Tankbeleg ist größer als 15 MB","warn");
    try{receipt=await vaultPut(file)}
    catch(err){console.error(err);return toast("Tankbeleg konnte nicht gespeichert werden","warn")}
  }

  const voucherId=$("fuelVoucher")?.value||"";
  const voucher=fuelVoucherById(voucherId);
  let voucherAmount=Number($("fuelVoucherAmount")?.value||0);

  if(voucher){
    voucherAmount=Math.max(0,Math.min(voucherAmount,cost,Number(voucher.balance||0)));
    voucher.balance=Math.round((Number(voucher.balance||0)-voucherAmount)*100)/100;
    voucher.updated=Date.now();
  }else{
    voucherAmount=0;
  }

  const unitPrice=fuelUnitPrice(cost,liters);

  state.fuel.push({
    id:uid(),
    carId:id,
    date:$("fuelDate").value,
    km,
    liters,
    cost,
    fuelType:$("fuelType")?.value||"",
    station:$("fuelStation")?.value.trim()||"",
    unitPrice,
    voucherId:voucher?.id||"",
    voucherProvider:voucher?.provider||"",
    voucherAmount,
    cashAmount:Math.max(0,Math.round((cost-voucherAmount)*100)/100),
    receiptFileId:receipt?.id||"",
    receiptFileName:receipt?.name||"",
    receiptFileType:receipt?.type||"",
    receiptFileSize:receipt?.size||0
  });

  let c=car(id);
  if(c&&km>+c.km)c.km=km;

  save();
  e.target.reset();
  $("fuelDate").value=today();
  $("fuelVoucherAmount").value="0";
  updateFuelCalculatedPrice();
  refreshFuelVoucherSelect();
  toast(receipt?"Tankung + Beleg gespeichert":"Tankung gespeichert");
  render();
};

$("fuelPriceDate") && ($("fuelPriceDate").value=today());
$("fuelPriceForm")?.addEventListener("submit",e=>{
  e.preventDefault();
  const station=$("fuelPriceStation").value.trim();
  const price=Number($("fuelPriceValue").value);
  if(!station||!Number.isFinite(price)||price<=0)return toast("Bitte Tankstelle und gültigen Preis eintragen","warn");
  state.fuelPrices=state.fuelPrices||[];
  state.fuelPrices.push({
    id:uid(),
    station,
    fuelType:$("fuelPriceType").value,
    price,
    location:$("fuelPriceLocation").value.trim(),
    date:$("fuelPriceDate").value||today(),
    created:Date.now()
  });
  save();e.target.reset();$("fuelPriceDate").value=today();toast("Tankpreis gespeichert");renderFuelHub()
});

$("fuelVoucherForm")?.addEventListener("submit",e=>{
  e.preventDefault();
  const provider=$("fuelVoucherProvider").value.trim();
  const balance=Number($("fuelVoucherBalance").value);
  if(!provider||!Number.isFinite(balance)||balance<0)return toast("Bitte Anbieter und gültiges Guthaben eintragen","warn");
  state.fuelVouchers=state.fuelVouchers||[];
  state.fuelVouchers.push({
    id:uid(),
    provider,
    name:$("fuelVoucherName").value.trim(),
    initialBalance:balance,
    balance,
    expiry:$("fuelVoucherExpiry").value||"",
    code:$("fuelVoucherCode").value.trim(),
    note:$("fuelVoucherNote").value.trim(),
    created:Date.now()
  });
  save();e.target.reset();toast("Tankgutschein gespeichert");renderFuelHub()
});

window.delFuelPrice=id=>{
  state.fuelPrices=(state.fuelPrices||[]).filter(x=>x.id!==id);save();renderFuelHub()
};
window.delFuelVoucher=id=>{
  const used=(state.fuel||[]).some(x=>x.voucherId===id);
  if(used&&!confirm("Dieser Gutschein wurde bereits bei Tankungen verwendet. Trotzdem aus der Gutscheinliste löschen?"))return;
  state.fuelVouchers=(state.fuelVouchers||[]).filter(x=>x.id!==id);save();renderFuelHub()
};

function renderFuelHub(){
  const c=car();
  const prices=[...(state.fuelPrices||[])].sort((a,b)=>(b.date||"").localeCompare(a.date||"")||(b.created||0)-(a.created||0));
  const vouchers=[...(state.fuelVouchers||[])].sort((a,b)=>(Number(b.balance||0)-Number(a.balance||0)));

  const priceList=$("fuelPriceList");
  if(priceList){
    priceList.innerHTML=prices.length?prices.map(x=>`
      <div class="fuel-price-card">
        <div>
          <small>${esc(x.fuelType||"Kraftstoff")}</small>
          <strong>${esc(x.station)}</strong>
          <span>${[x.location,fmtDate(x.date)].filter(Boolean).map(esc).join(" · ")}</span>
        </div>
        <div class="fuel-price-value">
          <b>${fuelPriceText(x.price)}</b>
          <button class="mini danger" type="button" onclick="delFuelPrice('${x.id}')">Löschen</button>
        </div>
      </div>`).join(""):'<div class="empty">Noch keine Tankpreise gespeichert.</div>';
  }

  const voucherList=$("fuelVoucherList");
  if(voucherList){
    voucherList.innerHTML=vouchers.length?vouchers.map(x=>{
      const initial=Number(x.initialBalance||x.balance||0),bal=Number(x.balance||0);
      const pct=initial>0?Math.max(0,Math.min(100,Math.round(bal/initial*100))):0;
      const expired=x.expiry && x.expiry<today();
      return `<div class="fuel-voucher-card ${expired?"expired":""}">
        <div class="fuel-voucher-top">
          <div><small>${expired?"ABGELAUFEN":"TANKGUTSCHEIN"}</small><strong>${esc(x.provider||"Gutschein")}${x.name?` · ${esc(x.name)}`:""}</strong><span>${[x.expiry?`bis ${fmtDate(x.expiry)}`:"",x.code?`Code ${esc(x.code)}`:""].filter(Boolean).join(" · ")}</span></div>
          <b>${money(bal)}</b>
        </div>
        <div class="fuel-voucher-progress"><i style="width:${pct}%"></i></div>
        ${x.note?`<p>${esc(x.note)}</p>`:""}
        <button class="mini danger" type="button" onclick="delFuelVoucher('${x.id}')">Löschen</button>
      </div>`;
    }).join(""):'<div class="empty">Noch keine Tankgutscheine gespeichert.</div>';
  }

  const lastFuel=[...(state.fuel||[])].filter(x=>!c||x.carId===c.id).sort((a,b)=>(b.date||"").localeCompare(a.date||""))[0];
  if($("fuelHubLastPrice"))$("fuelHubLastPrice").textContent=lastFuel&&fuelUnitPrice(lastFuel.cost,lastFuel.liters)?fuelPriceText(fuelUnitPrice(lastFuel.cost,lastFuel.liters)):"–";
  if($("fuelHubVoucherTotal"))$("fuelHubVoucherTotal").textContent=money(vouchers.reduce((s,x)=>s+Number(x.balance||0),0));

  refreshFuelVoucherSelect();
}


// ---------------------------------------------------------
// JIGGY 2.1.6 — TankPuls Livepreise
// ---------------------------------------------------------
let fuelLiveCoords=null;
let fuelLiveStations=[];

function fuelLiveSignalLabel(signal){
  return {
    low:"Günstig",
    avg:"Durchschnitt",
    high:"Teuer",
    xhigh:"Sehr teuer"
  }[signal]||"";
}
function fuelLiveSignalClass(signal){
  return signal==="low"?"good":(signal==="high"||signal==="xhigh"?"bad":"warn");
}
function fuelLiveTypeKey(){
  return String($("fuelLiveType")?.value||"Diesel").toLowerCase();
}
function fuelLivePrettyFuel(){
  const x=$("fuelLiveType")?.value||"Diesel";
  return x==="E5"?"Super E5":x==="E10"?"Super E10":"Diesel";
}
function fuelLiveTime(value){
  if(!value)return "–";
  try{
    return new Date(value).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});
  }catch{return "–"}
}
function renderFuelLiveResults(){
  const box=$("fuelLiveResults");
  if(!box)return;

  if(!fuelLiveStations.length){
    box.innerHTML='<div class="empty">Keine Tankstellen mit einem aktuellen Preis gefunden.</div>';
    return;
  }

  const key=fuelLiveTypeKey();

  box.innerHTML=fuelLiveStations.map((s,i)=>{
    const price=Number(s?.prices?.[key]||0);
    const signal=fuelLiveSignalLabel(s.signal);
    const open=s.open===true;
    const address=s.address||"";
    return `<div class="fuel-live-station">
      <div class="fuel-live-rank">${i+1}</div>
      <div class="fuel-live-station-main">
        <div class="fuel-live-station-title">
          <strong>${esc(s.brand||"Tankstelle")}</strong>
          <span class="status ${open?"good":"bad"}">${open?"GEÖFFNET":"GESCHLOSSEN"}</span>
          ${signal?`<span class="status ${fuelLiveSignalClass(s.signal)}">${esc(signal)}</span>`:""}
        </div>
        <span>${esc(address)}</span>
        <small>${Number(s.distance||0).toLocaleString("de-DE",{maximumFractionDigits:1})} km · gemeldet ${fuelLiveTime(s.reported_at)}</small>
      </div>
      <div class="fuel-live-price">
        <strong>${price?fuelPriceText(price):"–"}</strong>
        <button class="mini" type="button" onclick="useFuelLiveStation('${esc(s.id)}')">Tankung übernehmen</button>
      </div>
    </div>`;
  }).join("");
}

async function loadFuelLivePrices(){
  if(!fuelLiveCoords){
    return toast("Bitte zuerst deinen Standort verwenden","warn");
  }

  const stateBadge=$("fuelLiveState");
  const refresh=$("fuelLiveRefresh");
  if(stateBadge){stateBadge.textContent="LÄDT";stateBadge.className="status warn"}
  if(refresh)refresh.disabled=true;

  try{
    const q=new URLSearchParams({
      lat:String(fuelLiveCoords.lat),
      lon:String(fuelLiveCoords.lon),
      radius:String($("fuelLiveRadius")?.value||10),
      fuel:String($("fuelLiveType")?.value||"Diesel"),
      sort:String($("fuelLiveSort")?.value||"price")
    });

    const out=await authCloudRequest(`/api/fuel-prices?${q.toString()}`);
    fuelLiveStations=Array.isArray(out.stations)?out.stations:[];

    $("fuelLiveMedian").textContent=out.region?.median?fuelPriceText(out.region.median):"–";
    $("fuelLiveCount").textContent=String(fuelLiveStations.length);
    $("fuelLiveUpdated").textContent=fuelLiveTime(out.updatedAt);

    if(stateBadge){stateBadge.textContent="LIVE";stateBadge.className="status good"}
    renderFuelLiveResults();
  }catch(e){
    console.error("TankPuls load error:",e);
    fuelLiveStations=[];
    if(stateBadge){stateBadge.textContent="OFFLINE";stateBadge.className="status warn"}
    try{
      const fallback=await authCloudRequest("/api/fuel-prices/fallback");
      const prices=fallback?.prices||{};
      const cards=[
        ["Diesel",prices.diesel],
        ["Super E10",prices.e10],
        ["Super E5",prices.e5]
      ].filter(x=>Number(x[1])>0);

      if(cards.length){
        $("fuelLiveResults").innerHTML=`
          <div class="fuel-fallback-box">
            <div class="fuel-fallback-head">
              <div>
                <strong>Live-Tankstellen momentan nicht verfügbar</strong>
                <span>Als Vergleich zeigt JIGGY den aktuellen Deutschland-Durchschnitt.</span>
              </div>
              <span class="status warn">FALLBACK</span>
            </div>
            <div class="fuel-fallback-prices">
              ${cards.map(([name,price])=>`
                <div>
                  <span>${esc(name)}</span>
                  <strong>${fuelPriceText(Number(price))}</strong>
                </div>`).join("")}
            </div>
            <small>Quelle: ${esc(fallback.source||"Benzinpreis-Aktuell.de")}${fallback.updatedAt?` · Stand ${fuelLiveTime(fallback.updatedAt)}`:""}</small>
          </div>`;
        $("fuelLiveCount").textContent="–";
        $("fuelLiveMedian").textContent=prices[fuelLiveTypeKey()]?fuelPriceText(Number(prices[fuelLiveTypeKey()])):"–";
        return;
      }
    }catch(fallbackError){
      console.error("Fuel fallback error:",fallbackError);
    }

    $("fuelLiveResults").innerHTML=`
      <div class="fuel-live-error">
        <strong>Tankpreise momentan nicht verfügbar</strong>
        <span>Auch der Ersatzanbieter konnte gerade keine Preisdaten liefern. Deine Tankungen, Gutscheine und manuell gespeicherten Preise funktionieren weiterhin.</span>
      </div>`;
  }finally{
    if(refresh)refresh.disabled=false;
  }
}


async function setFuelLocationFromQuery(){
  const input=$("fuelManualLocation");
  const q=String(input?.value||"").trim();
  if(!q)return toast("Bitte PLZ oder Ort eingeben","warn");

  const btn=$("fuelUseManualLocation");
  btn.disabled=true;
  btn.textContent="Suche …";

  try{
    const out=await authCloudRequest(`/api/geocode?q=${encodeURIComponent(q)}`);
    if(!out?.lat||!out?.lon)throw new Error("Ort wurde nicht gefunden");

    fuelLiveCoords={
      lat:Number(out.lat),
      lon:Number(out.lon)
    };

    $("fuelLocationLabel").textContent=
      `${out.label||q} · ${fuelLiveCoords.lat.toFixed(4)}, ${fuelLiveCoords.lon.toFixed(4)}`;

    await loadFuelLivePrices();
  }catch(e){
    toast(e.message||"Ort konnte nicht gefunden werden","warn");
  }finally{
    btn.disabled=false;
    btn.textContent="Suchen";
  }
}

$("fuelUseManualLocation")?.addEventListener("click",setFuelLocationFromQuery);
$("fuelManualLocation")?.addEventListener("keydown",e=>{
  if(e.key==="Enter"){
    e.preventDefault();
    setFuelLocationFromQuery();
  }
});

$("fuelUseLocation")?.addEventListener("click",()=>{
  if(!navigator.geolocation){
    return toast("Standortzugriff wird auf diesem Gerät nicht unterstützt","warn");
  }

  const btn=$("fuelUseLocation");
  btn.disabled=true;
  btn.textContent="Standort wird ermittelt …";

  navigator.geolocation.getCurrentPosition(
    pos=>{
      fuelLiveCoords={
        lat:Number(pos.coords.latitude),
        lon:Number(pos.coords.longitude)
      };
      $("fuelLocationLabel").textContent=
        `${fuelLiveCoords.lat.toFixed(4)}, ${fuelLiveCoords.lon.toFixed(4)} · Genauigkeit ca. ${Math.round(pos.coords.accuracy||0)} m`;
      btn.disabled=false;
      btn.textContent="◎ Standort aktualisieren";
      loadFuelLivePrices();
    },
    err=>{
      btn.disabled=false;
      btn.textContent="◎ Standort verwenden";
      toast(err.code===1?"Standortzugriff wurde nicht erlaubt":"Standort konnte nicht ermittelt werden","warn");
    },
    {
      enableHighAccuracy:true,
      timeout:12000,
      maximumAge:60000
    }
  );
});

$("fuelLiveRefresh")?.addEventListener("click",loadFuelLivePrices);
["fuelLiveType","fuelLiveRadius","fuelLiveSort"].forEach(id=>{
  $(id)?.addEventListener("change",()=>{
    if(fuelLiveCoords)loadFuelLivePrices();
  });
});

window.useFuelLiveStation=id=>{
  const s=fuelLiveStations.find(x=>String(x.id)===String(id));
  if(!s)return;

  const key=fuelLiveTypeKey();
  const price=Number(s?.prices?.[key]||0);

  document.querySelector('[data-fuel-tab="entries"]')?.click();

  if($("fuelStation"))$("fuelStation").value=s.brand||"";
  if($("fuelType"))$("fuelType").value=fuelLivePrettyFuel();

  // A live price is per liter. We keep the tank entry flexible:
  // once liters are entered, JIGGY can pre-fill the calculated total.
  if(price){
    $("fuelLiters")?.focus();

    const applyPrice=()=>{
      const liters=Number($("fuelLiters")?.value||0);
      if(liters>0){
        $("fuelCost").value=(liters*price).toFixed(2);
        updateFuelCalculatedPrice();
      }
    };

    $("fuelLiters")?.addEventListener("change",applyPrice,{once:true});
  }

  toast(`${s.brand||"Tankstelle"} übernommen`);
};


document.querySelectorAll("[data-fuel-tab]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll("[data-fuel-tab]").forEach(x=>x.classList.toggle("active",x===btn));
    document.querySelectorAll("[data-fuel-panel]").forEach(p=>p.classList.toggle("active",p.dataset.fuelPanel===btn.dataset.fuelTab));
    renderFuelHub();
  });
});

let editingBuildId=null;
function resetBuildForm(){
  editingBuildId=null;
  $("buildForm")?.reset();
  if($("buildSaved")) $("buildSaved").value=0;
  if($("buildSubmitBtn")) $("buildSubmitBtn").textContent="Umbau speichern";
  if($("buildCancelEdit")) $("buildCancelEdit").hidden=true;
  if($("buildCar")&&state.activeCarId) $("buildCar").value=state.activeCarId;
}
window.editBuild=id=>{
  const x=(state.builds||[]).find(v=>v.id===id);if(!x)return;
  editingBuildId=id;
  $("buildCar").value=x.carId||state.activeCarId||"";
  $("buildName").value=x.name||"";
  $("buildPrice").value=+x.price||0;
  $("buildSaved").value=+x.saved||0;
  $("buildCategory").value=x.category||"Performance";
  $("buildStatus").value=x.status||"Geplant";
  if($("buildSubmitBtn")) $("buildSubmitBtn").textContent="Änderungen speichern";
  if($("buildCancelEdit")) $("buildCancelEdit").hidden=false;
  $("buildForm")?.scrollIntoView({behavior:"smooth",block:"start"});
  $("buildSaved")?.focus();
};
$("buildCancelEdit")?.addEventListener("click",resetBuildForm);
$("buildForm").onsubmit=e=>{
  e.preventDefault();if(!state.cars.length)return alert("Bitte zuerst ein Fahrzeug anlegen.");
  const data={carId:$("buildCar").value,name:$("buildName").value.trim(),price:+$("buildPrice").value||0,saved:+$("buildSaved").value||0,category:$("buildCategory").value,status:$("buildStatus").value};
  if(data.saved>data.price&&data.price>0)data.saved=data.price;
  if(editingBuildId){
    const x=state.builds.find(v=>v.id===editingBuildId);
    if(x)Object.assign(x,data);
    save();resetBuildForm();toast("Umbau aktualisiert");render();return;
  }
  state.builds.push({id:uid(),...data,date:today()});
  save();resetBuildForm();toast("Umbau gespeichert");render()
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
async function del(type,id){
  const row=state[type]?.find(x=>x.id===id);if(type==="fuel"&&row?.receiptFileId){try{await vaultDeleteFile(row.receiptFileId)}catch{}}
  state[type]=state[type].filter(x=>x.id!==id);save();render()
}
window.del=del;
window.activate=id=>setActive(id);

function renderHome(){
  const c=car();
  $("homeCarName").textContent=c?cname(c):"Noch kein Fahrzeug";
  $("homeCarInfo").textContent=c?[c.year||"",c.plate||""].filter(Boolean).join(" · ")||"Fahrzeugdetails":"Lege dein erstes Fahrzeug an.";
  $("statKm").textContent=c?num(c.km)+" km":"—";$("statPower").textContent=c&&c.power?num(c.power)+" PS":"—";
  let next=state.service.filter(x=>c&&x.carId===c.id&&x.nextKm>+c.km).sort((a,b)=>a.nextKm-b.nextKm)[0];
  $("statService").textContent=next?num(next.nextKm)+" km":"—";
  const cost=(c?(+c.purchase||0)+state.service.filter(x=>x.carId===c.id).reduce((a,x)=>a+(+x.cost||0),0)+state.fuel.filter(x=>x.carId===c.id).reduce((a,x)=>a+(+x.cost||0),0)+state.builds.filter(x=>x.carId===c.id&&x.status==="Verbaut").reduce((a,x)=>a+(+x.price||0),0):0);
  $("statCost").textContent=money(cost);
  const hi=$("heroImage"),heroSrc=c&&(c.image||c.exampleImage);hi.innerHTML=heroSrc?`<img src="${heroSrc}" alt="">${!c.image&&c.exampleImage?`<a class="hero-credit" href="${c.exampleImageSource||'#'}" target="_blank" rel="noreferrer">Beispielbild · Wikimedia Commons</a>`:""}`:`<div class="hero-fallback"><b>JIGGY.</b><span>${c?esc(`${c.make} ${c.model}`):"YOUR CAR. YOUR STORY."}</span></div>`;
  let acts=[];
  state.service.filter(x=>c&&x.carId===c.id).forEach(x=>acts.push({d:x.date,t:x.type,s:money(x.cost)}));
  state.fuel.filter(x=>c&&x.carId===c.id).forEach(x=>acts.push({d:x.date,t:"Tankung",s:`${x.liters||0} l · ${money(x.cost)}`}));
  state.builds.filter(x=>c&&x.carId===c.id).forEach(x=>acts.push({d:x.date||"",t:x.name,s:x.status}));
  state.legal.filter(x=>c&&x.carId===c.id&&x.type==="HU").forEach(x=>acts.push({d:x.date||"",t:"TÜV / HU",s:[x.result||x.status,x.nextDate?`Nächste HU: ${fmtDate(x.nextDate)}`:""].filter(Boolean).join(" · ")}));
  acts.sort((a,b)=>(b.d||"").localeCompare(a.d||""));
  $("activityList").innerHTML=acts.length?acts.slice(0,5).map(x=>item(x.t,[x.d,x.s].filter(Boolean).join(" · "),"")).join(""):'<div class="empty">Noch keine Aktivitäten.</div>';
  const hv=$("heroVin"),he=$("heroEngine"),hh=$("heroHu");
  if(hv)hv.textContent=c?.vin?`${c.vin.slice(0,5)}••••${c.vin.slice(-4)}`:"—";
  if(he)he.textContent=c?.vinData?.engineLiters?`${c.vinData.engineLiters} l${c.vinData.cylinders?` · ${c.vinData.cylinders} Zyl.`:""}`:(c?.variant||"—");
  if(hh){
    const huRows=state.legal.filter(x=>c&&x.carId===c.id&&x.type==="HU"&&x.nextDate).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
    const hu=huRows[0];
    hh.textContent=hu?.nextDate?fmtDate(hu.nextDate):"—";
    hh.classList.toggle("hu-overdue",!!(hu?.nextDate&&hu.nextDate<today()));
  }
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
 const custom=(state.reminders||[]).filter(r=>r.carId===c.id&&!r.done).map(r=>reminderStatus(r,c)).filter(x=>x.level==="bad"||x.level==="warn").map(x=>({t:x.r.title,s:x.label,level:x.level}));
 reminders=[...custom,...reminders];
 $("reminderList").innerHTML=reminders.length?reminders.slice(0,5).map(x=>item(esc(x.t),esc(x.s),`<span class="status ${x.level}">${x.level==="bad"?"Fällig":"Bald"}</span>`)).join(""):'<div class="empty">Keine anstehenden Erinnerungen.</div>';

 const builds=state.builds.filter(x=>x.carId===c.id&&x.status!=="Verbaut");
 const n=builds[0];
 if(n){
   let saved=Math.min(+n.saved||0,+n.price||0),pct=n.price?Math.round(saved/n.price*100):0;
   $("nextBuildStatus").textContent=n.status;
   $("nextBuildCard").innerHTML=`<h4>${n.name}</h4><p>${n.category} · ${money(n.price)}</p><div class="progress-soft"><i style="width:${pct}%"></i></div><div class="save-info"><span>${money(saved)} gespart</span><span>${pct}%</span></div>`;
 }else{$("nextBuildStatus").textContent="—";$("nextBuildCard").innerHTML='<div class="empty">Kein offener Umbau. Dein Build ist aktuell komplett.</div>'}

 const fuel=state.fuel.filter(x=>x.carId===c.id).reduce((a,x)=>a+(+x.cost||0),0);
 const service=services.reduce((a,x)=>a+(+x.cost||0),0);
 const buildsCost=state.builds.filter(x=>x.carId===c.id&&x.status==="Verbaut").reduce((a,x)=>a+(+x.price||0),0);
 const purchase=+c.purchase||0;
 $("costBreakdown").innerHTML=[["Kaufpreis",purchase],["Tanken",fuel],["Service",service],["Umbauten",buildsCost],["Gesamt",purchase+fuel+service+buildsCost]].map((x,i)=>`<div class="cost-row ${i===4?"total":""}"><span>${x[0]}</span><b>${money(x[1])}</b></div>`).join("");
}
let galleryPending=false;
function repairGalleryVehicleLinks(){
  if(!state.cars.length)return null;
  const validIds=new Set(state.cars.map(c=>c.id));
  const oldActive=state.activeCarId;
  let changed=false;

  // A cloud import can replace an old local vehicle id. Older gallery rows may
  // still point at that vanished id, which makes them invisible and prevents upload.
  const staleIds=[...new Set((state.gallery||[]).map(x=>x?.carId).filter(id=>id&&!validIds.has(id)))];
  for(const staleId of staleIds){
    const rows=(state.gallery||[]).filter(x=>x?.carId===staleId);
    const target=state.cars.find(c=>rows.some(p=>typeof p.image==="string"&&p.image.startsWith("data:image/")&&p.image===c.image))
      ||(staleId===oldActive?state.cars[0]:null);
    if(!target)continue;
    for(const row of rows){row.carId=target.id;changed=true}
    if(state.activeCarId===staleId){state.activeCarId=target.id;changed=true}
  }

  if(!state.activeCarId||!validIds.has(state.activeCarId)){
    state.activeCarId=state.cars[0]?.id||null;changed=true;
  }
  if(changed)localStorage.setItem(KEY,JSON.stringify(state));
  return state.activeCarId;
}
$("galleryInput").onchange=async e=>{
 if(!state.cars.length)return alert("Bitte zuerst ein Fahrzeug anlegen.");
 repairGalleryVehicleLinks();
 const file=e.target.files?.[0];if(!file)return;
 try{
   // Remove legacy/ghost gallery rows that contain neither a local image nor a cloud media id.
   state.gallery=(state.gallery||[]).filter(x=>x.carId!==state.activeCarId||isDataImage(x.image)||!!x.imageMediaId);
   const mine=state.gallery.filter(x=>x.carId===state.activeCarId&&(isDataImage(x.image)||x.imageMediaId));
   if(mine.length>=5)return alert("Maximal 5 Bilder pro Fahrzeug.");
   const image=await fileData(file);
   state.gallery.push({id:uid(),carId:state.activeCarId,image,cover:mine.length===0});
   if(mine.length===0){let c=car(state.activeCarId);if(c)c.image=image}
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
 repairGalleryVehicleLinks();
 const carId=state.activeCarId;
 // Use the real active id directly. car() intentionally falls back to the first
 // vehicle when an id is stale, which previously made valid gallery photos invisible.
 const a=(state.gallery||[]).filter(x=>carId&&x.carId===carId&&(isDataImage(x.image)||!!x.imageMediaId));
 $("miniGallery").innerHTML=a.length?a.map(x=>`<div class="mini-photo ${x.cover?"cover":""}">${x.image?`<img src="${x.image}" alt="">`:`<div class="empty">Bild wird aus der Cloud geladen …</div>`}<div class="mini-photo-actions"><button onclick="coverPhoto('${x.id}')">${x.cover?"Titel":"Titelbild"}</button><button onclick="delPhoto('${x.id}')">×</button></div></div>`).join(""):'<div class="empty">Noch keine Bilder.</div>';
}

function renderLists(){
  const c=car();
  $("carList").innerHTML=state.cars.length?state.cars.map(x=>`<div class="vehicle-card">
    <div class="vehicle-thumb">${(x.image||x.exampleImage)?`<img src="${x.image||x.exampleImage}" alt="">`:"<span>🚗</span>"}</div>
    <div class="vehicle-main"><h4>${cname(x)}</h4><p>${[x.year?`Baujahr ${x.year}`:"",`${num(x.km)} km`,x.purchase?money(x.purchase):"",x.plate].filter(Boolean).join(" · ")}</p>${!x.image&&x.exampleImage?`<span class="example-source-badge">Beispielbild</span>`:""}</div>
    <div class="vehicle-actions">${x.id===state.activeCarId?'<span class="status good">Aktiv</span>':""}<button class="mini" onclick="activate('${x.id}')">Auswählen</button><button class="mini" onclick="editCar('${x.id}')">Bearbeiten</button><button class="mini" onclick="exportVehiclePdf('${x.id}')">PDF-Akte</button><button class="mini danger" onclick="del('cars','${x.id}')">Löschen</button></div>
  </div>`).join(""):'<div class="empty">Noch kein Fahrzeug angelegt.</div>';

  $("serviceList").innerHTML=state.service.filter(x=>c&&x.carId===c.id).sort((a,b)=>(b.date||"").localeCompare(a.date||"")).map(x=>item(x.type,[x.date,`${num(x.km)} km`,money(x.cost),x.note].filter(Boolean).join(" · "),"",`<button class="mini danger" onclick="del('service','${x.id}')">Löschen</button>`)).join("")||'<div class="empty">Noch keine Service-Einträge.</div>';

  $("legalList").innerHTML=state.legal.filter(x=>c&&x.carId===c.id).map(x=>{if(x.type==="HU"){const cls=/^Bestanden/.test(x.result||x.status)?"good":"bad";return item("TÜV / HU",[x.date,x.km?`${num(x.km)} km`:"",x.nextDate?`Nächste HU: ${x.nextDate}`:"",x.number].filter(Boolean).join(" · "),`<span class="status ${cls}">${esc(x.result||x.status||"—")}</span>`,`<button class="mini" onclick="editLegal('${x.id}')">Bearbeiten</button><button class="mini danger" onclick="del('legal','${x.id}')">Löschen</button>`)}let cls=/Eingetragen|ABE|ECE|Serie/.test(x.status)?"good":/nötig|Unbekannt/.test(x.status)?"bad":"warn";return item(x.part,[x.number].filter(Boolean).join(" · "),`<span class="status ${cls}">${x.status}</span>`,`<button class="mini" onclick="editLegal('${x.id}')">Bearbeiten</button><button class="mini danger" onclick="del('legal','${x.id}')">Löschen</button>`)}).join("")||'<div class="empty">Noch keine TÜV/ABE-Einträge.</div>';

  $("fuelList").innerHTML=state.fuel.filter(x=>c&&x.carId===c.id).sort((a,b)=>(b.date||"").localeCompare(a.date||"")).map(x=>{
    const unit=fuelUnitPrice(x.cost,x.liters);
    const details=[
      x.date,
      `${num(x.km)} km`,
      x.fuelType||"",
      x.station||"",
      `${x.liters||0} l`,
      money(x.cost),
      unit?fuelPriceText(unit):"",
      x.voucherAmount?`${money(x.voucherAmount)} Gutschein`:"",
      x.receiptFileName?`Beleg: ${esc(x.receiptFileName)}`:""
    ].filter(Boolean).join(" · ");
    return item("Tankung",details,"",`${x.receiptFileId?`<button class="mini" onclick="openFuelReceipt('${x.id}')">Beleg</button>`:""}<button class="mini danger" onclick="del('fuel','${x.id}')">Löschen</button>`);
  }).join("")||'<div class="empty">Noch keine Tankungen.</div>';

  renderFuelHub();

  $("buildList").innerHTML=state.builds.filter(x=>c&&x.carId===c.id).map(x=>{const saved=Math.min(+x.saved||0,+x.price||0),pct=x.price?Math.round(saved/(+x.price||1)*100):0;const savings=x.status!=="Verbaut"?` · ${money(saved)} gespart (${pct}%)`:"";return item(x.name,[x.category,money(x.price)].join(" · ")+savings,`<span class="status ${x.status==="Verbaut"?"good":""}">${x.status}</span>`,`<button class="mini" onclick="editBuild('${x.id}')">Bearbeiten</button><button class="mini danger" onclick="del('builds','${x.id}')">Löschen</button>`)}).join("")||'<div class="empty">Noch keine Umbauten.</div>';
}

window.openFuelReceipt=async id=>{
  const x=(state.fuel||[]).find(v=>v.id===id);if(!x?.receiptFileId)return toast("Kein Beleg gespeichert","warn");const f=await vaultGet(x.receiptFileId);if(!f)return toast("Belegdatei nicht gefunden","warn");
  const url=URL.createObjectURL(f.blob),stage=$("vaultStage");activeVaultObjectUrl=url;if((f.type||"").startsWith("image/"))stage.innerHTML=`<img src="${url}" alt="Tankbeleg">`;else if(f.type==="application/pdf"||/\.pdf$/i.test(f.name))stage.innerHTML=`<iframe src="${url}"></iframe>`;else{const a=document.createElement("a");a.href=url;a.download=f.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);return}
  $("vaultModal").classList.add("open");$("vaultModal").setAttribute("aria-hidden","false");
};

const reportEsc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function vehicleReportHtml(c){
  const service=(state.service||[]).filter(x=>x.carId===c.id).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  const fuel=(state.fuel||[]).filter(x=>x.carId===c.id).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  const legal=(state.legal||[]).filter(x=>x.carId===c.id);const builds=(state.builds||[]).filter(x=>x.carId===c.id);const logs=(state.logs||[]).filter(x=>x.carId===c.id).sort((a,b)=>(b.date||"").localeCompare(a.date||""));const docs=(state.documents||[]).filter(x=>x.carId===c.id).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  const totalService=service.reduce((a,x)=>a+(+x.cost||0),0),totalFuel=fuel.reduce((a,x)=>a+(+x.cost||0),0),totalBuild=builds.filter(x=>x.status==="Verbaut").reduce((a,x)=>a+(+x.price||0),0);
  const row=(cells)=>`<tr>${cells.map(x=>`<td>${reportEsc(x??"—")}</td>`).join("")}</tr>`;
  const table=(heads,rows,empty="Keine Einträge")=>rows.length?`<table><thead><tr>${heads.map(h=>`<th>${reportEsc(h)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`:`<p class="empty">${empty}</p>`;
  const title=reportEsc(cname(c));
  return `<!doctype html><html><head><meta charset="utf-8"><title>JIGGY Fahrzeugakte - ${title}</title><style>
  @page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;margin:0;font-size:10px}header{border-bottom:3px solid #e1262f;padding:0 0 14px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-end}.brand{font-size:28px;font-weight:900}.brand i{color:#e1262f;font-style:normal}h1{font-size:22px;margin:0 0 4px}h2{font-size:15px;margin:22px 0 8px;border-bottom:1px solid #ddd;padding-bottom:5px}p{margin:3px 0}.meta{color:#666}.facts{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.fact{border:1px solid #ddd;border-radius:7px;padding:8px}.fact b{display:block;font-size:13px}.fact span{color:#666;font-size:8px;text-transform:uppercase}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:10px}.sum{background:#f3f3f3;padding:8px;border-radius:7px}.sum b{display:block;font-size:12px}table{width:100%;border-collapse:collapse;margin:5px 0 12px;font-size:9px}th{background:#f2f2f2;text-align:left;padding:6px;border:1px solid #ddd}td{padding:6px;border:1px solid #ddd;vertical-align:top}.empty{color:#777;font-style:italic}.foot{margin-top:24px;padding-top:8px;border-top:1px solid #ddd;color:#777;font-size:8px}.avoid{break-inside:avoid} </style></head><body>
  <header><div><div class="brand">JIGGY<i>.</i></div><div class="meta">Your car. Your story. - Fahrzeugakte</div></div><div class="meta">Export: ${new Date().toLocaleDateString("de-DE")}</div></header>
  <h1>${title}</h1><p class="meta">${reportEsc(c.plate||"Ohne Kennzeichen")}${c.vin?` · VIN ${reportEsc(c.vin)}`:""}</p>
  <h2>Fahrzeugdaten</h2><div class="facts">${[["Baujahr",c.year],["Kilometerstand",`${num(c.km)} km`],["Leistung",`${num(c.power)} PS`],["Drehmoment",`${num(c.torque)} Nm`],["Kraftstoff",c.fuel],["Getriebe",c.gearbox],["Kennzeichen",c.plate],["Kaufpreis",c.purchase?money(c.purchase):"—"]].map(x=>`<div class="fact"><b>${reportEsc(x[1]||"—")}</b><span>${reportEsc(x[0])}</span></div>`).join("")}</div>
  <div class="summary">${[["Servicekosten",money(totalService)],["Tankkosten",money(totalFuel)],["Umbauten",money(totalBuild)],["Dokumente",docs.length]].map(x=>`<div class="sum"><b>${reportEsc(x[1])}</b><span>${reportEsc(x[0])}</span></div>`).join("")}</div>
  <section><h2>Servicehistorie</h2>${table(["Datum","km","Arbeit","Kosten","Nächster Service","Notiz"],service.map(x=>row([x.date,num(x.km),x.type,money(x.cost),x.nextKm?`${num(x.nextKm)} km`:"—",x.note])) )}</section>
  <section><h2>Tankhistorie</h2>${table(["Datum","km","Liter","Kosten","Beleg"],fuel.map(x=>row([x.date,num(x.km),x.liters?`${num(x.liters)} l`:"—",money(x.cost),x.receiptFileName||"—"])))}</section>
  <section><h2>TÜV / ABE / Eintragungen</h2>${table(["Teil / Umbau","Status","Nummer / Hinweis"],legal.map(x=>row([x.type==="HU"?"TÜV / HU":x.part,x.type==="HU"?[x.result||x.status,x.date,x.km?`${num(x.km)} km`:"",x.nextDate?`Nächste HU ${x.nextDate}`:""].filter(Boolean).join(" · "):x.status,x.number])))}</section>
  <section><h2>Umbauten</h2>${table(["Umbau","Kategorie","Status","Preis","Datum"],builds.map(x=>row([x.name,x.category,x.status,money(x.price),x.date||"—"])))}</section>
  <section><h2>Logbuch</h2>${table(["Datum","Kategorie","Titel","Beschreibung"],logs.map(x=>row([x.date,x.category,x.title,x.text])))}</section>
  <section><h2>Dokumentenübersicht</h2>${table(["Datum","Kategorie","Titel","Datei","Betrag","Notiz"],docs.map(x=>row([x.date,x.category,x.title,x.fileName,x.amount?money(x.amount):"—",x.note])))}</section>
  <div class="foot">Diese JIGGY-Fahrzeugakte wurde aus den lokal gespeicherten Angaben erzeugt. Beleg- und Dokumentdateien werden aus Datenschutzgründen nicht in das PDF eingebettet; vorhandene Dateien sind in der Übersicht aufgeführt.</div>
  </body></html>`;
}
window.exportVehiclePdf=async id=>{const c=car(id);if(!c)return toast("Fahrzeug nicht gefunden","warn");if(!window.myGarageDesktop?.saveVehiclePdf)return toast("PDF-Export ist in dieser Version nicht verfügbar","warn");try{const r=await window.myGarageDesktop.saveVehiclePdf({html:vehicleReportHtml(c),suggestedName:`JIGGY-${c.make||"Fahrzeug"}-${c.model||""}-Fahrzeugakte.pdf`});if(r?.ok)toast("Fahrzeugakte als PDF gespeichert");else if(!r?.canceled)toast(r?.error||"PDF konnte nicht gespeichert werden","warn")}catch(e){console.error(e);toast("PDF-Export fehlgeschlagen","warn")}};

/* ===== JIGGY 1.7 — VAULT / REMINDERS / PUBLIC PROFILE ===== */
const VAULT_DB="jiggy.vault.v1",VAULT_STORE="documents",CLOUD_KEY="jiggy.cloud.v1",PROFILE_KEY="jiggy.profile.v1";

function vaultDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(VAULT_DB,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(VAULT_STORE))db.createObjectStore(VAULT_STORE,{keyPath:"id"})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function vaultPut(file){const db=await vaultDb(),id=uid();await new Promise((resolve,reject)=>{const tx=db.transaction(VAULT_STORE,"readwrite");tx.objectStore(VAULT_STORE).put({id,name:file.name,type:file.type||"application/octet-stream",size:file.size,blob:file,created:Date.now()});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();return{id,name:file.name,type:file.type||"",size:file.size}}
async function vaultGet(id){const db=await vaultDb();const out=await new Promise((resolve,reject)=>{const r=db.transaction(VAULT_STORE,"readonly").objectStore(VAULT_STORE).get(id);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)});db.close();return out}
async function vaultDeleteFile(id){const db=await vaultDb();await new Promise((resolve,reject)=>{const tx=db.transaction(VAULT_STORE,"readwrite");tx.objectStore(VAULT_STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close()}
const bytes=v=>{const n=+v||0;if(n<1024)return`${n} B`;if(n<1048576)return`${(n/1024).toFixed(1)} KB`;return`${(n/1048576).toFixed(1)} MB`};

$("vaultDate")&&($("vaultDate").value=today());
$("vaultForm")?.addEventListener("submit",async e=>{
  e.preventDefault();const file=$("vaultFile").files?.[0];if(!file)return toast("Bitte eine Datei auswählen","warn");
  if(file.size>25*1024*1024)return toast("Datei ist größer als 25 MB","warn");
  if(!$("vaultCar").value)return toast("Bitte zuerst ein Fahrzeug anlegen","warn");
  try{
    const f=await vaultPut(file);
    state.documents=state.documents||[];
    state.documents.push({id:uid(),carId:$("vaultCar").value,category:$("vaultCategory").value,title:$("vaultTitle").value.trim(),date:$("vaultDate").value||today(),amount:+$("vaultAmount").value||0,note:$("vaultNote").value.trim(),fileId:f.id,fileName:f.name,fileType:f.type,fileSize:f.size,created:Date.now()});
    save();e.target.reset();$("vaultDate").value=today();toast("Dokument sicher im Vault gespeichert");renderVault()
  }catch(err){console.error(err);toast("Dokument konnte nicht gespeichert werden","warn")}
});
const vaultDrop=$("vaultDrop");
if(vaultDrop){
  ["dragenter","dragover"].forEach(ev=>vaultDrop.addEventListener(ev,e=>{e.preventDefault();vaultDrop.classList.add("drag")}));
  ["dragleave","drop"].forEach(ev=>vaultDrop.addEventListener(ev,e=>{e.preventDefault();vaultDrop.classList.remove("drag")}));
  vaultDrop.addEventListener("drop",e=>{const f=e.dataTransfer?.files?.[0];if(!f)return;const dt=new DataTransfer();dt.items.add(f);$("vaultFile").files=dt.files;$("vaultTitle").value||=f.name.replace(/\.[^.]+$/,"");});
  vaultDrop.addEventListener("click",()=>$("vaultFile").click());
}
$("vaultSearch")?.addEventListener("input",renderVault);$("vaultCategoryFilter")?.addEventListener("change",renderVault);$("vaultFilter")?.addEventListener("change",renderVault);
function renderVault(){
  const box=$("vaultList");if(!box)return;
  const carId=$("vaultFilter")?.value||state.activeCarId,q=($("vaultSearch")?.value||"").toLowerCase().trim(),cat=$("vaultCategoryFilter")?.value||"";
  const rows=(state.documents||[]).filter(x=>(!carId||x.carId===carId)&&(!cat||x.category===cat)&&(!q||`${x.title} ${x.category} ${x.fileName} ${x.note}`.toLowerCase().includes(q))).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  box.innerHTML=rows.length?rows.map(x=>`<article class="vault-doc">
    <div class="vault-icon">${/pdf/i.test(x.fileType||x.fileName)?"PDF":/image/i.test(x.fileType)?"IMG":"DOC"}</div>
    <div class="vault-doc-main"><span>${esc(x.category)}</span><strong>${esc(x.title)}</strong><small>${[fmtDate(x.date),x.amount?money(x.amount):"",esc(x.fileName),bytes(x.fileSize)].filter(Boolean).join(" · ")}</small>${x.note?`<p>${esc(x.note)}</p>`:""}</div>
    <div class="vault-doc-actions"><button class="mini" onclick="openVaultDoc('${x.id}')">Öffnen</button><button class="mini danger" onclick="deleteVaultDoc('${x.id}')">Löschen</button></div>
  </article>`).join(""):'<div class="log-empty">Noch keine Dokumente für dieses Fahrzeug.</div>';
}
window.openVaultDoc=async id=>{
  const meta=(state.documents||[]).find(x=>x.id===id),f=meta&&await vaultGet(meta.fileId);if(!f)return toast("Datei nicht gefunden","warn");
  const url=URL.createObjectURL(f.blob),stage=$("vaultStage");
  if((f.type||"").startsWith("image/"))stage.innerHTML=`<img src="${url}" alt="">`;
  else if(f.type==="application/pdf"||/\.pdf$/i.test(f.name))stage.innerHTML=`<iframe src="${url}"></iframe>`;
  else{const a=document.createElement("a");a.href=url;a.download=f.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);return}
  $("vaultModal").classList.add("open");$("vaultModal").setAttribute("aria-hidden","false");
};
let activeVaultObjectUrl="";
function closeVault(){const modal=$("vaultModal"),stage=$("vaultStage");modal?.classList.remove("open");modal?.setAttribute("aria-hidden","true");if(stage)stage.innerHTML="";if(activeVaultObjectUrl){URL.revokeObjectURL(activeVaultObjectUrl);activeVaultObjectUrl=""}}
window.closeVault=closeVault;
$("vaultClose")?.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();closeVault()});$("vaultModal")?.addEventListener("click",e=>{if(e.target===$("vaultModal"))closeVault()});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("vaultModal")?.classList.contains("open"))closeVault()});
window.deleteVaultDoc=async id=>{const x=(state.documents||[]).find(v=>v.id===id);if(!x||!confirm(`"${x.title}" wirklich löschen?`))return;try{await vaultDeleteFile(x.fileId)}catch{}state.documents=state.documents.filter(v=>v.id!==id);save();toast("Dokument gelöscht","warn");renderVault()};

/* Reminders */
function reminderStatus(r,c){
  const now=new Date();now.setHours(0,0,0,0);let level="good",parts=[],days=null,kmLeft=null;
  if(r.dueDate){const d=new Date(r.dueDate+"T12:00:00");days=Math.ceil((d-now)/86400000);if(days<0){level="bad";parts.push(`${Math.abs(days)} Tag${Math.abs(days)===1?"":"e"} überfällig`)}else if(days===0){level="bad";parts.push("heute fällig")}else if(days<=30){level="warn";parts.push(`in ${days} Tagen`)}else parts.push(fmtDate(r.dueDate))}
  if(+r.dueKm>0&&c){kmLeft=(+r.dueKm||0)-(+c.km||0);if(kmLeft<=0){level="bad";parts.push(`${num(Math.abs(kmLeft))} km überfällig`)}else if(kmLeft<=3000&&level!=="bad"){level="warn";parts.push(`in ${num(kmLeft)} km`)}else parts.push(`bei ${num(r.dueKm)} km`)}
  return{r,level,label:parts.join(" · ")||"Ohne Fälligkeit",days,kmLeft}
}
$("reminderForm")?.addEventListener("submit",e=>{
  e.preventDefault();if(!$("reminderCar").value)return toast("Bitte zuerst ein Fahrzeug anlegen","warn");
  state.reminders=state.reminders||[];state.reminders.push({id:uid(),carId:$("reminderCar").value,title:$("reminderTitle").value.trim(),category:$("reminderCategory").value,dueDate:$("reminderDate").value,dueKm:+$("reminderKm").value||0,note:$("reminderNote").value.trim(),notify:$("reminderNotify").checked,done:false,created:Date.now()});
  save();e.target.reset();$("reminderNotify").checked=true;toast("Erinnerung gespeichert");render()
});
$("reminderFilter")?.addEventListener("change",renderReminderManager);
function renderReminderManager(){
  const box=$("reminderManagerList");if(!box)return;const carId=$("reminderFilter")?.value||state.activeCarId,c=car(carId);
  const rows=(state.reminders||[]).filter(x=>!carId||x.carId===carId).map(x=>reminderStatus(x,car(x.carId))).sort((a,b)=>Number(a.r.done)-Number(b.r.done)||({bad:0,warn:1,good:2}[a.level]-{bad:0,warn:1,good:2}[b.level]));
  box.innerHTML=rows.length?rows.map(x=>`<article class="reminder-row ${x.r.done?"done":x.level}">
    <div class="reminder-mark"></div><div class="reminder-main"><span>${esc(x.r.category)}</span><strong>${esc(x.r.title)}</strong><small>${esc(x.label)}</small>${x.r.note?`<p>${esc(x.r.note)}</p>`:""}</div>
    <div class="reminder-actions">${x.r.done?'<span class="status good">Erledigt</span>':`<span class="status ${x.level}">${x.level==="bad"?"Fällig":x.level==="warn"?"Bald":"Geplant"}</span>`}<button class="mini" onclick="toggleReminder('${x.r.id}')">${x.r.done?"Reaktivieren":"Erledigt"}</button><button class="mini danger" onclick="deleteReminder('${x.r.id}')">×</button></div>
  </article>`).join(""):'<div class="log-empty">Noch keine eigenen Erinnerungen.</div>';
}
window.toggleReminder=id=>{const r=(state.reminders||[]).find(x=>x.id===id);if(!r)return;r.done=!r.done;save();render();};
window.deleteReminder=id=>{if(!confirm("Erinnerung löschen?"))return;state.reminders=(state.reminders||[]).filter(x=>x.id!==id);save();render()};
async function checkReminderNotifications(){
  if(!window.myGarageDesktop?.notify)return;
  const stampKey="jiggy.reminder.notify.v1",sent=JSON.parse(localStorage.getItem(stampKey)||"{}"),now=Date.now();let changed=false;
  for(const r of state.reminders||[]){
    if(r.done||!r.notify)continue;const st=reminderStatus(r,car(r.carId));if(st.level!=="bad"&&st.level!=="warn")continue;
    const last=+sent[r.id]||0;if(now-last<20*60*60*1000)continue;
    await window.myGarageDesktop.notify(`JIGGY · ${r.title}`,`${cname(car(r.carId))} · ${st.label}`);sent[r.id]=now;changed=true;
  }
  if(changed)localStorage.setItem(stampKey,JSON.stringify(sent));
}
setTimeout(checkReminderNotifications,1800);setInterval(checkReminderNotifications,60*60*1000);

/* JIGGY 2.0 beta 4 · Account, two-way sync & Media Storage */
const ACCOUNT_KEY="jiggy.account.v1", CLOUD_MAP_KEY="jiggy.cloud.vehicle-map.v1", CLOUD_SYNC_META_KEY="jiggy.cloud.sync-meta.v1";
const ACCOUNT_OWNER_KEY="jiggy.local.owner.v1", ACCOUNT_ISOLATION_KEY="jiggy.account.isolation.v1", ACCOUNT_CACHE_PREFIX="jiggy.account.cache.v1.";
let accountMode="login";
function accountSession(){try{return JSON.parse(localStorage.getItem(ACCOUNT_KEY)||"{}")||{}}catch{return{}}}
function saveAccountSession(v){localStorage.setItem(ACCOUNT_KEY,JSON.stringify(v||{}))}
function cloudMap(){try{return JSON.parse(localStorage.getItem(CLOUD_MAP_KEY)||"{}")||{}}catch{return{}}}
function saveCloudMap(v){localStorage.setItem(CLOUD_MAP_KEY,JSON.stringify(v||{}))}
function syncMeta(){try{return JSON.parse(localStorage.getItem(CLOUD_SYNC_META_KEY)||"{}")||{}}catch{return{}}}
function saveSyncMeta(v){localStorage.setItem(CLOUD_SYNC_META_KEY,JSON.stringify(v||{}))}
function accountCacheKey(userId){return ACCOUNT_CACHE_PREFIX+String(userId||"")}
function saveCurrentAccountCache(userId){
  if(!userId)return;
  try{localStorage.setItem(accountCacheKey(userId),JSON.stringify({state,cloudMap:cloudMap(),syncMeta:syncMeta(),mediaMap:cloudMediaMap()}))}catch(e){console.warn("Account cache save",e)}
}
function restoreAccountCache(userId){
  try{
    const raw=localStorage.getItem(accountCacheKey(userId));
    if(!raw)return false;
    const x=JSON.parse(raw)||{};
    state=x.state&&typeof x.state==="object"?x.state:blank();
    localStorage.setItem(KEY,JSON.stringify(state));
    saveCloudMap(x.cloudMap||{});saveSyncMeta(x.syncMeta||{});saveCloudMediaMap(x.mediaMap||{});
    return true;
  }catch(e){console.warn("Account cache restore",e);return false}
}
function clearActiveGarageState(){
  state=blank();
  localStorage.setItem(KEY,JSON.stringify(state));
  saveCloudMap({});saveSyncMeta({});saveCloudMediaMap({});
}
function switchLocalGarageToAccount(user){
  const nextId=user?.id;if(!nextId)return;
  const currentOwner=localStorage.getItem(ACCOUNT_OWNER_KEY)||"";
  const isolated=localStorage.getItem(ACCOUNT_ISOLATION_KEY)==="1";
  if(!isolated){
    // First run of account isolation: assign the existing local garage to the currently authenticated account.
    localStorage.setItem(ACCOUNT_ISOLATION_KEY,"1");
    localStorage.setItem(ACCOUNT_OWNER_KEY,nextId);
    saveCurrentAccountCache(nextId);
    return;
  }
  if(currentOwner===nextId)return;
  if(currentOwner)saveCurrentAccountCache(currentOwner);
  clearActiveGarageState();
  restoreAccountCache(nextId);
  localStorage.setItem(ACCOUNT_OWNER_KEY,nextId);
  render();
}
function logoutLocalAccount(){
  const owner=localStorage.getItem(ACCOUNT_OWNER_KEY)||accountSession().user?.id||"";
  if(owner)saveCurrentAccountCache(owner);
  clearActiveGarageState();
  localStorage.removeItem(ACCOUNT_OWNER_KEY);
  saveAccountSession({});
  render();
}
async function authCloudRequest(path,options={}){
  const session=accountSession();
  if(!session.token)throw new Error("Bitte zuerst anmelden");
  const headers={...(options.headers||{}),Authorization:`Bearer ${session.token}`};
  return cloudRequest(path,{...options,headers});
}
function setAccountMessage(text,type=""){const el=$("accountMessage");if(el){el.textContent=text;el.className="cloud-message "+type}}
function setImportMessage(text,type=""){const el=$("cloudImportStatus");if(el){el.textContent=text;el.className="cloud-message "+type}}
function setCloudConnectionState(state){
  const el=$("cloudConnectionBadge");if(!el)return;
  const states={online:["● JIGGY Cloud verbunden","online"],offline:["● JIGGY Cloud offline","offline"],checking:["● Cloud wird geprüft","checking"],syncing:["● JIGGY Cloud synchronisiert","checking"]};
  const [text,cls]=states[state]||states.checking;el.textContent=text;el.className="cloud-connection "+cls;
}
async function checkCloudConnection(){setCloudConnectionState("checking");try{await cloudRequest("/health");setCloudConnectionState("online");return true}catch{setCloudConnectionState("offline");return false}}
function setAccountMode(mode){
  accountMode=mode;const reg=mode==="register";
  $("accountNameWrap") && ($("accountNameWrap").hidden=!reg);
  if($("accountSubmit"))$("accountSubmit").textContent=reg?"Account erstellen":"Anmelden";
  $("accountLoginTab")?.classList.toggle("active",!reg);$("accountRegisterTab")?.classList.toggle("active",reg);
  if($("accountPassword"))$("accountPassword").autocomplete=reg?"new-password":"current-password";
  setAccountMessage(reg?"Erstelle deinen JIGGY Account direkt auf deinem eigenen Server.":"Melde dich an, um deine private Cloud-Garage zu öffnen.");
}
function renderAccount(user=null){
  const session=accountSession(),logged=!!session.token;
  if($("accountLoggedOut"))$("accountLoggedOut").hidden=logged;if($("accountLoggedIn"))$("accountLoggedIn").hidden=!logged;
  const badge=$("accountStateBadge");if(badge){badge.textContent=logged?"Angemeldet":"Nicht angemeldet";badge.classList.toggle("online",logged)}
  const u=user||session.user;if(logged&&u){if($("accountUserName"))$("accountUserName").textContent=u.displayName||"JIGGY User";if($("accountUserEmail"))$("accountUserEmail").textContent=u.email||""}
}
const CLOUD_MEDIA_MAP_KEY="jiggy.cloud.media-map.v1";
function cloudMediaMap(){try{return JSON.parse(localStorage.getItem(CLOUD_MEDIA_MAP_KEY)||"{}")||{}}catch{return{}}}
function saveCloudMediaMap(v){localStorage.setItem(CLOUD_MEDIA_MAP_KEY,JSON.stringify(v||{}))}
function isDataImage(v){return typeof v==="string"&&v.startsWith("data:image/")}
function dataUrlToFile(dataUrl,name="vehicle.jpg"){
  const [head,data]=dataUrl.split(","),mime=(head.match(/data:([^;]+)/)||[])[1]||"image/jpeg",bytes=atob(data),arr=new Uint8Array(bytes.length);for(let i=0;i<bytes.length;i++)arr[i]=bytes.charCodeAt(i);
  const ext=mime.includes("png")?"png":mime.includes("webp")?"webp":mime.includes("heic")?"heic":mime.includes("heif")?"heif":"jpg";
  return new File([arr],name.replace(/\.[^.]+$/,"")+"."+ext,{type:mime});
}
async function uploadVehicleCover(localId,cloudId,image){
  if(!isDataImage(image)||!cloudId)return null;
  const fd=new FormData();fd.append("file",dataUrlToFile(image,`jiggy-${localId}.jpg`));fd.append("mediaType","vehicle-cover");fd.append("vehicleId",cloudId);
  const out=await authCloudRequest("/api/media",{method:"POST",body:fd});return out.media||null;
}
async function downloadMediaDataUrl(mediaId){
  if(!mediaId)return"";const session=accountSession();const r=await fetch(JIGGY_CLOUD.apiUrl+`/api/media/${encodeURIComponent(mediaId)}`,{headers:{Authorization:`Bearer ${session.token}`}});if(!r.ok)throw new Error(`Media HTTP ${r.status}`);const blob=await r.blob();return await new Promise((ok,bad)=>{const fr=new FileReader();fr.onload=()=>ok(fr.result);fr.onerror=bad;fr.readAsDataURL(blob)});
}
async function ensureCloudCover(c,cloudId){
  if(!c||!cloudId||!isDataImage(c.image))return null;const mm=cloudMediaMap(),fp=`${c.image.length}:${c.image.slice(-64)}`,known=mm[c.id];if(known?.fingerprint===fp&&known?.mediaId)return known.mediaId;
  const media=await uploadVehicleCover(c.id,cloudId,c.image);if(!media?.id)return null;mm[c.id]={mediaId:media.id,fingerprint:fp};saveCloudMediaMap(mm);return media.id;
}
function galleryMediaMapKey(photoId){return `gallery:${photoId}`}
async function uploadGalleryImage(photo,cloudId){
  if(!photo||!cloudId||!isDataImage(photo.image))return null;
  const fd=new FormData();fd.append("file",dataUrlToFile(photo.image,`jiggy-gallery-${photo.id}.jpg`));fd.append("mediaType","gallery");fd.append("vehicleId",cloudId);
  const out=await authCloudRequest("/api/media",{method:"POST",body:fd});return out.media||null;
}
async function ensureCloudGallery(c,cloudId){
  if(!c||!cloudId)return;
  repairGalleryVehicleLinks();
  const mm=cloudMediaMap(),photos=(state.gallery||[]).filter(x=>x&&x.carId===c.id);
  let changed=false;
  for(const photo of photos){
    if(!isDataImage(photo.image))continue;
    const key=galleryMediaMapKey(photo.id),fp=`${photo.image.length}:${photo.image.slice(-64)}`,known=mm[key];
    if(known?.fingerprint===fp&&known?.mediaId){if(photo.imageMediaId!==known.mediaId){photo.imageMediaId=known.mediaId;changed=true}continue}
    try{
      const media=await uploadGalleryImage(photo,cloudId);
      if(media?.id){mm[key]={mediaId:media.id,fingerprint:fp};photo.imageMediaId=media.id;changed=true}
    }catch(e){console.warn("Gallery upload",photo.id,e)}
  }
  saveCloudMediaMap(mm);
  if(changed)localStorage.setItem(KEY,JSON.stringify(state));
}
function fuelReceiptMediaMapKey(fuelId){return `fuel-receipt:${fuelId}`}
async function uploadFuelReceipt(row,cloudId,fileRow){
  if(!row||!cloudId||!fileRow?.blob)return null;
  const file=new File([fileRow.blob],fileRow.name||row.receiptFileName||`jiggy-receipt-${row.id}`,{type:fileRow.type||row.receiptFileType||"application/octet-stream"});
  const fd=new FormData();fd.append("file",file);fd.append("mediaType","fuel-receipt");fd.append("vehicleId",cloudId);
  const out=await authCloudRequest("/api/media",{method:"POST",body:fd});return out.media||null;
}
async function ensureCloudFuelReceipts(c,cloudId){
  if(!c||!cloudId)return;
  const mm=cloudMediaMap(),rows=(state.fuel||[]).filter(x=>x&&x.carId===c.id&&x.receiptFileId);
  let changed=false;
  for(const row of rows){
    try{
      const local=await vaultGet(row.receiptFileId);if(!local?.blob)continue;
      const key=fuelReceiptMediaMapKey(row.id),fp=`${local.name||""}:${local.type||""}:${local.size||local.blob.size||0}:${local.created||0}`,known=mm[key];
      if(known?.fingerprint===fp&&known?.mediaId){if(row.receiptMediaId!==known.mediaId){row.receiptMediaId=known.mediaId;changed=true}continue}
      const media=await uploadFuelReceipt(row,cloudId,local);
      if(media?.id){mm[key]={mediaId:media.id,fingerprint:fp};row.receiptMediaId=media.id;changed=true}
    }catch(e){console.warn("Fuel receipt upload",row.id,e)}
  }
  saveCloudMediaMap(mm);
  if(changed)localStorage.setItem(KEY,JSON.stringify(state));
}
async function downloadMediaBlob(mediaId){
  if(!mediaId)return null;const session=accountSession();const r=await fetch(JIGGY_CLOUD.apiUrl+`/api/media/${encodeURIComponent(mediaId)}`,{headers:{Authorization:`Bearer ${session.token}`}});if(!r.ok)throw new Error(`Media HTTP ${r.status}`);return await r.blob();
}
async function restoreFuelReceiptFromCloud(row){
  if(!row?.receiptMediaId)return row;
  if(row.receiptFileId){try{const existing=await vaultGet(row.receiptFileId);if(existing?.blob)return row}catch{}}
  const blob=await downloadMediaBlob(row.receiptMediaId);
  if(!blob)return row;
  const name=row.receiptFileName||`Tankbeleg-${row.id}${blob.type==="application/pdf"?".pdf":""}`;
  const file=new File([blob],name,{type:row.receiptFileType||blob.type||"application/octet-stream"});
  const saved=await vaultPut(file);
  row.receiptFileId=saved.id;row.receiptFileName=saved.name;row.receiptFileType=saved.type;row.receiptFileSize=saved.size;
  const mm=cloudMediaMap();mm[fuelReceiptMediaMapKey(row.id)]={mediaId:row.receiptMediaId,fingerprint:`${saved.name||""}:${saved.type||""}:${saved.size||0}:0`};saveCloudMediaMap(mm);
  return row;
}

function documentMediaMapKey(docId){return `document:${docId}`}
async function uploadVaultDocument(row,cloudId,fileRow){
  if(!row||!cloudId||!fileRow?.blob)return null;
  const file=new File([fileRow.blob],fileRow.name||row.fileName||`jiggy-document-${row.id}`,{type:fileRow.type||row.fileType||"application/octet-stream"});
  const fd=new FormData();fd.append("file",file);fd.append("mediaType","document");fd.append("vehicleId",cloudId);
  const out=await authCloudRequest("/api/media",{method:"POST",body:fd});return out.media||null;
}
async function ensureCloudDocuments(c,cloudId){
  if(!c||!cloudId)return;
  const mm=cloudMediaMap(),rows=(state.documents||[]).filter(x=>x&&x.carId===c.id&&x.fileId);
  let changed=false;
  for(const row of rows){
    try{
      const local=await vaultGet(row.fileId);if(!local?.blob)continue;
      const key=documentMediaMapKey(row.id),fp=`${local.name||""}:${local.type||""}:${local.size||local.blob.size||0}:${local.created||0}`,known=mm[key];
      if(known?.fingerprint===fp&&known?.mediaId){if(row.fileMediaId!==known.mediaId){row.fileMediaId=known.mediaId;changed=true}continue}
      const media=await uploadVaultDocument(row,cloudId,local);
      if(media?.id){mm[key]={mediaId:media.id,fingerprint:fp};row.fileMediaId=media.id;changed=true}
    }catch(e){console.warn("Document upload",row.id,e)}
  }
  saveCloudMediaMap(mm);
  if(changed)localStorage.setItem(KEY,JSON.stringify(state));
}
async function restoreDocumentFromCloud(row){
  if(!row?.fileMediaId)return row;
  if(row.fileId){try{const existing=await vaultGet(row.fileId);if(existing?.blob)return row}catch{}}
  const blob=await downloadMediaBlob(row.fileMediaId);
  if(!blob)return row;
  const name=row.fileName||`JIGGY-Dokument-${row.id}`;
  const file=new File([blob],name,{type:row.fileType||blob.type||"application/octet-stream"});
  const saved=await vaultPut(file);
  row.fileId=saved.id;row.fileName=saved.name;row.fileType=saved.type;row.fileSize=saved.size;
  const mm=cloudMediaMap();mm[documentMediaMapKey(row.id)]={mediaId:row.fileMediaId,fingerprint:`${saved.name||""}:${saved.type||""}:${saved.size||0}:0`};saveCloudMediaMap(mm);
  return row;
}

function logMediaMapKey(logId,itemId){return `log:${logId}:${itemId}`}
async function uploadLogMedia(logRow,item,cloudId,fileRow){
  if(!logRow||!item||!cloudId||!fileRow?.blob)return null;
  const file=new File([fileRow.blob],fileRow.name||item.name||`jiggy-log-${item.id}`,{type:fileRow.type||item.type||"application/octet-stream"});
  const fd=new FormData();fd.append("file",file);fd.append("mediaType","logbook");fd.append("vehicleId",cloudId);
  const out=await authCloudRequest("/api/media",{method:"POST",body:fd});return out.media||null;
}
async function ensureCloudLogMedia(c,cloudId){
  if(!c||!cloudId)return;
  const mm=cloudMediaMap(),rows=(state.logs||[]).filter(x=>x&&x.carId===c.id);
  let changed=false;
  for(const row of rows){
    for(const item of (row.media||[])){
      try{
        if(!item?.id)continue;
        const local=await mediaGet(item.id);if(!local?.blob)continue;
        const key=logMediaMapKey(row.id,item.id),fp=`${local.name||""}:${local.type||""}:${local.size||local.blob.size||0}:${local.created||0}`,known=mm[key];
        if(known?.fingerprint===fp&&known?.mediaId){
          if(item.mediaId!==known.mediaId){item.mediaId=known.mediaId;changed=true}
          continue;
        }
        const media=await uploadLogMedia(row,item,cloudId,local);
        if(media?.id){mm[key]={mediaId:media.id,fingerprint:fp};item.mediaId=media.id;changed=true}
      }catch(e){console.warn("Logbook media upload",row.id,item?.id,e)}
    }
  }
  saveCloudMediaMap(mm);
  if(changed)localStorage.setItem(KEY,JSON.stringify(state));
}
async function restoreLogMediaFromCloud(logRow){
  for(const item of (logRow?.media||[])){
    if(!item?.mediaId)continue;
    if(item.id){try{const existing=await mediaGet(item.id);if(existing?.blob)continue}catch{}}
    try{
      const blob=await downloadMediaBlob(item.mediaId);if(!blob)continue;
      const name=item.name||`JIGGY-Logbuch-${item.id}`;
      const file=new File([blob],name,{type:item.type||blob.type||"application/octet-stream"});
      const saved=await mediaPut(file);
      const oldId=item.id;
      item.id=saved.id;item.name=saved.name;item.type=saved.type;item.size=saved.size;
      const mm=cloudMediaMap();mm[logMediaMapKey(logRow.id,item.id)]={mediaId:item.mediaId,fingerprint:`${saved.name||""}:${saved.type||""}:${saved.size||0}:0`};
      if(oldId&&oldId!==item.id)delete mm[logMediaMapKey(logRow.id,oldId)];
      saveCloudMediaMap(mm);
    }catch(e){console.warn("Logbook media download",logRow.id,item?.id,e)}
  }
  return logRow;
}
function vehicleCloudBundle(c,mediaId=null){
  const id=c.id,own=x=>x&&x.carId===id,cloudCar={...c};
  if(isDataImage(cloudCar.image))cloudCar.image="";
  if(mediaId)cloudCar.imageMediaId=mediaId;else{const known=cloudMediaMap()[id]?.mediaId;if(known)cloudCar.imageMediaId=known}
  const gallery=(state.gallery||[]).filter(own).map(x=>{const y={...x};if(isDataImage(y.image))y.image="";const known=cloudMediaMap()[galleryMediaMapKey(y.id)]?.mediaId;if(!y.imageMediaId&&known)y.imageMediaId=known;return y});
  return{schemaVersion:8,localCarId:id,car:cloudCar,service:(state.service||[]).filter(own),legal:(state.legal||[]).filter(own),fuel:(state.fuel||[]).filter(own).map(x=>{const y={...x};const known=cloudMediaMap()[fuelReceiptMediaMapKey(y.id)]?.mediaId;if(!y.receiptMediaId&&known)y.receiptMediaId=known;return y}),builds:(state.builds||[]).filter(own),gallery,logs:(state.logs||[]).filter(own).map(row=>({...row,media:(row.media||[]).map(item=>{const y={...item};const known=cloudMediaMap()[logMediaMapKey(row.id,y.id)]?.mediaId;if(!y.mediaId&&known)y.mediaId=known;return y})})),documents:(state.documents||[]).filter(own).map(x=>{const y={...x};const known=cloudMediaMap()[documentMediaMapKey(y.id)]?.mediaId;if(!y.fileMediaId&&known)y.fileMediaId=known;return y}),reminders:(state.reminders||[]).filter(own)};
}
function bundleFingerprint(bundle){
  const clean={...bundle};delete clean.syncedAt;
  return JSON.stringify(clean);
}
async function applyCloudBundle(bundle){
  if(!bundle?.car)return null;
  const c={...bundle.car};const id=c.id||bundle.localCarId||uid();c.id=id;
  if(c.imageMediaId&&!c.image){try{c.image=await downloadMediaDataUrl(c.imageMediaId);const mm=cloudMediaMap();mm[id]={mediaId:c.imageMediaId,fingerprint:`${c.image.length}:${c.image.slice(-64)}`};saveCloudMediaMap(mm)}catch(e){console.warn("Cover download",e)}}
  const i=state.cars.findIndex(x=>x.id===id);if(i>=0)state.cars[i]=c;else state.cars.push(c);
  for(const key of ["service","legal","builds","reminders"]){
    state[key]=(state[key]||[]).filter(x=>x.carId!==id);
    const rows=Array.isArray(bundle[key])?bundle[key].map(x=>({...x,carId:id})):[];state[key].push(...rows);
  }
  const localFuelBefore=(state.fuel||[]).filter(x=>x.carId===id);
  state.fuel=(state.fuel||[]).filter(x=>x.carId!==id);
  const fuelRows=Array.isArray(bundle.fuel)?bundle.fuel.map(x=>({...x,carId:id})):[];
  const localFuelById=new Map(localFuelBefore.map(x=>[x.id,x]));
  for(const row of fuelRows){
    const local=localFuelById.get(row.id);
    // Never discard a local receipt that has not reached cloud media yet.
    if(local?.receiptFileId&&!row.receiptMediaId){row.receiptFileId=local.receiptFileId;row.receiptFileName=local.receiptFileName;row.receiptFileType=local.receiptFileType;row.receiptFileSize=local.receiptFileSize}
    if(row.receiptMediaId){try{await restoreFuelReceiptFromCloud(row)}catch(e){console.warn("Fuel receipt download",row.id,e)}}
    state.fuel.push(row);
  }
  for(const local of localFuelBefore){if(!fuelRows.some(x=>x.id===local.id))state.fuel.push(local)}
  const localLogsBefore=(state.logs||[]).filter(x=>x.carId===id);
  state.logs=(state.logs||[]).filter(x=>x.carId!==id);
  const logRows=Array.isArray(bundle.logs)?bundle.logs.map(x=>({...x,carId:id})):[];
  const localLogsById=new Map(localLogsBefore.map(x=>[x.id,x]));
  for(const row of logRows){
    const local=localLogsById.get(row.id);
    if(local?.media?.length){
      const cloudMediaById=new Map((row.media||[]).map(x=>[x.id,x]));
      for(const lm of local.media){
        const cm=cloudMediaById.get(lm.id);
        if(cm){if(!cm.mediaId&&lm.mediaId)cm.mediaId=lm.mediaId}
        else (row.media||(row.media=[])).push(lm);
      }
    }
    try{await restoreLogMediaFromCloud(row)}catch(e){console.warn("Logbook restore",row.id,e)}
    state.logs.push(row);
  }
  for(const local of localLogsBefore){if(!logRows.some(x=>x.id===local.id))state.logs.push(local)}
  const localDocumentsBefore=(state.documents||[]).filter(x=>x.carId===id);
  state.documents=(state.documents||[]).filter(x=>x.carId!==id);
  const documentRows=Array.isArray(bundle.documents)?bundle.documents.map(x=>({...x,carId:id})):[];
  const localDocumentsById=new Map(localDocumentsBefore.map(x=>[x.id,x]));
  for(const row of documentRows){
    const local=localDocumentsById.get(row.id);
    // Never discard a local Vault file that has not reached cloud media yet.
    if(local?.fileId&&!row.fileMediaId){row.fileId=local.fileId;row.fileName=local.fileName;row.fileType=local.fileType;row.fileSize=local.fileSize}
    if(row.fileMediaId){try{await restoreDocumentFromCloud(row)}catch(e){console.warn("Document download",row.id,e)}}
    state.documents.push(row);
  }
  for(const local of localDocumentsBefore){if(!documentRows.some(x=>x.id===local.id))state.documents.push(local)}
  const localGalleryBefore=(state.gallery||[]).filter(x=>x.carId===id&&isDataImage(x.image));
  state.gallery=(state.gallery||[]).filter(x=>x.carId!==id);
  let galleryRows=Array.isArray(bundle.gallery)?bundle.gallery.map(x=>({...x,carId:id})):[];
  // Safety migration: an old/empty cloud gallery must never erase unsynced local originals.
  if(!galleryRows.some(x=>x.imageMediaId)&&localGalleryBefore.length){
    const byId=new Map(galleryRows.map(x=>[x.id,x]));
    for(const localPhoto of localGalleryBefore){
      const existing=byId.get(localPhoto.id);
      if(existing)Object.assign(existing,localPhoto,{carId:id});
      else galleryRows.push({...localPhoto,carId:id});
    }
  }
  for(const photo of galleryRows){
    if(photo.imageMediaId&&!photo.image){
      try{
        photo.image=await downloadMediaDataUrl(photo.imageMediaId);
        const mm=cloudMediaMap();mm[galleryMediaMapKey(photo.id)]={mediaId:photo.imageMediaId,fingerprint:`${photo.image.length}:${photo.image.slice(-64)}`};saveCloudMediaMap(mm);
      }catch(e){console.warn("Gallery download",photo.id,e)}
    }
    state.gallery.push(photo);
  }
  if(!state.activeCarId)state.activeCarId=id;
  return id;
}
function scheduleCloudSync(delay=1200){
  if(!accountSession().token||cloudSyncApplying)return;
  clearTimeout(cloudSyncTimer);cloudSyncTimer=setTimeout(()=>syncCloudGarage({silent:true}),delay);
}
async function syncCloudGarage({silent=false}={}){
  if(cloudSyncRunning||!accountSession().token)return;
  cloudSyncRunning=true;if(!silent)setImportMessage("Garage wird synchronisiert …");setCloudConnectionState("syncing");
  try{
    const remote=await authCloudRequest("/api/garage/vehicles"),rows=remote.vehicles||[],map=cloudMap(),meta=syncMeta();
    let pushed=0,pulled=0,created=0,conflicts=0;
    const remoteById=new Map(rows.map(r=>[r.id,r]));
    cloudSyncApplying=true;
    // Existing local vehicles: create, push, pull or detect a real two-sided conflict.
    for(const c of [...state.cars]){
      const localId=c.id;let cloudId=map[localId];let row=cloudId?remoteById.get(cloudId):null;
      if(!row){
        // Recover mappings on a new installation/device by the stable localCarId stored in the bundle.
        row=rows.find(r=>r.data?.localCarId===localId);if(row){cloudId=row.id;map[localId]=cloudId}
      }
      if(cloudId&&isDataImage(c.image))await ensureCloudCover(c,cloudId);
      if(cloudId)await ensureCloudGallery(c,cloudId);
      if(cloudId)await ensureCloudFuelReceipts(c,cloudId);
      if(cloudId)await ensureCloudDocuments(c,cloudId);
      if(cloudId)await ensureCloudLogMedia(c,cloudId);
      const localBundle=vehicleCloudBundle(c),localFp=bundleFingerprint(localBundle);
      if(!row){
        const out=await authCloudRequest("/api/garage/vehicles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...localBundle,syncedAt:new Date().toISOString()})});
        if(out.vehicle?.id){cloudId=out.vehicle.id;map[localId]=cloudId;const mediaId=await ensureCloudCover(c,cloudId);await ensureCloudGallery(c,cloudId);await ensureCloudFuelReceipts(c,cloudId);await ensureCloudDocuments(c,cloudId);await ensureCloudLogMedia(c,cloudId);const finalBundle=vehicleCloudBundle(c,mediaId);const updated=await authCloudRequest(`/api/garage/vehicles/${encodeURIComponent(cloudId)}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({...finalBundle,syncedAt:new Date().toISOString()})});meta[localId]={fingerprint:bundleFingerprint(finalBundle),cloudUpdatedAt:updated.vehicle?.updatedAt||out.vehicle.updatedAt||null};created++}continue;
      }
      const m=meta[localId]||{},remoteFp=bundleFingerprint(row.data||{}),localChanged=!!m.fingerprint&&localFp!==m.fingerprint,remoteChanged=!!m.cloudUpdatedAt&&row.updatedAt!==m.cloudUpdatedAt;
      if(!m.fingerprint){
        // First sync after  2 import: matching content establishes baseline; otherwise prefer local once.
        if(localFp===remoteFp){meta[localId]={fingerprint:localFp,cloudUpdatedAt:row.updatedAt};continue}
        await authCloudRequest(`/api/garage/vehicles/${encodeURIComponent(cloudId)}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({...localBundle,syncedAt:new Date().toISOString()})});pushed++;
        meta[localId]={fingerprint:localFp,cloudUpdatedAt:new Date().toISOString()};continue;
      }
      if(localChanged&&remoteChanged&&localFp!==remoteFp){conflicts++;continue}
      if(remoteChanged&&!localChanged){const id=await applyCloudBundle(row.data);if(id){const fp=bundleFingerprint(vehicleCloudBundle(state.cars.find(x=>x.id===id)));meta[id]={fingerprint:fp,cloudUpdatedAt:row.updatedAt};map[id]=cloudId;pulled++}continue}
      if(localChanged){const out=await authCloudRequest(`/api/garage/vehicles/${encodeURIComponent(cloudId)}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({...localBundle,syncedAt:new Date().toISOString()})});meta[localId]={fingerprint:localFp,cloudUpdatedAt:out.vehicle?.updatedAt||new Date().toISOString()};pushed++;continue}
      meta[localId]={fingerprint:localFp,cloudUpdatedAt:row.updatedAt};
    }
    // Cloud-only vehicles (e.g. created/changed on iPhone later) are imported locally.
    const mappedCloudIds=new Set(Object.values(map));
    for(const row of rows){
      if(mappedCloudIds.has(row.id))continue;
      const bundle=row.data||{};if(!bundle.car)continue;
      const id=await applyCloudBundle(bundle);if(id){map[id]=row.id;meta[id]={fingerprint:bundleFingerprint(vehicleCloudBundle(state.cars.find(x=>x.id===id))),cloudUpdatedAt:row.updatedAt};pulled++}
    }
    localStorage.setItem(KEY,JSON.stringify(state));saveCloudMap(map);saveSyncMeta(meta);cloudSyncApplying=false;
    if(pulled)render();if($("cloudVehicleCount"))$("cloudVehicleCount").textContent=String(rows.length+created);
    if(conflicts)setImportMessage(`${conflicts} Sync-Konflikt${conflicts===1?"":"e"} erkannt – nichts wurde überschrieben.`,"bad");
    else setImportMessage(`Auto-Sync aktiv · ${created+pushed} hochgeladen · ${pulled} vom Server übernommen`,"good");
    setCloudConnectionState("online");
  }catch(e){cloudSyncApplying=false;setCloudConnectionState("offline");if(!silent)setImportMessage("Sync fehlgeschlagen: "+e.message,"bad")}
  finally{cloudSyncRunning=false}
}
async function refreshCloudGarage(){try{const data=await authCloudRequest("/api/garage/vehicles");setCloudConnectionState("online");const rows=data.vehicles||[];if($("cloudVehicleCount"))$("cloudVehicleCount").textContent=String(rows.length);return rows}catch(e){await checkCloudConnection();setImportMessage("Cloud konnte nicht geladen werden: "+e.message,"bad");return[]}}
async function importLocalGarage(){setImportMessage("Starte sicheren Zwei-Wege-Sync …");await syncCloudGarage();toast("JIGGY Cloud synchronisiert")}
$("accountLoginTab")?.addEventListener("click",()=>setAccountMode("login"));
$("accountRegisterTab")?.addEventListener("click",()=>setAccountMode("register"));
$("accountForm")?.addEventListener("submit",async e=>{e.preventDefault();const btn=$("accountSubmit"),email=$("accountEmail").value.trim(),password=$("accountPassword").value,displayName=$("accountDisplayName")?.value.trim()||"";btn.disabled=true;btn.textContent=accountMode==="register"?"Erstelle …":"Anmelden …";try{const body=accountMode==="register"?{email,password,displayName}:{email,password};const out=await cloudRequest(`/api/auth/${accountMode==="register"?"register":"login"}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});switchLocalGarageToAccount(out.user);saveAccountSession({token:out.token,user:out.user});$("accountPassword").value="";renderAccount(out.user);toast(accountMode==="register"?"JIGGY Account erstellt":"Willkommen zurück");await syncCloudGarage();await refreshPublicProfileAccountState()}catch(err){setAccountMessage(err.message,"bad")}finally{btn.disabled=false;btn.textContent=accountMode==="register"?"Account erstellen":"Anmelden"}});
$("accountLogout")?.addEventListener("click",()=>{logoutLocalAccount();const p=profileConfig();saveProfileConfig({...p,profileId:"",editToken:""});renderAccount();renderPublicProfile();if($("cloudVehicleCount"))$("cloudVehicleCount").textContent="–";setAccountMode("login");toast("Abgemeldet · lokale Garage ausgeblendet","warn")});
$("cloudImport")?.addEventListener("click",()=>syncCloudGarage());
async function initJiggyAccount(){setAccountMode("login");renderAccount();await checkCloudConnection();if(!accountSession().token)return;try{const out=await authCloudRequest("/api/auth/me");switchLocalGarageToAccount(out.user);saveAccountSession({...accountSession(),user:out.user});renderAccount(out.user);await syncCloudGarage();await refreshPublicProfileAccountState()}catch(e){logoutLocalAccount();renderAccount();setAccountMessage("Sitzung abgelaufen. Bitte erneut anmelden.","bad")}}
setTimeout(initJiggyAccount,700);
setInterval(()=>{checkCloudConnection();if(accountSession().token)syncCloudGarage({silent:true})},60000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden){checkCloudConnection();if(accountSession().token)syncCloudGarage({silent:true})}});

/* Public Profile · JIGGY Cloud */
const JIGGY_CLOUD={apiUrl:"https://api.jiggy-cloud.org",baseUrl:"https://xigriffen.github.io/MyGarage/"};
function profileConfig(){try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||"{}")}catch{return{}}}
function saveProfileConfig(v){localStorage.setItem(PROFILE_KEY,JSON.stringify(v))}
async function refreshPublicProfileAccountState(){
  const p=profileConfig();
  if(!accountSession().token){saveProfileConfig({...p,profileId:"",editToken:""});renderPublicProfile();return null}
  try{
    const out=await authCloudRequest("/api/profiles/me");
    if(out.published&&out.id){
      const cloud=out.profile||{};
      saveProfileConfig({
        ...p,
        profileId:out.id,
        editToken:"",
        displayName:typeof cloud.displayName==="string"?cloud.displayName:(p.displayName||""),
        bio:typeof cloud.bio==="string"?cloud.bio:(p.bio||""),
        theme:cloud.theme||p.theme||"signature"
      });
    } else saveProfileConfig({...p,profileId:"",editToken:""});
    renderPublicProfile();return out
  }catch(e){console.error("Public profile status error:",e);return null}
}
async function publicImageData(c){
  const src=c&&(c.image||c.exampleImage);if(!src||!$("profileGallery")?.checked)return"";
  try{const img=new Image();img.src=src;await img.decode();const max=1100,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale)),cv=document.createElement("canvas");cv.width=w;cv.height=h;cv.getContext("2d").drawImage(img,0,0,w,h);return cv.toDataURL("image/jpeg",.78)}catch{return""}
}
function profilePayload(c,image=""){
  const mods=$("profileMods")?.checked?(state.builds||[]).filter(x=>x.carId===c.id&&x.status==="Verbaut").slice(0,20).map(x=>({name:x.name,category:x.category,date:x.date||""})):[];
  return{version:2,displayName:$("profileName")?.value.trim()||cname(c),bio:$("profileBio")?.value.trim()||"",theme:$("profileTheme")?.value||"signature",car:{make:c.make,model:c.model,variant:c.variant,year:c.year,image,specs:$("profileSpecs")?.checked?{power:c.power,torque:c.torque,fuel:c.fuel,gearbox:c.gearbox}:null,mileage:$("profileMileage")?.checked?c.km:null,plate:$("profilePlate")?.checked?c.plate:""},mods,updatedAt:new Date().toISOString()};
}
function loadProfileInputs(){const p=profileConfig(),c=car($("profileCar")?.value);if(!$("profileName"))return;if(!document.activeElement||!["profileName","profileBio"].includes(document.activeElement.id)){$("profileName").value=p.displayName||"";$("profileBio").value=p.bio||""}if(p.theme)$("profileTheme").value=p.theme;["Specs","Mileage","Plate","Mods","Gallery"].forEach(k=>{const el=$("profile"+k);if(el&&p["show"+k]!==undefined)el.checked=!!p["show"+k]})}
function localProfileSettings(){return{...profileConfig(),displayName:$("profileName").value.trim(),bio:$("profileBio").value.trim(),theme:$("profileTheme").value,showSpecs:$("profileSpecs").checked,showMileage:$("profileMileage").checked,showPlate:$("profilePlate").checked,showMods:$("profileMods").checked,showGallery:$("profileGallery").checked}}
function renderPublicProfile(){
  if(!$("profilePreview"))return;loadProfileInputs();const c=car($("profileCar")?.value),cfg=profileConfig();if(!c){$("profilePreview").innerHTML='<div class="log-empty">Lege zuerst ein Fahrzeug an.</div>';return}
  const mods=$("profileMods")?.checked?(state.builds||[]).filter(x=>x.carId===c.id&&x.status==="Verbaut").slice(0,4):[],img=$("profileGallery")?.checked?(c.image||c.exampleImage):"";
  $("profilePreview").innerHTML=`<div class="public-preview-shell theme-${esc($("profileTheme")?.value||"signature")}"><div class="public-preview-image">${img?`<img src="${img}" alt="">`:'<div class="profile-fallback">JIGGY.</div>'}<span>JIGGY PROFILE</span></div><div class="public-preview-copy"><small>YOUR CAR. YOUR STORY.</small><h2>${esc($("profileName")?.value.trim()||cname(c))}</h2><p>${esc($("profileBio")?.value.trim()||"Dieses Fahrzeug lebt in JIGGY.")}</p>${$("profileSpecs")?.checked?`<div class="public-specs"><b>${c.power||"—"}<span>PS</span></b><b>${c.torque||"—"}<span>NM</span></b><b>${c.year||"—"}<span>YEAR</span></b></div>`:""}${($("profileMileage")?.checked||$("profilePlate")?.checked)?`<div class="public-profile-details">${$("profileMileage")?.checked?`<span><small>KILOMETERSTAND</small><strong>${num(c.km)} km</strong></span>`:""}${$("profilePlate")?.checked?`<span><small>KENNZEICHEN</small><strong>${esc(c.plate||"—")}</strong></span>`:""}</div>`:""}${mods.length?`<div class="public-mods">${mods.map(x=>`<span>${esc(x.name)}</span>`).join("")}</div>`:""}</div></div>`;
  const published=!!accountSession().token&&!!cfg.profileId;$("profileStatusText").textContent=published?"Veröffentlicht":"Nicht veröffentlicht";$("profileStatusOrb").classList.toggle("online",published);$("copyProfileBtn").disabled=!published;$("unpublishProfileBtn").disabled=!published;if($("publishProfileBtn"))$("publishProfileBtn").textContent=published?"Änderungen speichern":"Profil veröffentlichen";
}
["profileName","profileBio","profileTheme","profileSpecs","profileMileage","profilePlate","profileMods","profileGallery"].forEach(id=>$(id)?.addEventListener(id.includes("Name")||id.includes("Bio")?"input":"change",()=>{saveProfileConfig(localProfileSettings());renderPublicProfile()}));
$("profileCar")?.addEventListener("change",renderPublicProfile);
async function cloudRequest(path,options={}){const r=await fetch(JIGGY_CLOUD.apiUrl+path,options);const text=await r.text();let data={};try{data=text?JSON.parse(text):{}}catch{}if(!r.ok)throw new Error(data.error||text.slice(0,180)||`HTTP ${r.status}`);return data}


/* JIGGY Spots V2 */
let spotsMap=null,spotsMarkers=[],spotsCache=[],spotsTypeFilter="";
let pendingSpotCoords=null,spotDraftMarker=null,spotPickMode=false;
let activeSpotDetail=null,activeSpotMedia=[],activeSpotMediaIndex=0,spotObjectUrls=[];
let activeMeetAttendance={count:0,joined:false};

function spotEsc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function spotStyle(){
  return {
    version:8,
    sources:{osm:{type:"raster",tiles:["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],tileSize:256,attribution:"© OpenStreetMap contributors"}},
    layers:[{id:"osm",type:"raster",source:"osm"}]
  };
}
function spotTypeLabel(s){return s?.spotType==="meet"?"Treffen":"Fotospot"}
function spotTypeIcon(s){return s?.spotType==="meet"?"🚗":"📸"}
function spotDateLabel(s){
  if(s?.spotType!=="meet"||!s.eventStart)return "";
  try{
    const d=new Date(s.eventStart);
    return new Intl.DateTimeFormat("de-DE",{dateStyle:"medium",timeStyle:"short"}).format(d);
  }catch{return ""}
}
// JIGGY Jobs V1
// -----------------------------------------------------------------------------
let jobsCache=[];
let jobsSummaryCache={};
let activeJobId=null;
let activeJobSnapshot=null;
let jobsInitialized=false;
let editingJobId=null;

function jobsMoney(v){return Number(v||0).toLocaleString("de-DE",{style:"currency",currency:"EUR"})}
function jobsTime(minutes){
  const m=Math.max(0,Number(minutes||0)),h=Math.floor(m/60),rest=Math.round(m%60);
  return `${h}:${String(rest).padStart(2,"0")} h`;
}
function jobsStatusLabel(s){
  return ({draft:"Entwurf",open:"Offen",in_progress:"In Arbeit",completed:"Fertig",invoiced:"Abgerechnet",paid:"Bezahlt",cancelled:"Storniert"})[s]||s||"–";
}
function jobsPaymentMethodLabel(s){
  return ({cash:"Bar",bank_transfer:"Überweisung",paypal:"PayPal",card:"Karte",other:"Sonstiges"})[s]||"";
}
function jobsEsc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function jobsModal(id,on){
  const m=$(id);if(!m)return;m.classList.toggle("open",!!on);m.setAttribute("aria-hidden",on?"false":"true");
}
function jobsRequireAccount(){
  if(accountSession().token)return true;
  $("jobsList").innerHTML='<div class="log-empty">Bitte unter „Mehr“ zuerst mit deinem JIGGY Account anmelden.</div>';
  $("jobDetail") && ($("jobDetail").hidden=true);
  $("jobDetailEmpty") && ($("jobDetailEmpty").hidden=false);
  return false;
}
async function initJobsView(){
  if(!jobsRequireAccount())return;
  if(!$("jobWorkDate").value)$("jobWorkDate").value=new Date().toISOString().slice(0,10);
  await loadJobs();
  jobsInitialized=true;
}
async function loadJobs(){
  if(!jobsRequireAccount())return;
  $("jobsList").innerHTML='<div class="log-empty">Jobs werden geladen …</div>';
  try{
    const out=await authCloudRequest("/api/jobs");
    jobsCache=out.jobs||[];
    jobsSummaryCache=out.summary||{};
    renderJobs();
    if(activeJobId && jobsCache.some(x=>x.id===activeJobId))await openJob(activeJobId);
  }catch(e){
    $("jobsList").innerHTML=`<div class="log-empty">Jobs konnten nicht geladen werden: ${jobsEsc(e.message)}</div>`;
  }
}
function filteredJobs(){
  const search=($("jobsSearch")?.value||"").trim().toLowerCase(),status=$("jobsStatusFilter")?.value||"";
  return jobsCache.filter(j=>{
    if(status&&j.status!==status)return false;
    if(!search)return true;
    const hay=[j.title,j.description,j.customer?.name,j.customer?.email,j.vehicle?.make,j.vehicle?.model,j.vehicle?.plate].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(search);
  });
}
function renderJobs(){
  const list=filteredJobs();
  $("jobsCount").textContent=`${list.length} Jobs`;
  const summary=jobsSummaryCache||{};
  $("jobsIncomeTotal").textContent=jobsMoney(summary.income||0);
  $("jobsProfitTotal").textContent=jobsMoney(summary.profit||0);
  $("jobsTipsTotal").textContent=jobsMoney(summary.tips||0);
  $("jobsOpenAmount").textContent=jobsMoney(summary.openAmount||0);
  $("jobsOpenCount").textContent=`${Number(summary.openJobs||0)} offene Jobs`;
  $("jobsPaidCount").textContent=`${Number(summary.paidJobs||0)} bezahlte Jobs`;
  if(!list.length){$("jobsList").innerHTML='<div class="log-empty">Noch keine passenden Jobs.</div>';return}
  $("jobsList").innerHTML=list.map(j=>{
    const vehicle=[j.vehicle?.make,j.vehicle?.model].filter(Boolean).join(" ")||"Fahrzeug nicht angegeben";
    return `<button class="job-row ${j.id===activeJobId?"active":""}" data-job-id="${jobsEsc(j.id)}" type="button">
      <div class="job-row-top"><strong>${jobsEsc(j.title)}</strong><span class="job-status ${jobsEsc(j.status)}">${jobsEsc(jobsStatusLabel(j.status))}</span></div>
      <span>${jobsEsc(j.customer?.name||"Ohne Kundenname")} · ${jobsEsc(vehicle)}</span>
      <small>${jobsEsc(j.vehicle?.plate||"Kein Kennzeichen")} · ${jobsMoney(j.totals?.total||0)}</small>
    </button>`;
  }).join("");
}
async function openJob(id){
  if(!id)return;activeJobId=id;renderJobs();
  $("jobDetailEmpty").hidden=true;$("jobDetail").hidden=false;
  $("jobDetailTitle").textContent="Lädt …";
  try{
    const out=await authCloudRequest(`/api/jobs/${encodeURIComponent(id)}`);
    const j=out.job||{},work=out.work||[],materials=out.materials||[],tot=out.totals||{};
    $("jobDetailTitle").textContent=j.title||"Auftrag";
    $("jobDetailStatus").textContent=jobsStatusLabel(j.status);$("jobDetailStatus").className=`job-status ${j.status||""}`;
    $("jobDetailMeta").textContent=[j.createdAt?new Date(j.createdAt).toLocaleDateString("de-DE"):"",j.description||""].filter(Boolean).join(" · ");
    $("jobCustomerName").textContent=j.customer?.name||"–";
    $("jobCustomerContact").textContent=[j.customer?.email,j.customer?.phone,j.customer?.address].filter(Boolean).join(" · ")||"Keine Kontaktdaten";
    $("jobVehicleName").textContent=[j.vehicle?.make,j.vehicle?.model].filter(Boolean).join(" ")||"–";
    $("jobVehicleInfo").textContent=[j.vehicle?.plate,j.vehicle?.vin].filter(Boolean).join(" · ")||"Keine weiteren Fahrzeugdaten";
    $("jobTotalTime").textContent=jobsTime(tot.minutes);$("jobLabor").textContent=jobsMoney(tot.labor);$("jobMaterials").textContent=jobsMoney(tot.materials);$("jobTotal").textContent=jobsMoney(tot.total);
    $("jobOrderValue").textContent=jobsMoney(tot.total);
    $("jobPaidAmount").textContent=j.payment?.paidAmount==null?"–":jobsMoney(j.payment.paidAmount);
    $("jobTipAmount").textContent=jobsMoney(tot.tip||0);
    $("jobIncome").textContent=jobsMoney(tot.income||0);
    $("jobPurchaseCost").textContent=jobsMoney(tot.purchaseCost||0);
    $("jobProfit").textContent=jobsMoney(tot.profit||0);
    $("jobPaymentState").textContent=j.payment?.paid?"Bezahlt":"Noch offen";
    $("jobPaymentCard").classList.toggle("paid",!!j.payment?.paid);
    $("jobMarkPaid").textContent=j.payment?.paid?"Zahlung bearbeiten":"✓ Als bezahlt markieren";
    $("jobPaymentMeta").textContent=j.payment?.paid?[jobsPaymentMethodLabel(j.payment.paymentMethod),j.payment.paidAt?new Date(j.payment.paidAt).toLocaleString("de-DE"):""].filter(Boolean).join(" · "):"";
    activeJobSnapshot={job:j,totals:tot,invoice:out.invoice||null};
    const createInvoiceBtn=$("jobCreateInvoice"),openInvoiceBtn=$("jobOpenInvoice");
    if(out.invoice){createInvoiceBtn.hidden=true;openInvoiceBtn.hidden=false;openInvoiceBtn.textContent=`↗ Rechnung ${out.invoice.invoiceNumber||""} öffnen`;}
    else{createInvoiceBtn.hidden=false;openInvoiceBtn.hidden=true;createInvoiceBtn.disabled=false;createInvoiceBtn.textContent="🧾 Rechnung erstellen";}
    $("jobWorkCount").textContent=`${work.length} Einträge`;$("jobMaterialCount").textContent=`${materials.length} Positionen`;
    $("jobWorkList").innerHTML=work.length?work.map(w=>`<div class="job-line"><div><strong>${jobsEsc(w.description)}</strong><span>${jobsTime(w.minutes)} · ${jobsMoney(w.hourlyRate)}/h · ${w.workDate?new Date(w.workDate).toLocaleDateString("de-DE"):""}</span></div><b>${w.billable?jobsMoney(w.amount):"nicht berechnet"}</b></div>`).join(""):'<div class="log-empty compact">Noch keine Arbeitszeit.</div>';
    $("jobMaterialList").innerHTML=materials.length?materials.map(m=>`<div class="job-line"><div><strong>${jobsEsc(m.description)}</strong><span>${Number(m.quantity).toLocaleString("de-DE")} × ${jobsMoney(m.unitPrice)}${m.partNumber?` · ${jobsEsc(m.partNumber)}`:""}</span></div><b>${m.billable?jobsMoney(m.amount):"nicht berechnet"}</b></div>`).join(""):'<div class="log-empty compact">Noch kein Material.</div>';
  }catch(e){
    $("jobDetailTitle").textContent="Fehler";
    $("jobDetailMeta").textContent=e.message;
  }
}
$("jobsList")?.addEventListener("click",e=>{const row=e.target.closest("[data-job-id]");if(row)openJob(row.dataset.jobId)});
$("jobsSearch")?.addEventListener("input",renderJobs);
$("jobsStatusFilter")?.addEventListener("change",renderJobs);
$("jobsRefresh")?.addEventListener("click",loadJobs);


function openJobEditor(job=null){
  if(!accountSession().token){
    toast("Bitte zuerst mit deinem JIGGY Account anmelden","warn");
    show("more");
    return;
  }

  $("jobCreateForm").reset();
  $("jobCreateMessage").textContent="";
  editingJobId=job?.id||null;

  if($("jobEditorTitle"))$("jobEditorTitle").textContent=editingJobId?"Auftrag bearbeiten":"Neuer Auftrag";
  if($("jobEditorSubtitle"))$("jobEditorSubtitle").textContent=editingJobId
    ?"Kunde, Fahrzeug und Auftragsdaten anpassen."
    :"Kunde und Fahrzeug können komplett frei eingetragen werden.";
  if($("jobCreateSubmit"))$("jobCreateSubmit").textContent=editingJobId?"Änderungen speichern":"Auftrag erstellen";

  if(job){
    $("jobCustomerInput").value=job.customer?.name||"";
    $("jobCustomerEmail").value=job.customer?.email||"";
    $("jobCustomerPhone").value=job.customer?.phone||"";
    $("jobCustomerAddress").value=job.customer?.address||"";

    $("jobVehicleMake").value=job.vehicle?.make||"";
    $("jobVehicleModel").value=job.vehicle?.model||"";
    $("jobVehiclePlate").value=job.vehicle?.plate||"";
    $("jobVehicleVin").value=job.vehicle?.vin||"";

    $("jobTitleInput").value=job.title||"";
    $("jobDescriptionInput").value=job.description||"";
    $("jobNotesInput").value=job.notes||"";
  }

  jobsModal("jobCreateModal",true);
}

$("jobCreateOpen")?.addEventListener("click",()=>openJobEditor());
$("jobEditOpen")?.addEventListener("click",()=>{
  if(!activeJobSnapshot?.job)return;
  openJobEditor(activeJobSnapshot.job);
});
$("jobDeleteBtn")?.addEventListener("click",async()=>{
  const job=activeJobSnapshot?.job;
  if(!job?.id)return;

  const label=job.title||"Auftrag";
  if(!confirm(`„${label}“ wirklich löschen?\n\nArbeitszeiten, Material, Zahlungen und zugehörige Rechnungsdaten dieses Auftrags werden ebenfalls entfernt.`))return;

  const btn=$("jobDeleteBtn");
  btn.disabled=true;
  btn.textContent="Lösche …";

  try{
    await authCloudRequest(
      `/api/jobs/${encodeURIComponent(job.id)}`,
      {method:"DELETE"}
    );

    activeJobId=null;
    activeJobSnapshot=null;
    $("jobDetailEmpty").hidden=false;
    $("jobDetail").hidden=true;

    await loadJobs();
    toast("Auftrag gelöscht","warn");
  }catch(e){
    toast(e.message||"Auftrag konnte nicht gelöscht werden","warn");
  }finally{
    btn.disabled=false;
    btn.textContent="🗑 Auftrag löschen";
  }
});
["jobCreateClose","jobCreateCancel"].forEach(id=>$(id)?.addEventListener("click",()=>{editingJobId=null;jobsModal("jobCreateModal",false)}));
$("jobCreateModal")?.addEventListener("click",e=>{if(e.target===$("jobCreateModal"))jobsModal("jobCreateModal",false)});
$("jobCreateForm")?.addEventListener("submit",async e=>{
  e.preventDefault();

  const btn=$("jobCreateSubmit");
  btn.disabled=true;
  btn.textContent=editingJobId?"Speichere …":"Erstelle …";
  $("jobCreateMessage").textContent="";

  try{
    const body={
      title:$("jobTitleInput").value.trim(),
      description:$("jobDescriptionInput").value.trim()||null,

      customerName:$("jobCustomerInput").value.trim(),
      customerEmail:$("jobCustomerEmail").value.trim()||null,
      customerPhone:$("jobCustomerPhone").value.trim()||null,
      customerAddress:$("jobCustomerAddress").value.trim()||null,

      vehicleMake:$("jobVehicleMake").value.trim(),
      vehicleModel:$("jobVehicleModel").value.trim(),
      vehiclePlate:$("jobVehiclePlate").value.trim()||null,
      vehicleVin:$("jobVehicleVin").value.trim()||null,

      notes:$("jobNotesInput").value.trim()||null
    };

    let out;

    if(editingJobId){
      out=await authCloudRequest(
        `/api/jobs/${encodeURIComponent(editingJobId)}`,
        {
          method:"PUT",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify(body)
        }
      );

      activeJobId=editingJobId;
      toast("Auftrag aktualisiert");
    }else{
      out=await authCloudRequest(
        "/api/jobs",
        {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify(body)
        }
      );

      activeJobId=out.job?.id||null;
      toast("Auftrag erstellt");
    }

    jobsModal("jobCreateModal",false);
    editingJobId=null;
    await loadJobs();

    if(activeJobId){
      await openJob(activeJobId);
    }
  }catch(err){
    $("jobCreateMessage").textContent=err.message;
    $("jobCreateMessage").className="cloud-message bad";
  }finally{
    btn.disabled=false;
    btn.textContent=editingJobId?"Änderungen speichern":"Auftrag erstellen";
  }
});

$("jobAddWork")?.addEventListener("click",()=>{if(!activeJobId)return;$("jobWorkForm").reset();$("jobWorkHours").value="0";$("jobWorkMinutes").value="30";$("jobWorkRate").value="40";$("jobWorkDate").value=new Date().toISOString().slice(0,10);$("jobWorkBillable").checked=true;$("jobWorkMessage").textContent="";jobsModal("jobWorkModal",true)});
["jobWorkClose","jobWorkCancel"].forEach(id=>$(id)?.addEventListener("click",()=>jobsModal("jobWorkModal",false)));
$("jobWorkModal")?.addEventListener("click",e=>{if(e.target===$("jobWorkModal"))jobsModal("jobWorkModal",false)});
$("jobWorkForm")?.addEventListener("submit",async e=>{
  e.preventDefault();if(!activeJobId)return;
  const minutes=(Number($("jobWorkHours").value)||0)*60+(Number($("jobWorkMinutes").value)||0);
  $("jobWorkMessage").textContent="";
  try{
    await authCloudRequest(`/api/jobs/${encodeURIComponent(activeJobId)}/work`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({description:$("jobWorkDescription").value.trim(),minutes,hourlyRate:Number($("jobWorkRate").value)||0,workDate:$("jobWorkDate").value||null,billable:$("jobWorkBillable").checked})});
    jobsModal("jobWorkModal",false);toast("Arbeitszeit gespeichert");await loadJobs();await openJob(activeJobId);
  }catch(err){$("jobWorkMessage").textContent=err.message;$("jobWorkMessage").className="cloud-message bad"}
});

$("jobAddMaterial")?.addEventListener("click",()=>{if(!activeJobId)return;$("jobMaterialForm").reset();$("jobMaterialQty").value="1";$("jobMaterialPrice").value="0";$("jobMaterialBillable").checked=true;$("jobMaterialMessage").textContent="";jobsModal("jobMaterialModal",true)});
["jobMaterialClose","jobMaterialCancel"].forEach(id=>$(id)?.addEventListener("click",()=>jobsModal("jobMaterialModal",false)));
$("jobMaterialModal")?.addEventListener("click",e=>{if(e.target===$("jobMaterialModal"))jobsModal("jobMaterialModal",false)});
$("jobMaterialForm")?.addEventListener("submit",async e=>{
  e.preventDefault();if(!activeJobId)return;$("jobMaterialMessage").textContent="";
  try{
    await authCloudRequest(`/api/jobs/${encodeURIComponent(activeJobId)}/materials`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({description:$("jobMaterialDescription").value.trim(),partNumber:$("jobMaterialPart").value.trim()||null,quantity:Number($("jobMaterialQty").value)||1,purchasePrice:$("jobMaterialPurchase").value===""?null:Number($("jobMaterialPurchase").value),unitPrice:Number($("jobMaterialPrice").value)||0,billable:$("jobMaterialBillable").checked,notes:$("jobMaterialNotes").value.trim()||null})});
    jobsModal("jobMaterialModal",false);toast("Material gespeichert");await loadJobs();await openJob(activeJobId);
  }catch(err){$("jobMaterialMessage").textContent=err.message;$("jobMaterialMessage").className="cloud-message bad"}
});


function updateJobPaymentPreview(){
  const paid=Number($("jobPaymentPaid")?.value||0),tip=Number($("jobPaymentTip")?.value||0);
  const income=paid+tip,purchase=Number(activeJobSnapshot?.totals?.purchaseCost||0);
  $("jobPaymentIncomePreview").textContent=jobsMoney(income);
  $("jobPaymentProfitPreview").textContent=jobsMoney(income-purchase);
}
$("jobMarkPaid")?.addEventListener("click",()=>{
  if(!activeJobId||!activeJobSnapshot)return;
  const p=activeJobSnapshot.job?.payment||{},total=Number(activeJobSnapshot.totals?.total||0);
  $("jobPaymentPaid").value=p.paidAmount==null?total.toFixed(2):Number(p.paidAmount).toFixed(2);
  $("jobPaymentTip").value=Number(p.tipAmount||0).toFixed(2);
  $("jobPaymentMethod").value=p.paymentMethod||"cash";
  $("jobPaymentOrderValue").textContent=jobsMoney(total);
  $("jobPaymentMessage").textContent="";
  updateJobPaymentPreview();
  jobsModal("jobPaymentModal",true);
});
["jobPaymentClose","jobPaymentCancel"].forEach(id=>$(id)?.addEventListener("click",()=>jobsModal("jobPaymentModal",false)));
$("jobPaymentModal")?.addEventListener("click",e=>{if(e.target===$("jobPaymentModal"))jobsModal("jobPaymentModal",false)});
$("jobPaymentPaid")?.addEventListener("input",updateJobPaymentPreview);
$("jobPaymentTip")?.addEventListener("input",updateJobPaymentPreview);
$("jobPaymentForm")?.addEventListener("submit",async e=>{
  e.preventDefault();if(!activeJobId)return;
  const btn=$("jobPaymentSubmit");btn.disabled=true;btn.textContent="Speichere …";$("jobPaymentMessage").textContent="";
  try{
    await authCloudRequest(`/api/jobs/${encodeURIComponent(activeJobId)}/payment`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({paidAmount:Number($("jobPaymentPaid").value)||0,tipAmount:Number($("jobPaymentTip").value)||0,paymentMethod:$("jobPaymentMethod").value})});
    jobsModal("jobPaymentModal",false);toast("Zahlung gespeichert");await loadJobs();await openJob(activeJobId);
  }catch(err){$("jobPaymentMessage").textContent=err.message;$("jobPaymentMessage").className="cloud-message bad"}
  finally{btn.disabled=false;btn.textContent="Zahlung speichern"}
});


let invoiceSettingsCache=null;
function fillInvoiceSettingsForm(s={}){
  const set=(id,v)=>{if($(id))$(id).value=v??""};
  set("invoiceBusinessName",s.businessName);set("invoiceOwnerName",s.ownerName);set("invoiceStreet",s.street);set("invoicePostalCode",s.postalCode);set("invoiceCity",s.city);set("invoiceCountry",s.country||"Deutschland");set("invoiceEmail",s.email);set("invoicePhone",s.phone);set("invoiceIban",s.iban);set("invoiceBic",s.bic);set("invoiceBankName",s.bankName);set("invoicePrefix",s.invoicePrefix||"JIG");
}
function renderInvoiceSettingsSummary(){
  const el=$("invoiceSettingsSummary");if(!el)return;
  if(!accountSession().token){el.innerHTML='<span class="muted">Bitte zuerst anmelden.</span>';return}
  const s=invoiceSettingsCache;if(!s){el.innerHTML='<span class="muted">Noch keine Rechnungseinstellungen gespeichert.</span>';return}
  const name=s.businessName||s.ownerName||"Ohne Absendername",place=[s.postalCode,s.city].filter(Boolean).join(" ");
  el.innerHTML=`<div><strong>${jobsEsc(name)}</strong><span>${jobsEsc([s.street,place].filter(Boolean).join(" · ")||"Adresse noch unvollständig")}</span></div><div><strong>Rechnungsserie</strong><span>${jobsEsc(s.invoicePrefix||"JIG")}</span></div>`;
}
async function loadInvoiceSettings(){
  if(!accountSession().token){invoiceSettingsCache=null;renderInvoiceSettingsSummary();return null}
  try{const out=await authCloudRequest("/api/invoice-settings");invoiceSettingsCache=out.settings||null;renderInvoiceSettingsSummary();return invoiceSettingsCache}
  catch(e){const el=$("invoiceSettingsSummary");if(el)el.textContent=`Rechnungsdaten konnten nicht geladen werden: ${e.message}`;return null}
}
$("invoiceSettingsOpen")?.addEventListener("click",async()=>{if(!accountSession().token){toast("Bitte zuerst anmelden","warn");return}const s=await loadInvoiceSettings();fillInvoiceSettingsForm(s||{});$("invoiceSettingsMessage").textContent="";jobsModal("invoiceSettingsModal",true)});
["invoiceSettingsClose","invoiceSettingsCancel"].forEach(id=>$(id)?.addEventListener("click",()=>jobsModal("invoiceSettingsModal",false)));
$("invoiceSettingsModal")?.addEventListener("click",e=>{if(e.target===$("invoiceSettingsModal"))jobsModal("invoiceSettingsModal",false)});
$("invoiceSettingsForm")?.addEventListener("submit",async e=>{
 e.preventDefault();const btn=$("invoiceSettingsSubmit");btn.disabled=true;btn.textContent="Speichere …";$("invoiceSettingsMessage").textContent="";
 try{
  const body={businessName:$("invoiceBusinessName").value.trim()||null,ownerName:$("invoiceOwnerName").value.trim()||null,street:$("invoiceStreet").value.trim()||null,postalCode:$("invoicePostalCode").value.trim()||null,city:$("invoiceCity").value.trim()||null,country:$("invoiceCountry").value.trim()||"Deutschland",email:$("invoiceEmail").value.trim()||null,phone:$("invoicePhone").value.trim()||null,iban:$("invoiceIban").value.trim()||null,bic:$("invoiceBic").value.trim()||null,bankName:$("invoiceBankName").value.trim()||null,taxNumber:null,vatId:null,defaultTaxRate:0,defaultPaymentDays:0,invoicePrefix:$("invoicePrefix").value.trim()||"JIG"};
  await authCloudRequest("/api/invoice-settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});invoiceSettingsCache=body;renderInvoiceSettingsSummary();jobsModal("invoiceSettingsModal",false);toast("Rechnungseinstellungen gespeichert");
 }catch(err){$("invoiceSettingsMessage").textContent=err.message;$("invoiceSettingsMessage").className="cloud-message bad"}
 finally{btn.disabled=false;btn.textContent="Speichern"}
});
$("jobCreateInvoice")?.addEventListener("click",async()=>{
 if(!activeJobId)return;if(!confirm("Rechnung für diesen Auftrag erstellen?"))return;
 const btn=$("jobCreateInvoice");btn.disabled=true;btn.textContent="Rechnung wird erstellt …";
 try{const out=await authCloudRequest(`/api/jobs/${encodeURIComponent(activeJobId)}/invoice`,{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});toast(`Rechnung ${out.invoice?.invoiceNumber||""} erstellt`);await loadJobs();await openJob(activeJobId)}
 catch(err){toast(err.message,"warn");btn.disabled=false;btn.textContent="🧾 Rechnung erstellen"}
});
async function openInvoicePdf(invoiceId){
 const session=accountSession();if(!session.token)throw new Error("Bitte zuerst anmelden");
 const r=await fetch(`${JIGGY_CLOUD.apiUrl}/api/invoices/${encodeURIComponent(invoiceId)}/pdf`,{headers:{Authorization:`Bearer ${session.token}`}});
 if(!r.ok){let msg=`PDF konnte nicht geladen werden (${r.status})`;try{const d=await r.json();if(d?.error)msg=d.error}catch{}throw new Error(msg)}
 const blob=await r.blob(),url=URL.createObjectURL(blob),win=window.open(url,"_blank");
 if(!win){const a=document.createElement("a");a.href=url;a.download=`${activeJobSnapshot?.invoice?.invoiceNumber||"rechnung"}.pdf`;document.body.appendChild(a);a.click();a.remove()}
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
$("jobOpenInvoice")?.addEventListener("click",async()=>{const inv=activeJobSnapshot?.invoice;if(!inv?.id)return;try{await openInvoicePdf(inv.id)}catch(err){toast(err.message,"warn")}});


// BETA 4.1: Eingabefix für Rechnungseinstellungen.
// Verhindert, dass globale Drag/Pointer-Handler der App Eingaben im Modal abfangen.
(function initInvoiceSettingsInputFix(){
  const modal=document.getElementById("invoiceSettingsModal");
  if(!modal)return;
  const stop=e=>e.stopPropagation();
  ["pointerdown","mousedown","touchstart","dragstart"].forEach(type=>{
    modal.addEventListener(type,stop,true);
  });
  modal.querySelectorAll("input, textarea, select").forEach(el=>{
    el.disabled=false;
    el.readOnly=false;
    el.style.pointerEvents="auto";
    el.addEventListener("click",e=>e.stopPropagation());
  });
})();



// ---------------------------------------------------------
// JIGGY Public Profile – schöne Profil-URL /u/name
// ---------------------------------------------------------
function normalizeProfileSlug(v){
  return String(v||"").trim().toLowerCase();
}

let profileSlugCheckTimer=null;

async function loadProfileSlug(){
  const input=$("profileSlug");
  const status=$("profileSlugStatus");
  if(!input||!status||!accountSession().token)return;

  try{
    const out=await authCloudRequest("/api/profiles/me/slug");
    input.value=out.slug||"";
    status.textContent=out.slug
      ? `Dein Profil: jiggy-cloud.org/u/${out.slug}`
      : "Noch kein eigener Profil-Link vergeben.";
    status.className="profile-slug-status good";
  }catch(e){
    if(e?.message?.includes("noch kein öffentliches Profil")){
      status.textContent="Veröffentliche dein Profil zuerst, danach kannst du den Link festlegen.";
      status.className="profile-slug-status";
      return;
    }
    status.textContent=e.message||"Profil-Link konnte nicht geladen werden.";
    status.className="profile-slug-status bad";
  }
}

$("profileSlug")?.addEventListener("input",()=>{
  const input=$("profileSlug");
  const status=$("profileSlugStatus");
  const slug=normalizeProfileSlug(input.value);
  input.value=slug;

  clearTimeout(profileSlugCheckTimer);

  if(slug.length<3){
    status.textContent="3–30 Zeichen · a–z, 0–9, - und _";
    status.className="profile-slug-status";
    return;
  }

  profileSlugCheckTimer=setTimeout(async()=>{
    try{
      const out=await authCloudRequest(`/api/profiles/slug-check/${encodeURIComponent(slug)}`);
      status.textContent=out.available
        ? (out.ownedByYou?"Dieser Link gehört bereits dir.":"Profil-Link ist verfügbar.")
        : "Dieser Profil-Link ist bereits vergeben.";
      status.className=`profile-slug-status ${out.available?"good":"bad"}`;
    }catch(e){
      status.textContent=e.message||"Profil-Link konnte nicht geprüft werden.";
      status.className="profile-slug-status bad";
    }
  },350);
});

$("profileSlug")?.addEventListener("change",async()=>{
  const input=$("profileSlug");
  const status=$("profileSlugStatus");
  const slug=normalizeProfileSlug(input.value);
  if(slug.length<3)return;

  try{
    const out=await authCloudRequest(
      "/api/profiles/me/slug",
      {
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({slug})
      }
    );

    status.textContent=`Gespeichert: ${out.url}`;
    status.className="profile-slug-status good";
    toast("Profil-Link gespeichert");
  }catch(e){
    status.textContent=e.message||"Profil-Link konnte nicht gespeichert werden.";
    status.className="profile-slug-status bad";
  }
});

function initSpotsView(){
  if(!window.maplibregl){$("spotsList").innerHTML='<div class="log-empty">Karte konnte nicht geladen werden.</div>';return}
  if(!spotsMap){
    spotsMap=new maplibregl.Map({container:"spotsMap",style:spotStyle(),center:[6.62,51.66],zoom:9});
    spotsMap.addControl(new maplibregl.NavigationControl(),"top-right");
    spotsMap.on("click",e=>{
      if(!spotPickMode)return;
      setSpotCoords(e.lngLat.lat,e.lngLat.lng,true);
      stopSpotPickMode();
      openSpotCreateModal(true);
    });
  }else setTimeout(()=>spotsMap.resize(),30);
  loadSpots();
}
async function loadSpots(){
  const list=$("spotsList");if(!list)return;
  list.innerHTML='<div class="log-empty">Spots werden geladen …</div>';
  try{
    const out=await cloudRequest("/api/spots");
    spotsCache=Array.isArray(out.spots)?out.spots:[];
    renderSpots();
  }catch(err){
    list.innerHTML=`<div class="log-empty">Spots konnten nicht geladen werden.<br><small>${spotEsc(err.message)}</small></div>`;
  }
}

function revokeSpotObjectUrls(){
  for(const url of spotObjectUrls){try{URL.revokeObjectURL(url)}catch{}}
  spotObjectUrls=[];
}

async function spotMediaBlobUrl(spotId,mediaId){
  const r=await fetch(`${JIGGY_CLOUD.apiUrl}/api/spots/${encodeURIComponent(spotId)}/media/${encodeURIComponent(mediaId)}`);
  if(!r.ok){
    let msg=`Bild konnte nicht geladen werden (${r.status})`;
    try{const d=await r.json();if(d?.error)msg=d.error}catch{}
    throw new Error(msg);
  }
  const blob=await r.blob();
  const url=URL.createObjectURL(blob);
  spotObjectUrls.push(url);
  return url;
}

function renderSpotDetailImage(){
  const img=$("spotDetailImage");
  const empty=$("spotDetailNoImage");
  const count=$("spotDetailCounter");
  const prev=$("spotDetailPrev"),next=$("spotDetailNext");
  const thumbs=$("spotDetailThumbs");
  if(!img||!empty)return;

  if(!activeSpotMedia.length){
    img.hidden=true;
    img.style.display="none";
    empty.hidden=false;
    empty.style.display="grid";
    if(count)count.hidden=true;
    if(prev)prev.hidden=true;if(next)next.hidden=true;
    if(thumbs)thumbs.innerHTML="";
    return;
  }
  const item=activeSpotMedia[activeSpotMediaIndex];
  img.src=item.url;img.alt=activeSpotDetail?.name||"JIGGY Spot";
  img.hidden=false;
  img.style.display="block";
  empty.hidden=true;
  empty.style.display="none";
  if(count){
    count.hidden=activeSpotMedia.length<=1;
    count.textContent=`${activeSpotMediaIndex+1} / ${activeSpotMedia.length}`;
  }
  if(prev)prev.hidden=activeSpotMedia.length<=1;
  if(next)next.hidden=activeSpotMedia.length<=1;
  if(thumbs){
    thumbs.innerHTML=activeSpotMedia.map((m,i)=>`<button class="spot-detail-thumb ${i===activeSpotMediaIndex?"active":""}" type="button" data-spot-media-index="${i}"><img src="${m.url}" alt=""></button>`).join("");
    thumbs.querySelectorAll("[data-spot-media-index]").forEach(b=>b.onclick=()=>{
      activeSpotMediaIndex=Number(b.dataset.spotMediaIndex)||0;
      renderSpotDetailImage();
    });
  }
}


function currentUserOwnsSpot(spot){
  const userId=accountSession()?.user?.id;
  return !!(userId&&spot?.userId&&String(userId)===String(spot.userId));
}

async function openSpotDetail(spotOrId){
  const spot=typeof spotOrId==="string"?spotsCache.find(s=>s.id===spotOrId):spotOrId;
  if(!spot)return;
  activeSpotDetail=spot;
  activeSpotMediaIndex=0;
  revokeSpotObjectUrls();
  activeSpotMedia=[];

  if($("spotDetailImage")){
    $("spotDetailImage").src="";
    $("spotDetailImage").hidden=true;
    $("spotDetailImage").style.display="none";
  }
  if($("spotDetailNoImage")){
    $("spotDetailNoImage").hidden=false;
    $("spotDetailNoImage").style.display="grid";
  }

  $("spotDetailName").textContent=spot.name||"JIGGY Spot";
  $("spotDetailCategory").textContent=spot.category||"JIGGY SPOT";
  $("spotDetailDescription").textContent=spot.description||"Keine Beschreibung hinterlegt.";
  $("spotDetailTypeBadge").textContent=`${spotTypeIcon(spot)} ${spotTypeLabel(spot)}`;
  $("spotDetailVisibilityBadge").textContent=spot.visibility==="private"?"🔒 Privat":spot.visibility==="link"?"🔗 Nur per Link":"🌍 Öffentlich";
  $("spotDetailAccess").textContent=spot.isCarAccessible?"🚗 Mit dem Auto erreichbar":"🚶 Nicht direkt mit dem Auto erreichbar";
  $("spotDetailCoords").textContent=`${Number(spot.latitude).toFixed(6)}, ${Number(spot.longitude).toFixed(6)}`;

  if($("spotOwnerActions")){
    $("spotOwnerActions").hidden=!currentUserOwnsSpot(spot);
  }

  const dateWrap=$("spotDetailDateWrap");
  const recurWrap=$("spotDetailRecurringWrap");
  if(spot.spotType==="meet"){
    dateWrap.hidden=!spot.eventStart;
    dateWrap.style.display=spot.eventStart?"grid":"none";
    if(spot.eventStart){
      let txt=spotDateLabel(spot);
      if(spot.eventEnd){
        try{
          const end=new Intl.DateTimeFormat("de-DE",{dateStyle:"medium",timeStyle:"short"}).format(new Date(spot.eventEnd));
          txt+=` – ${end}`;
        }catch{}
      }
      $("spotDetailDate").textContent=txt;
    }

    recurWrap.hidden=false;
    recurWrap.style.display="grid";
    $("spotDetailRecurring").textContent=spot.recurring?"🔁 Regelmäßiges Treffen":"📅 Einmaliges / loses Treffen";
  }else{
    dateWrap.hidden=true;
    dateWrap.style.display="none";
    recurWrap.hidden=true;
    recurWrap.style.display="none";
  }

  $("spotDetailMessage").textContent="Bilder werden geladen …";
  $("spotDetailMessage").className="cloud-message";
  $("spotDetailModal").classList.add("open");
  $("spotDetailModal").setAttribute("aria-hidden","false");
  renderSpotDetailImage();
  loadMeetAttendance(spot);

  try{
    const data=await cloudRequest(`/api/spots/${encodeURIComponent(spot.id)}/media`);
    const media=Array.isArray(data.media)?data.media:[];
    const loaded=[];
    for(const m of media){
      try{
        const mediaId=m.mediaId||m.media_id||m.id;
        if(!mediaId)continue;
        const url=await spotMediaBlobUrl(spot.id,mediaId);
        loaded.push({...m,mediaId,url});
      }catch(err){console.warn("Spot image load:",err)}
    }
    activeSpotMedia=loaded;
    activeSpotMediaIndex=0;

    const hero=$("spotDetailImage");
    const empty=$("spotDetailNoImage");
    if(loaded.length){
      hero.src=loaded[0].url;
      hero.alt=activeSpotDetail?.name||"JIGGY Spot";
      hero.hidden=false;
      empty.hidden=true;
    }else{
      hero.src="";
      hero.hidden=true;
      empty.hidden=false;
    }

    renderSpotDetailImage();
    $("spotDetailMessage").textContent=loaded.length?`${loaded.length} Foto${loaded.length===1?"":"s"} geladen.`:"Für diesen Spot wurde noch kein Bild hochgeladen.";
    $("spotDetailMessage").className=`cloud-message ${loaded.length?"good":""}`;
  }catch(err){
    console.error(err);
    $("spotDetailMessage").textContent=err.message||"Bilder konnten nicht geladen werden.";
    $("spotDetailMessage").className="cloud-message bad";
  }
}

function closeSpotDetail(){
  $("spotDetailModal")?.classList.remove("open");
  $("spotDetailModal")?.setAttribute("aria-hidden","true");
  activeSpotDetail=null;activeSpotMedia=[];activeSpotMediaIndex=0;
  revokeSpotObjectUrls();
  if($("spotDetailImage")){$("spotDetailImage").src="";$("spotDetailImage").hidden=true}
}

$("spotDetailClose")?.addEventListener("click",closeSpotDetail);
$("spotDetailModal")?.addEventListener("click",e=>{if(e.target===$("spotDetailModal"))closeSpotDetail()});
$("spotDetailPrev")?.addEventListener("click",()=>{
  if(!activeSpotMedia.length)return;
  activeSpotMediaIndex=(activeSpotMediaIndex-1+activeSpotMedia.length)%activeSpotMedia.length;
  renderSpotDetailImage();
});
$("spotDetailNext")?.addEventListener("click",()=>{
  if(!activeSpotMedia.length)return;
  activeSpotMediaIndex=(activeSpotMediaIndex+1)%activeSpotMedia.length;
  renderSpotDetailImage();
});
$("spotDetailFly")?.addEventListener("click",()=>{
  if(!activeSpotDetail||!spotsMap)return;
  const s=activeSpotDetail;
  closeSpotDetail();
  spotsMap.flyTo({center:[Number(s.longitude),Number(s.latitude)],zoom:16});
});


$("spotMeetJoin")?.addEventListener("click",async()=>{
  const spot=activeSpotDetail;
  if(!spot||spot.spotType!=="meet")return;
  if(isPastMeet(spot)){
    toast("Das Treffen ist bereits vorbei","warn");
    return;
  }
  const session=accountSession();
  if(!session?.token){
    toast("Bitte zuerst bei JIGGY anmelden","warn");
    return;
  }

  const btn=$("spotMeetJoin");
  if(btn)btn.disabled=true;

  try{
    const joining=!activeMeetAttendance.joined;
    const out=await authCloudRequest(`/api/spots/${encodeURIComponent(spot.id)}/attendees`,{
      method:joining?"POST":"DELETE"
    });
    activeMeetAttendance={
      count:Number(out.count||0),
      joined:!!out.joined
    };
    if($("spotMeetCount")){
      $("spotMeetCount").textContent=activeMeetAttendance.count===0
        ?"Noch niemand eingetragen."
        :`${activeMeetAttendance.count} ${activeMeetAttendance.count===1?"Person ist":"Leute sind"} dabei.`;
    }
    if(btn){
      btn.textContent=activeMeetAttendance.joined?"✓ Dabei – absagen":"🚗 Ich bin dabei";
      btn.classList.toggle("joined",activeMeetAttendance.joined);
    }
    toast(activeMeetAttendance.joined?"Du bist dabei 🚗🔥":"Teilnahme abgesagt");
  }catch(err){
    console.error(err);
    toast(err.message||"Teilnahme konnte nicht geändert werden","warn");
  }finally{
    if(btn)btn.disabled=false;
  }
});

$("spotDetailDelete")?.addEventListener("click",async()=>{
  const spot=activeSpotDetail;
  if(!spot||!currentUserOwnsSpot(spot)){
    toast("Du kannst nur deine eigenen Spots löschen","warn");
    return;
  }

  const ok=window.confirm(
    `„${spot.name}“ wirklich löschen?\n\nDer Spot wird aus JIGGY Spots entfernt.`
  );
  if(!ok)return;

  const btn=$("spotDetailDelete");
  const msg=$("spotDetailMessage");
  if(btn){btn.disabled=true;btn.textContent="Lösche …"}
  if(msg){
    msg.textContent="Spot wird gelöscht …";
    msg.className="cloud-message";
  }

  try{
    await authCloudRequest(`/api/spots/${encodeURIComponent(spot.id)}`,{
      method:"DELETE"
    });

    closeSpotDetail();
    toast("Spot gelöscht 🗑");
    await loadSpots();
  }catch(err){
    console.error(err);
    if(msg){
      msg.textContent=err.message||"Spot konnte nicht gelöscht werden.";
      msg.className="cloud-message bad";
    }
  }finally{
    if(btn){
      btn.disabled=false;
      btn.textContent="🗑 Spot löschen";
    }
  }
});


function isPastMeet(spot){
  if(spot?.spotType!=="meet")return false;
  const raw=spot.eventEnd||spot.eventStart;
  if(!raw)return false;
  const d=new Date(raw);
  return !Number.isNaN(d.getTime()) && d.getTime()<Date.now();
}
function sameLocalDay(a,b){
  return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
}
function inCurrentWeek(d){
  const now=new Date();
  const start=new Date(now);
  const day=(start.getDay()+6)%7;
  start.setHours(0,0,0,0);
  start.setDate(start.getDate()-day);
  const end=new Date(start);
  end.setDate(end.getDate()+7);
  return d>=start&&d<end;
}
function meetWhenMatches(spot,filter){
  if(!filter)return true;
  if(spot?.spotType!=="meet")return false;
  const raw=spot.eventStart;
  if(!raw)return filter==="upcoming" ? !isPastMeet(spot) : false;
  const d=new Date(raw);
  if(Number.isNaN(d.getTime()))return false;
  if(filter==="past")return isPastMeet(spot);
  if(filter==="upcoming")return !isPastMeet(spot);
  if(filter==="today")return sameLocalDay(d,new Date());
  if(filter==="week")return inCurrentWeek(d);
  return true;
}

async function loadMeetAttendance(spot){
  const card=$("spotMeetCard");
  if(!card)return;
  if(spot?.spotType!=="meet"){
    card.hidden=true;
    return;
  }

  card.hidden=false;
  activeMeetAttendance={count:0,joined:false};
  const countEl=$("spotMeetCount");
  const btn=$("spotMeetJoin");

  if(isPastMeet(spot)){
    if(btn){btn.disabled=true;btn.textContent="✓ Treffen vorbei"}
  }else{
    if(btn){btn.disabled=false;btn.textContent="🚗 Ich bin dabei"}
  }
  if(countEl)countEl.textContent="Teilnehmer werden geladen …";

  try{
    const session=accountSession();
    const headers={};
    if(session?.token)headers.Authorization=`Bearer ${session.token}`;

    const r=await fetch(`${JIGGY_CLOUD.apiUrl}/api/spots/${encodeURIComponent(spot.id)}/attendees`,{headers});
    const text=await r.text();
    let data={}; try{data=text?JSON.parse(text):{}}catch{}
    if(!r.ok)throw new Error(data.error||`Teilnehmer konnten nicht geladen werden (${r.status})`);

    activeMeetAttendance={
      count:Number(data.count||0),
      joined:!!data.joined
    };

    if(countEl){
      countEl.textContent=activeMeetAttendance.count===0
        ?"Noch niemand eingetragen."
        :`${activeMeetAttendance.count} ${activeMeetAttendance.count===1?"Person ist":"Leute sind"} dabei.`;
    }

    if(btn&&!isPastMeet(spot)){
      btn.disabled=false;
      btn.textContent=activeMeetAttendance.joined?"✓ Dabei – absagen":"🚗 Ich bin dabei";
      btn.classList.toggle("joined",activeMeetAttendance.joined);
    }
  }catch(err){
    console.warn("Meet attendance:",err);
    if(countEl)countEl.textContent="Teilnehmer derzeit nicht verfügbar.";
    if(btn&&!isPastMeet(spot))btn.disabled=false;
  }
}

function renderSpots(){
  const cat=$("spotsCategory")?.value||"";
  const meetWhen=$("spotsMeetWhen")?.value||"";
  const rows=spotsCache.filter(s=>
    (!cat||s.category===cat)&&
    (!spotsTypeFilter||s.spotType===spotsTypeFilter)&&
    meetWhenMatches(s,meetWhen)
  );
  $("spotsCount").textContent=`${rows.length} gefunden`;
  spotsMarkers.forEach(m=>m.remove());spotsMarkers=[];
  for(const s of rows){
    const el=document.createElement("button");
    el.className=`spot-map-marker ${s.spotType==="meet"?"meet":"photo"}`;
    el.type="button";
    el.textContent=spotTypeIcon(s);
    const extra=spotDateLabel(s);
    const marker=new maplibregl.Marker({element:el})
      .setLngLat([Number(s.longitude),Number(s.latitude)])
      .addTo(spotsMap);
    el.addEventListener("click",ev=>{ev.stopPropagation();openSpotDetail(s)});
    spotsMarkers.push(marker);
  }

  $("spotsList").innerHTML=rows.length?rows.map(s=>{
    const date=spotDateLabel(s);
    return `<button class="spot-row" type="button" data-spot-id="${spotEsc(s.id)}">
      <span class="spot-pin">${spotTypeIcon(s)}</span>
      <span>
        <strong>${spotEsc(s.name)}${isPastMeet(s)?' <span class="spot-past-label">Vorbei</span>':""}</strong>
        <small>${spotEsc(s.category||spotTypeLabel(s))}${date?` · ${spotEsc(date)}`:""} · ${s.isCarAccessible?"Mit Auto erreichbar":"Zu Fuß"}</small>
      </span>
      <b>›</b>
    </button>`;
  }).join(""):'<div class="log-empty">Hier gibt es noch nichts. Zeit, den ersten Spot einzutragen. 📍</div>';

  document.querySelectorAll(".spot-row").forEach(el=>el.onclick=()=>{
    const s=spotsCache.find(x=>x.id===el.dataset.spotId);if(!s)return;
    openSpotDetail(s);
  });
}

function setSpotCoords(lat,lon,moveMarker=true){
  pendingSpotCoords={latitude:Number(lat),longitude:Number(lon)};
  if($("spotFormCoords"))$("spotFormCoords").textContent=`${pendingSpotCoords.latitude.toFixed(6)}, ${pendingSpotCoords.longitude.toFixed(6)}`;
  if(moveMarker&&spotsMap){
    if(!spotDraftMarker){
      const el=document.createElement("div");
      el.className="spot-draft-marker";
      el.textContent="📍";
      spotDraftMarker=new maplibregl.Marker({element:el,draggable:true})
        .setLngLat([pendingSpotCoords.longitude,pendingSpotCoords.latitude])
        .addTo(spotsMap);
      spotDraftMarker.on("dragend",()=>{
        const p=spotDraftMarker.getLngLat();
        setSpotCoords(p.lat,p.lng,false);
      });
    }else{
      spotDraftMarker.setLngLat([pendingSpotCoords.longitude,pendingSpotCoords.latitude]);
    }
  }
}
function setSpotCoordsFromMap(){
  if(!spotsMap)return;
  const c=spotsMap.getCenter();
  setSpotCoords(c.lat,c.lng,true);
}
function startSpotPickMode(){
  if(!spotsMap)return;
  spotPickMode=true;
  closeSpotCreateModal(false);
  spotsMap.getCanvas().style.cursor="crosshair";
  toast("Klick auf die gewünschte Stelle auf der Karte 📍");
}
function stopSpotPickMode(){
  spotPickMode=false;
  if(spotsMap)spotsMap.getCanvas().style.cursor="";
}

function updateSpotKindUI(){
  const type=document.querySelector('input[name="spotType"]:checked')?.value||"photo";
  document.querySelectorAll(".spots-kind").forEach(el=>el.classList.toggle("active",el.querySelector("input")?.checked));
  if($("spotMeetFields"))$("spotMeetFields").hidden=type!=="meet";
  if($("spotFormCategory")){
    const select=$("spotFormCategory");
    if(type==="meet"&&!["Treffpunkt","Car Meet"].includes(select.value)){
      select.innerHTML='<option value="Treffpunkt">Treffpunkt</option><option value="Car Meet">Car Meet</option><option value="Parkhaus">Parkhaus</option><option value="Industrie">Industrie</option><option value="Urban">Urban</option>';
      select.value="Treffpunkt";
    }else if(type==="photo"&&["Treffpunkt","Car Meet"].includes(select.value)){
      select.innerHTML='<option value="Urban">Urban</option><option value="Industrie">Industrie</option><option value="Natur">Natur</option><option value="Parkhaus">Parkhaus</option><option value="Nacht">Nacht</option><option value="Aussicht">Aussicht</option>';
      select.value="Urban";
    }
  }
}
function openSpotCreateModal(preserveCoords=false){
  if(!accountSession().token){
    toast("Bitte zuerst bei JIGGY anmelden","warn");
    show("more");
    return;
  }
  if(!preserveCoords)setSpotCoordsFromMap();
  $("spotsCreateForm")?.reset();
  const photo=document.querySelector('input[name="spotType"][value="photo"]');if(photo)photo.checked=true;
  if($("spotFormCarAccessible"))$("spotFormCarAccessible").checked=true;
  if($("spotFormVisibility"))$("spotFormVisibility").value="public";
  if($("spotImageStatus"))$("spotImageStatus").textContent="Noch keine Fotos ausgewählt.";
  if($("spotFormMessage")){$("spotFormMessage").textContent="Wähle einen Typ und trage deinen Spot ein.";$("spotFormMessage").className="cloud-message"}
  updateSpotKindUI();
  if(!pendingSpotCoords)setSpotCoordsFromMap();
  else setSpotCoords(pendingSpotCoords.latitude,pendingSpotCoords.longitude,true);
  const modal=$("spotsCreateModal");
  modal?.classList.add("open");
  modal?.setAttribute("aria-hidden","false");

  modal?.querySelectorAll("input, textarea, select, button").forEach(el=>{
    if(el.id!=="spotsModalSave") el.disabled=false;
  });

  setTimeout(()=>{
    const name=$("spotFormName");
    if(name){
      name.disabled=false;
      name.readOnly=false;
      name.focus();
      name.click();
    }
  },80);
}
function closeSpotCreateModal(removeDraft=true){
  $("spotsCreateModal")?.classList.remove("open");
  $("spotsCreateModal")?.setAttribute("aria-hidden","true");
  if(removeDraft){
    stopSpotPickMode();
    if(spotDraftMarker){spotDraftMarker.remove();spotDraftMarker=null}
    pendingSpotCoords=null;
  }
}
function localDateToISO(value){
  if(!value)return null;
  const d=new Date(value);
  return Number.isNaN(d.getTime())?null:d.toISOString();
}
async function uploadSpotImages(spotId,files){
  const session=accountSession();
  if(!session.token||!spotId||!files?.length)return 0;
  let done=0;
  for(const file of files){
    const form=new FormData();
    form.append("file",file);
    const r=await fetch(`${JIGGY_CLOUD.apiUrl}/api/spots/${encodeURIComponent(spotId)}/media`,{
      method:"POST",
      headers:{Authorization:`Bearer ${session.token}`},
      body:form
    });
    const text=await r.text();let data={};try{data=text?JSON.parse(text):{}}catch{}
    if(!r.ok)throw new Error(data.error||`Foto-Upload fehlgeschlagen (${r.status})`);
    done++;
    if($("spotImageStatus"))$("spotImageStatus").textContent=`${done} von ${files.length} Fotos hochgeladen …`;
  }
  return done;
}

$("spotsAdd")?.addEventListener("click",()=>openSpotCreateModal(false));
$("spotsModalClose")?.addEventListener("click",closeSpotCreateModal);
$("spotsModalCancel")?.addEventListener("click",closeSpotCreateModal);
$("spotsCreateModal")?.addEventListener("click",e=>{
  if(e.target===$("spotsCreateModal"))closeSpotCreateModal();
});
$("spotsCreateModal")?.querySelector(".spots-modal-panel")?.addEventListener("click",e=>e.stopPropagation());
$("spotPickOnMap")?.addEventListener("click",startSpotPickMode);
document.querySelectorAll('input[name="spotType"]').forEach(el=>el.addEventListener("change",updateSpotKindUI));
$("spotFormImages")?.addEventListener("change",()=>{
  const n=$("spotFormImages")?.files?.length||0;
  if($("spotImageStatus"))$("spotImageStatus").textContent=n?`${n} Foto${n===1?"":"s"} ausgewählt.`:"Noch keine Fotos ausgewählt.";
});

$("spotsCreateForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  const btn=$("spotsModalSave"),msg=$("spotFormMessage");
  const type=document.querySelector('input[name="spotType"]:checked')?.value||"photo";
  if(!pendingSpotCoords){setSpotCoordsFromMap()}
  const files=[...($("spotFormImages")?.files||[])];
  const payload={
    name:$("spotFormName")?.value.trim(),
    description:$("spotFormDescription")?.value.trim()||"",
    latitude:pendingSpotCoords?.latitude,
    longitude:pendingSpotCoords?.longitude,
    category:$("spotFormCategory")?.value||null,
    visibility:$("spotFormVisibility")?.value||"public",
    isCarAccessible:!!$("spotFormCarAccessible")?.checked,
    spotType:type,
    eventStart:type==="meet"?localDateToISO($("spotFormStart")?.value):null,
    eventEnd:type==="meet"?localDateToISO($("spotFormEnd")?.value):null,
    recurring:type==="meet"&&!!$("spotFormRecurring")?.checked
  };
  if(!payload.name)return;
  btn.disabled=true;btn.textContent="Speichere …";
  if(msg){msg.textContent="Spot wird in JIGGY Cloud gespeichert …";msg.className="cloud-message"}
  try{
    const out=await authCloudRequest("/api/spots",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const created=out.spot;
    if(files.length){
      btn.textContent="Fotos werden geladen …";
      await uploadSpotImages(created.id,files);
    }
    if(msg){msg.textContent=`${type==="meet"?"Treffen":"Fotospot"} gespeichert${files.length?` · ${files.length} Foto${files.length===1?"":"s"}`:""}.`;msg.className="cloud-message good"}
    toast(type==="meet"?"Treffen gespeichert 🚗":"Fotospot gespeichert 📸");
    await loadSpots();
    if(spotsMap&&created)spotsMap.flyTo({center:[Number(created.longitude),Number(created.latitude)],zoom:15});
    setTimeout(()=>closeSpotCreateModal(true),650);
  }catch(err){
    console.error(err);
    if(msg){msg.textContent=err.message||"Spot konnte nicht gespeichert werden";msg.className="cloud-message bad"}
  }finally{
    btn.disabled=false;btn.textContent="Spot speichern";
  }
});

$("spotsLocate")?.addEventListener("click",()=>{
  if(!navigator.geolocation)return toast("Standort nicht verfügbar","warn");
  navigator.geolocation.getCurrentPosition(
    p=>spotsMap?.flyTo({center:[p.coords.longitude,p.coords.latitude],zoom:14}),
    ()=>toast("Standort konnte nicht ermittelt werden","warn"),
    {enableHighAccuracy:true,timeout:8000}
  );
});
$("spotsRefresh")?.addEventListener("click",loadSpots);
$("spotsCategory")?.addEventListener("change",renderSpots);
$("spotsMeetWhen")?.addEventListener("change",renderSpots);
document.querySelectorAll("[data-spots-type]").forEach(btn=>btn.addEventListener("click",()=>{
  spotsTypeFilter=btn.dataset.spotsType||"";
  document.querySelectorAll("[data-spots-type]").forEach(x=>x.classList.toggle("active",x===btn));
  renderSpots();
}));

$("publishProfileBtn")?.addEventListener("click",async()=>{
  const c=car($("profileCar").value),btn=$("publishProfileBtn"),status=$("profilePublishStatus");
  if(!c)return toast("Kein Fahrzeug ausgewählt","warn");
  if(!accountSession().token)return toast("Bitte zuerst mit deinem JIGGY Account anmelden","warn");
  let p=profileConfig();btn.disabled=true;btn.textContent=p.profileId?"Aktualisiere …":"Veröffentliche …";status.textContent="Profilbild wird vorbereitet …";
  try{
    const image=await publicImageData(c),payload=profilePayload(c,image);
    const out=await authCloudRequest("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    p={...p,...localProfileSettings(),profileId:out.id,editToken:"",carId:c.id,publishedAt:new Date().toISOString()};
    saveProfileConfig(p);status.textContent="Profil ist online. Link kann jetzt geteilt werden.";status.className="profile-publish-status good";toast("JIGGY-Profil veröffentlicht");renderPublicProfile();
  }catch(e){console.error(e);status.textContent="Veröffentlichung fehlgeschlagen: "+e.message;status.className="profile-publish-status bad"}
  finally{btn.disabled=false;btn.textContent=profileConfig().profileId?"Änderungen speichern":"Profil veröffentlichen"}
});
$("copyProfileBtn")?.addEventListener("click",async()=>{
  const p=profileConfig();
  if(!accountSession().token||!p.profileId)return;

  let slug=normalizeProfileSlug($("profileSlug")?.value);

  // Prefer the slug stored on the server, so the copied URL is always
  // exactly the pretty profile URL that belongs to this account.
  try{
    const out=await authCloudRequest("/api/profiles/me/slug");
    if(out?.slug){
      slug=normalizeProfileSlug(out.slug);
      if($("profileSlug"))$("profileSlug").value=slug;
    }
  }catch{}

  const url=slug
    ? `https://jiggy-cloud.org/u/${encodeURIComponent(slug)}`
    : `${JIGGY_CLOUD.baseUrl}${JIGGY_CLOUD.baseUrl.includes("?")?"&":"?"}id=${encodeURIComponent(p.profileId)}`;

  try{
    if(window.myGarageDesktop?.copyText){
      const r=await window.myGarageDesktop.copyText(url);
      if(!r?.ok)throw new Error(r?.error||"Kopieren fehlgeschlagen");
    }else if(navigator.clipboard?.writeText){
      await navigator.clipboard.writeText(url);
    }else{
      throw new Error("Clipboard nicht verfügbar");
    }
    toast("Profil-Link kopiert");
  }catch{
    prompt("Profil-Link:",url);
  }
});
$("unpublishProfileBtn")?.addEventListener("click",async()=>{
  const p=profileConfig();if(!accountSession().token||!p.profileId||!confirm("Öffentliches Profil wirklich offline nehmen?"))return;
  try{await authCloudRequest("/api/profiles/me",{method:"DELETE"});saveProfileConfig({...p,profileId:"",editToken:""});$("profilePublishStatus").textContent="Profil wurde offline genommen.";$("profilePublishStatus").className="profile-publish-status good";toast("Profil offline","warn");renderPublicProfile()}catch(e){$("profilePublishStatus").textContent="Löschen fehlgeschlagen: "+e.message;$("profilePublishStatus").className="profile-publish-status bad"}
});

function render(){refreshSelectors();renderHome();renderExtras();renderGallery();renderLists();renderStats();renderVault();renderReminderManager();renderPublicProfile()}
$("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="JIGGY_Backup.json";a.click();URL.revokeObjectURL(a.href)}
$("importFile").onchange=async e=>{try{let s=JSON.parse(await e.target.files[0].text());state=Object.assign(blank(),s);save();render();show("home")}catch{alert("Backup konnte nicht gelesen werden.")}}
$("resetBtn").onclick=()=>{if(confirm("Wirklich alle lokalen JIGGY-Daten löschen?")){state=blank();save();render();show("home")}}
render();


/* JIGGY 1.5 - Statistics */
function scopedCars(){return $("statsCarFilter")?.value==="all"?state.cars:(car()?[car()]:[])}
function scopeIds(){return new Set(scopedCars().map(c=>c.id))}
function scoped(type){const ids=scopeIds();return (state[type]||[]).filter(x=>ids.has(x.carId))}
function sum(arr,key){return arr.reduce((a,x)=>a+(+x[key]||0),0)}
function calcFuelStats(rows){
 const sorted=[...rows].filter(x=>+x.km>0&&+x.liters>0).sort((a,b)=>(+a.km)-(+b.km));let liters=0,km=0,segments=0;
 for(let i=1;i<sorted.length;i++){const delta=(+sorted[i].km)-(+sorted[i-1].km);if(delta>20&&delta<2000){liters+=+sorted[i].liters||0;km+=delta;segments++}}
 return {consumption:km>0?liters/km*100:0,segments};
}
function renderCostBars(parts){
 const box=$("statsCostBars");if(!box)return;const max=Math.max(...parts.map(x=>x[1]),1);
 box.innerHTML=parts.map(([name,val])=>`<div class="stats-bar-row"><div><span>${name}</span><b>${money(val)}</b></div><div class="stats-bar-track"><i style="width:${Math.max(2,val/max*100)}%"></i></div></div>`).join("");
}
function drawMonthlyCosts(){
 const canvas=$("monthlyCostChart");if(!canvas)return;const ctx=canvas.getContext("2d"),ratio=window.devicePixelRatio||1,w=Math.max(600,canvas.clientWidth||900),h=300;canvas.width=w*ratio;canvas.height=h*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);
 const now=new Date(),months=[];for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,label:d.toLocaleDateString("de-DE",{month:"short"}),value:0})}
 const map=Object.fromEntries(months.map(x=>[x.key,x]));const add=(rows,key)=>rows.forEach(x=>{const k=String(x.date||"").slice(0,7);if(map[k])map[k].value+=+x[key]||0});add(scoped("fuel"),"cost");add(scoped("service"),"cost");add(scoped("builds").filter(x=>x.status==="Verbaut"),"price");
 ctx.clearRect(0,0,w,h);const max=Math.max(...months.map(x=>x.value),1),left=46,bottom=38,top=18,right=14,cw=w-left-right,ch=h-top-bottom,gap=10,bw=(cw-gap*(months.length-1))/months.length;ctx.font="11px Arial";ctx.textAlign="center";
 months.forEach((m,i)=>{const bh=m.value/max*(ch-20),x=left+i*(bw+gap),y=top+ch-bh;ctx.fillStyle="#2b2e34";ctx.fillRect(x,top,bw,ch);ctx.fillStyle="#e33434";ctx.fillRect(x,y,bw,bh);ctx.fillStyle="#8f949d";ctx.fillText(m.label,x+bw/2,h-14);if(m.value>0){ctx.fillStyle="#e9eaec";ctx.font="10px Arial";ctx.fillText(new Intl.NumberFormat("de-DE",{notation:"compact",maximumFractionDigits:1}).format(m.value)+" €",x+bw/2,Math.max(12,y-6));ctx.font="11px Arial"}});
}
function renderVehicleCompare(){
 const box=$("vehicleCostCompare");if(!box)return;if(!state.cars.length){box.innerHTML='<div class="empty">Noch keine Fahrzeuge.</div>';return}
 const rows=state.cars.map(c=>{const purchase=+c.purchase||0,fuel=sum(state.fuel.filter(x=>x.carId===c.id),"cost"),service=sum(state.service.filter(x=>x.carId===c.id),"cost"),builds=sum(state.builds.filter(x=>x.carId===c.id&&x.status==="Verbaut"),"price");return {c,total:purchase+fuel+service+builds}}).sort((a,b)=>b.total-a.total),max=Math.max(...rows.map(x=>x.total),1);
 box.innerHTML=rows.map(x=>`<div class="compare-row"><div class="compare-top"><strong>${esc(cname(x.c))}</strong><b>${money(x.total)}</b></div><div class="stats-bar-track"><i style="width:${Math.max(2,x.total/max*100)}%"></i></div></div>`).join("");
}
function renderStats(){
 if(!$("statsTotalCost"))return;const cars=scopedCars(),fuel=scoped("fuel"),service=scoped("service"),builds=scoped("builds").filter(x=>x.status==="Verbaut"),purchase=sum(cars,"purchase"),fuelCost=sum(fuel,"cost"),serviceCost=sum(service,"cost"),buildCost=sum(builds,"price"),total=purchase+fuelCost+serviceCost+buildCost,liters=sum(fuel,"liters"),fs=calcFuelStats(fuel);
 $("statsTotalCost").textContent=money(total);$("statsTotalSub").textContent=`${cars.length} Fahrzeug${cars.length===1?"":"e"} · inkl. Kaufpreis`;$("statsFuelCost").textContent=money(fuelCost);$("statsFuelSub").textContent=`${fuel.length} Tankung${fuel.length===1?"":"en"}`;$("statsConsumption").textContent=fs.consumption?`${fs.consumption.toFixed(1).replace(".",",")} l/100 km`:"—";$("statsBuildCost").textContent=money(buildCost);$("statsBuildSub").textContent=`${builds.length} Umbau${builds.length===1?"":"ten"}`;
 renderCostBars([["Kaufpreis",purchase],["Tanken",fuelCost],["Service",serviceCost],["Umbauten",buildCost]]);const avgLiter=liters?fuelCost/liters:0;$("statsFuelFacts").innerHTML=[["Getankte Menge",liters?`${num(liters.toFixed(1))} l`:"—"],["Ø Literpreis",avgLiter?`${avgLiter.toFixed(2).replace(".",",")} €/l`:"—"],["Verbrauchsintervalle",fs.segments],["Servicekosten",money(serviceCost)]].map(x=>`<div class="fact"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join("");drawMonthlyCosts();renderVehicleCompare();
}
$("statsCarFilter")?.addEventListener("change",renderStats);window.addEventListener("resize",()=>{if($("statsView")?.classList.contains("active"))drawMonthlyCosts()});

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
    const im=new Image();if(/^https?:/i.test(src))im.crossOrigin="anonymous";im.onload=()=>{shareImgCache.set(src,im);resolve(im)};im.onerror=()=>resolve(null);im.src=src;
  });
}
function findCarImage(c){
  const g=(state.gallery||[]).filter(x=>x.carId===c.id);
  return c.image||c.photo||c.imageData||g[0]?.data||g[0]?.src||g[0]?.image||c.exampleImage||null;
}
function drawCover(ctx,img,x,y,w,h){
  const ir=img.width/img.height, r=w/h;let sx=0,sy=0,sw=img.width,sh=img.height;
  if(ir>r){sw=img.height*r;sx=(img.width-sw)/2}else{sh=img.width/r;sy=(img.height-sh)/2}
  ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);
}
async function renderShareCard(){
  const c=shareActiveCar(),canvas=$("shareCanvas");if(!c||!canvas)return;
  let theme=$("shareTheme")?.value||"clean",format=$("shareFormat")?.value||"post";if(theme==="story")format="story";
  const sizes={post:[1080,1350],story:[1080,1920],wallpaper:[2560,1440],a4:[2480,3508],a3:[3508,4961]},[W,H]=sizes[format]||sizes.post;
  canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext("2d"),S=W/1080,title=shareCarTitle(c)||"MEIN FAHRZEUG",img=await loadShareImage(findCarImage(c));
  const accent=$("shareAccent")?.value||"#ed2636",zoom=(+$("shareZoom")?.value||100)/100,panX=(+$("sharePanX")?.value||0)/100,panY=(+$("sharePanY")?.value||0)/100;
  const plate=$("sharePlate")?.checked!==false,brand=$("shareBrand")?.checked!==false,showMods=$("shareMods")?.checked!==false;
  const mods=(state.builds||[]).filter(x=>x.carId===c.id&&/Verbaut|Erledigt|Fertig/i.test(x.status||"")).slice(-3).reverse();
  const tx=(t,x,y,size,w=800,col="#fff",align="left")=>{ctx.fillStyle=col;ctx.textAlign=align;ctx.font=`${w} ${size*S}px Arial`;ctx.fillText(String(t),x,y)};
  const fit=(t,max,size,min=18,w=900)=>{let s=size;while(s>min){ctx.font=`${w} ${s*S}px Arial`;if(ctx.measureText(t).width<=max)return s;s--}return min};
  const cover=(x,y,w,h,shade=0)=>{if(!img)return;ctx.save();roundedRect(ctx,x,y,w,h,22*S);ctx.clip();const ir=img.width/img.height,br=w/h;let dw,dh;if(ir>br){dh=h*zoom;dw=dh*ir}else{dw=w*zoom;dh=dw/ir}const fx=Math.max(0,dw-w),fy=Math.max(0,dh-h);ctx.drawImage(img,x+(w-dw)/2+panX*fx/2,y+(h-dh)/2+panY*fy/2,dw,dh);if(shade){ctx.fillStyle=`rgba(0,0,0,${shade})`;ctx.fillRect(x,y,w,h)}ctx.restore()};
  const footer=(col="#747a82")=>{if(brand){tx("JIGGY.",54*S,H-43*S,15,900,col);tx("YOUR CAR. YOUR STORY.",W-54*S,H-43*S,9,700,col,"right")}};

  if(theme==="clean"){
    ctx.fillStyle="#08090b";ctx.fillRect(0,0,W,H);const imageH=H*(format==="story"?.68:.60);cover(36*S,42*S,W-72*S,imageH,.04);
    let g=ctx.createLinearGradient(0,imageH*.70,0,imageH+90*S);g.addColorStop(0,"rgba(8,9,11,0)");g.addColorStop(1,"rgba(8,9,11,1)");ctx.fillStyle=g;ctx.fillRect(36*S,imageH*.66,W-72*S,imageH*.42);
    tx("JIGGY PERFORMANCE",58*S,78*S,11,900,"#fff");if(plate&&c.plate)tx(c.plate,W-58*S,78*S,13,800,"#fff","right");
    const titleY=imageH+40*S,hs=fit(title.toUpperCase(),W-116*S,format==="story"?58:50,28);tx(title.toUpperCase(),58*S,titleY,hs,900,"#fff");
    const sy=titleY+58*S;ctx.fillStyle=accent;ctx.fillRect(58*S,sy-18*S,78*S,3*S);
    const specGap=(W-116*S)/3;[[c.power?`${c.power} PS`:"—","LEISTUNG"],[c.torque?`${c.torque} NM`:"—","DREHMOMENT"],[(c.gearbox||"—").toUpperCase(),"GETRIEBE"]].forEach((sp,i)=>{const x=58*S+i*specGap;tx(sp[0],x,sy+24*S,format==="story"?25:22,900,"#fff");tx(sp[1],x,sy+48*S,10,700,"#838a94")});
    let my=sy+105*S;if(showMods&&mods.length){tx("VERBAUTE MODS",58*S,my,12,900,accent);mods.slice(0,format==="story"?3:2).forEach((m,i)=>tx(m.name,58*S,my+(38+i*34)*S,format==="story"?17:15,800,"#e7e9ec"))}footer();
  }else if(theme==="performance"){
    ctx.fillStyle="#050608";ctx.fillRect(0,0,W,H);ctx.fillStyle=accent;ctx.fillRect(0,0,12*S,H);cover(34*S,36*S,W-68*S,H*.64,.12);
    let g=ctx.createLinearGradient(0,H*.38,0,H*.76);g.addColorStop(0,"rgba(5,6,8,0)");g.addColorStop(1,"rgba(5,6,8,1)");ctx.fillStyle=g;ctx.fillRect(34*S,H*.35,W-68*S,H*.43);
    tx("JIGGY / PERFORMANCE DIVISION",52*S,72*S,11,900,"#fff");const hs=fit(title.toUpperCase(),W-104*S,58,30);tx(title.toUpperCase(),52*S,H*.61,hs,900,"#fff");
    tx([c.power&&`${c.power} PS`,c.torque&&`${c.torque} NM`].filter(Boolean).join("  /  "),52*S,H*.655,18,900,accent);
    let y=H*.72;if(showMods&&mods.length){tx("BUILD SHEET",52*S,y,11,900,"#7f8690");mods.forEach((m,i)=>tx(`0${i+1}  ${m.name}`,52*S,y+(39+i*34)*S,17,800,"#fff"))}if(plate&&c.plate)tx(c.plate,W-52*S,H*.655,16,800,"#fff","right");footer();
  }else{
    ctx.fillStyle="#07080a";ctx.fillRect(0,0,W,H);cover(34*S,115*S,W-68*S,H*.61,.08);let g=ctx.createLinearGradient(0,H*.48,0,H*.80);g.addColorStop(0,"rgba(7,8,10,0)");g.addColorStop(1,"rgba(7,8,10,1)");ctx.fillStyle=g;ctx.fillRect(0,H*.45,W,H*.38);
    tx("JIGGY STORY",48*S,72*S,12,900,accent);const hs=fit(title.toUpperCase(),W-96*S,56,29);tx(title.toUpperCase(),48*S,H*.69,hs,900,"#fff");
    tx([c.power&&`${c.power} PS`,c.torque&&`${c.torque} NM`,c.year].filter(Boolean).join("  ·  "),48*S,H*.728,18,800,"#cbd0d6");
    if(showMods&&mods.length){tx("BUILD",48*S,H*.778,11,900,accent);mods.slice(0,2).forEach((m,i)=>tx(m.name,48*S,H*(.805+i*.027),16,800,"#fff"))}if(plate&&c.plate)tx(c.plate,W-48*S,H*.728,15,800,"#fff","right");footer();
  }
}document.addEventListener("input",e=>{if(["shareZoom","sharePanX","sharePanY","shareAccent"].includes(e.target?.id))renderShareCard()});
function openShareCard(carId){
  shareCarId=carId||state.activeCarId;const m=document.getElementById("shareModal");if(!m)return;m.classList.add("open");m.setAttribute("aria-hidden","false");renderShareCard();
}
function closeShareCard(){const m=document.getElementById("shareModal");m?.classList.remove("open");m?.setAttribute("aria-hidden","true")}
async function shareCardBlob(){const c=document.getElementById("shareCanvas");return await new Promise(r=>c.toBlob(r,"image/png",1))}
async function downloadShareCard(){
  const blob=await shareCardBlob();if(!blob)return;const car=shareActiveCar();const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`JIGGY-${(shareCarTitle(car)||"Fahrzeug").replace(/[^a-z0-9äöüß]+/gi,"-")}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
}
async function nativeShareCard(){
  const blob=await shareCardBlob();if(!blob)return;const file=new File([blob],"JIGGY-Share.png",{type:"image/png"});
  if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({title:"JIGGY",text:"Mein Fahrzeug in JIGGY.",files:[file]});return}catch(e){if(e.name==="AbortError")return}}
  downloadShareCard();
}
function ensureShareButtons(){
  document.querySelectorAll(".car-card").forEach(card=>{
    if(card.querySelector(".share-car-btn"))return;
    const id=card.dataset.id||card.getAttribute("data-car-id");
    if(!id)return;
    const b=document.createElement("button");b.type="button";b.className="btn ghost share-car-btn";b.textContent="Poster Studio";b.addEventListener("click",e=>{e.stopPropagation();openShareCard(id)});card.appendChild(b);
  });
}
document.addEventListener("click",e=>{
  if(e.target?.id==="shareClose")closeShareCard();
  if(e.target?.id==="shareDownload")downloadShareCard();
  if(e.target?.id==="shareNative")nativeShareCard();
  if(e.target?.id==="shareModal")closeShareCard();
});

document.addEventListener("click",e=>{
  const card=e.target.closest(".poster-theme-card[data-theme]");
  if(!card)return;
  const input=document.getElementById("shareTheme");if(!input)return;
  input.value=card.dataset.theme;
  document.querySelectorAll(".poster-theme-card").forEach(x=>x.classList.toggle("active",x===card));
  renderShareCard();
});

document.addEventListener("change",e=>{if(["shareFormat","shareTheme","sharePlate","shareVin","shareMods","sharePurchase","shareBrand"].includes(e.target?.id))renderShareCard()});
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
  btn.textContent="↗ Poster Studio";
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


async function hydrateVehicleExampleImages(){
  if(!window.myGarageDesktop?.getVehicleImage || !state?.cars?.length) return;
  let changed=false;
  for(const c of state.cars){
    if(c.image) continue;
    const q=c.exampleImageQuery || [c.make,c.model,c.variant].filter(Boolean).join(" ");
    if(!q) continue;
    // Refresh old remote URLs and ensure imported/missing local cache URLs can be recreated.
    if(!c.exampleImage || /^https?:\/\//i.test(c.exampleImage)){
      try{
        const r=await window.myGarageDesktop.getVehicleImage(q,0);
        if(r?.ok){
          c.exampleImage=r.url||"";
          c.exampleImageSource=r.sourceUrl||c.exampleImageSource||"";
          c.exampleImageLicense=r.license||c.exampleImageLicense||"";
          c.exampleImageArtist=r.artist||c.exampleImageArtist||"";
          c.exampleImageQuery=q;
          changed=true;
        }
      }catch(e){console.warn("Example image refresh",e)}
    }
  }
  if(changed){save();renderHome();renderLists()}
}
setTimeout(hydrateVehicleExampleImages,500);


