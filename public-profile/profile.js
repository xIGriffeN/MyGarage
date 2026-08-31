const cfg=window.JIGGY_PUBLIC_CONFIG||{},root=document.getElementById("app");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function fail(msg){root.innerHTML=`<div class="error"><b>JIGGY.</b><h2>Profil nicht verfügbar</h2><p>${esc(msg)}</p></div>`}
const fmtDate=d=>{try{return new Date(d).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"})}catch{return""}};
async function run(){
 const slug=new URLSearchParams(location.search).get("id");if(!slug)return fail("Im Link fehlt die Profil-ID.");
 if(!cfg.supabaseUrl||!cfg.anonKey||cfg.supabaseUrl.includes("DEIN-PROJEKT"))return fail("Das öffentliche Profil wurde noch nicht mit Supabase verbunden.");
 try{const r=await fetch(`${cfg.supabaseUrl.replace(/\/$/,"")}/rest/v1/vehicle_profiles?slug=eq.${encodeURIComponent(slug)}&select=payload,updated_at&limit=1`,{headers:{apikey:cfg.anonKey,Authorization:`Bearer ${cfg.anonKey}`}});if(!r.ok)throw new Error(`HTTP ${r.status}`);const rows=await r.json();if(!rows.length)return fail("Dieses Profil ist offline oder wurde gelöscht.");render(rows[0].payload||{},rows[0].updated_at,slug)}catch(e){fail("Das Profil konnte gerade nicht geladen werden.")}
}
function render(p,updated,slug){
 const c=p.car||{},s=c.specs||{},mods=Array.isArray(p.mods)?p.mods:[],theme=esc(p.theme||"signature");
 const specItems=[s.power&&[s.power,"PS"],s.torque&&[s.torque,"NM"],c.year&&[c.year,"Baujahr"],s.fuel&&[s.fuel,"Kraftstoff"],s.gearbox&&[s.gearbox,"Getriebe"]].filter(Boolean);
 root.innerHTML=`<div class="theme-${theme}"><div class="top"><div class="brand">JIGGY<i>.</i></div><div class="tag">YOUR CAR. YOUR STORY.</div></div>
 <section class="hero"><div class="hero-media">${c.image?`<img src="${c.image}" alt="${esc(p.displayName||"")}">`:`<div class="fallback">JIGGY.</div>`}</div><span class="profile-id">JIGGY PUBLIC PROFILE</span><div class="hero-content"><div class="eyebrow">JIGGY IDENTITY</div><h1>${esc(p.displayName||[c.make,c.model,c.variant].filter(Boolean).join(" ")||"Vehicle")}</h1>${p.bio?`<div class="bio">${esc(p.bio)}</div>`:""}<div class="chips">${[c.make,c.model,c.variant,c.plate].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join("")}</div></div></section>
 ${specItems.length?`<section class="section"><div class="section-head"><div><small>PERFORMANCE</small><h2>Vehicle Specs</h2></div><span>Die freigegebenen Daten dieses Builds</span></div><div class="specs">${specItems.map(x=>`<div class="spec"><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div>`).join("")}</div></section>`:""}
 ${(c.mileage!==null&&c.mileage!==undefined)||c.plate?`<section class="section"><div class="section-head"><div><small>IDENTITY</small><h2>Vehicle Details</h2></div><span>Vom Besitzer freigegeben</span></div><div class="public-details">${c.mileage!==null&&c.mileage!==undefined?`<div><span>Kilometerstand</span><b>${Number(c.mileage||0).toLocaleString("de-DE")} km</b></div>`:""}${c.plate?`<div><span>Kennzeichen</span><b>${esc(c.plate)}</b></div>`:""}</div></section>`:""}
 ${mods.length?`<section class="section"><div class="section-head"><div><small>THE BUILD</small><h2>Umbauten</h2></div><span>${mods.length} ${mods.length===1?"Mod":"Mods"}</span></div><div class="build-grid">${mods.map((x,i)=>`<div class="build"><small>${esc(x.category||`MOD ${String(i+1).padStart(2,"0")}`)}</small><b>${esc(x.name)}</b>${x.date?`<time>${fmtDate(x.date)}</time>`:""}</div>`).join("")}</div></section>`:""}
 <div class="footer"><span>Made with JIGGY. · Your car. Your story.</span><span>${updated?`Updated ${fmtDate(updated)}`:""}</span></div></div>`;
}
run();
