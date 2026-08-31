
const cfg=window.JIGGY_PUBLIC_CONFIG||{},root=document.getElementById("app");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function fail(msg){root.innerHTML=`<div class="error"><b>JIGGY.</b><h2>Profil nicht verfügbar</h2><p>${esc(msg)}</p></div>`}
async function run(){
 const slug=new URLSearchParams(location.search).get("id");if(!slug)return fail("Im Link fehlt die Profil-ID.");
 if(!cfg.supabaseUrl||!cfg.anonKey||cfg.supabaseUrl.includes("DEIN-PROJEKT"))return fail("Das öffentliche Profil wurde noch nicht mit Supabase verbunden.");
 try{
  const r=await fetch(`${cfg.supabaseUrl.replace(/\/$/,"")}/rest/v1/vehicle_profiles?slug=eq.${encodeURIComponent(slug)}&select=payload,updated_at&limit=1`,{headers:{apikey:cfg.anonKey,Authorization:`Bearer ${cfg.anonKey}`}});
  if(!r.ok)throw new Error(`HTTP ${r.status}`);const rows=await r.json();if(!rows.length)return fail("Dieses Profil ist offline oder wurde gelöscht.");
  render(rows[0].payload||{},rows[0].updated_at)
 }catch(e){fail("Das Profil konnte gerade nicht geladen werden.")}
}
function render(p,updated){
 const c=p.car||{},s=c.specs||{},mods=Array.isArray(p.mods)?p.mods:[];
 root.innerHTML=`<div class="top"><div class="brand">JIGGY.</div><div class="tag">YOUR CAR. YOUR STORY.</div></div>
 <article class="profile theme-${esc(p.theme||"signature")}">
  <div class="photo">${c.image?`<img src="${c.image}" alt="">`:`<div class="fallback">JIGGY.</div>`}<span class="badge">PUBLIC VEHICLE PROFILE</span></div>
  <div class="copy"><small>JIGGY IDENTITY</small><h1>${esc(p.displayName||[c.make,c.model,c.variant].filter(Boolean).join(" ")||"Vehicle")}</h1><p>${esc(p.bio||"")}</p>
   ${c.specs?`<div class="specs"><div><b>${esc(s.power||"—")}</b><span>PS</span></div><div><b>${esc(s.torque||"—")}</b><span>NM</span></div><div><b>${esc(c.year||"—")}</b><span>YEAR</span></div></div>`:""}
   <div class="meta">${[c.fuel,c.gearbox,c.mileage?`${Number(c.mileage).toLocaleString("de-DE")} km`:"",c.plate].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join("")}</div>
   ${mods.length?`<div class="mods"><h3>JIGGY BUILD</h3><div>${mods.map(x=>`<span>${esc(x.name)}</span>`).join("")}</div></div>`:""}
  </div>
 </article><div class="footer"><span>Made with JIGGY.</span><span>${updated?`Updated ${new Date(updated).toLocaleDateString("de-DE")}`:""}</span></div>`;
}
run();
