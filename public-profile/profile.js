import {publicSaleSnapshot,salePrice,saleContact} from './public-sale.js?v=55';
const API_URL="https://api.jiggy-cloud.org",root=document.getElementById("app");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function fail(msg){root.innerHTML=`<div class="error"><b>JIGGY.</b><h2>Profil nicht verfügbar</h2><p>${esc(msg)}</p></div>`}
const fmtDate=d=>{try{return new Date(d).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"})}catch{return""}};
async function run(){
 const id=new URLSearchParams(location.search).get("id");if(!id)return fail("Im Link fehlt die Profil-ID.");
 try{const r=await fetch(`${API_URL}/api/profiles/${encodeURIComponent(id)}`);if(r.status===404)return fail("Dieses Profil ist offline oder wurde gelöscht.");if(!r.ok)throw new Error(`HTTP ${r.status}`);const row=await r.json();render(row.profile||{},row.updatedAt,id)}catch(e){fail("Das Profil konnte gerade nicht geladen werden.")}
}

// JIGGY_GALLERY_1: only explicitly published snapshots; never request private media.
function safeImage(value){
 if(typeof value!=='string')return '';
 if(/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i.test(value)&&value.length<3000000)return value;
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.pathname.startsWith('/api/media')?u.href:'';}catch{return '';}
}
function renderGallery(value){
 const photos=(Array.isArray(value)?value:[]).map(p=>({image:safeImage(typeof p==='string'?p:p?.image),caption:typeof p?.caption==='string'?p.caption.slice(0,200):''})).filter(p=>p.image).slice(0,5);
 if(!photos.length)return '';
 return `<section class="section public-gallery" aria-label="Veröffentlichte Fahrzeuggalerie"><div class="section-head"><div><small>ALLE SEITEN DEINES BUILDS</small><h2>Galerie</h2></div><span>${photos.length} freigegebene Fotos</span></div><div class="public-gallery-track" tabindex="0" aria-label="Fotos durchwischen">${photos.map((p,i)=>`<figure><img src="${esc(p.image)}" alt="Fahrzeugfoto ${i+1}" loading="${i?'lazy':'eager'}" referrerpolicy="no-referrer">${p.caption?`<figcaption>${esc(p.caption)}</figcaption>`:''}</figure>`).join('')}</div><div class="public-gallery-controls"><button type="button" aria-label="Vorheriges Foto">←</button><span aria-live="polite">1 von ${photos.length}</span><button type="button" aria-label="Nächstes Foto">→</button></div></section>`;
}
function setupGallery(){
 const section=root.querySelector('.public-gallery');if(!section)return;
 const track=section.querySelector('.public-gallery-track'),prev=section.querySelector('[aria-label="Vorheriges Foto"]'),next=section.querySelector('[aria-label="Nächstes Foto"]'),status=section.querySelector('[aria-live]'),count=track.children.length;
 let index=0;const update=()=>{index=Math.max(0,Math.min(count-1,Math.round(track.scrollLeft/track.clientWidth)));status.textContent=`${index+1} von ${count}`;prev.disabled=index===0;next.disabled=index===count-1;};
 const go=i=>track.scrollTo({left:Math.max(0,Math.min(count-1,i))*track.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 prev.onclick=()=>go(index-1);next.onclick=()=>go(index+1);track.addEventListener('scroll',update);track.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();go(index+(e.key==='ArrowRight'?1:-1));}});update();
}


// Only explicit public snapshots; no garage or private media requests.
function renderHighlights(profile){
 const mods=Array.isArray(profile.mods)?profile.mods:[],allowed=new Set(mods.filter(Boolean).map(mod=>String(mod.name||'')+'\0'+String(mod.category||''))),seen=new Set();
 const items=(Array.isArray(profile.showcase?.highlights)?profile.showcase.highlights:[]).filter(item=>{if(!item||typeof item.name!=='string')return false;const key=item.name+'\0'+String(item.category||'');if(!allowed.has(key)||seen.has(key))return false;seen.add(key);return true;}).slice(0,3);
 if(!items.length)return '';
 return `<section class="section showcase-highlights" aria-label="Umbau-Highlights"><div class="section-head"><div><small>DAS MACHT DEN BUILD BESONDERS</small><h2>Umbau-Highlights</h2></div><span>Vom Besitzer ausgewählt</span></div><div class="showcase-highlight-grid">${items.map(item=>{const image=safeImage(item.image);return `<article class="showcase-highlight">${image?`<img src="${esc(image)}" alt="${esc(item.name.slice(0,200))}" loading="lazy" referrerpolicy="no-referrer">`:''}<div><small>${esc(String(item.category||'UMBAU').slice(0,100))}</small><h3>${esc(item.name.slice(0,200))}</h3>${item.description?`<p>${esc(String(item.description).slice(0,240))}</p>`:''}</div></article>`;}).join('')}</div></section>`;
}

function render(p,updated,slug){
 const c=p.car||{},s=c.specs||{},mods=Array.isArray(p.mods)?p.mods:[],theme=["signature","street","clean"].includes(p.theme)?p.theme:"signature",heroImage=safeImage(c.image),sale=publicSaleSnapshot(p.sale);
 const specItems=[s.power&&[s.power,"PS"],s.torque&&[s.torque,"NM"],c.year&&[c.year,"Baujahr"],s.fuel&&[s.fuel,"Kraftstoff"],s.gearbox&&[s.gearbox,"Getriebe"]].filter(Boolean);
 root.innerHTML=`<div class="theme-${theme}"><div class="top"><div class="brand">JIGGY<i>.</i></div><div class="tag">YOUR CAR. YOUR STORY.</div></div>
 <section class="hero"><div class="hero-media">${heroImage?`<img referrerpolicy="no-referrer" src="${esc(heroImage)}" alt="${esc(p.displayName||"")}">`:`<div class="fallback">JIGGY.</div>`}</div>${sale?'<span class="public-for-sale">ZU VERKAUFEN</span>':''}<span class="profile-id">JIGGY PUBLIC PROFILE</span><div class="hero-content"><div class="eyebrow">JIGGY IDENTITY</div><h1>${esc(p.displayName||[c.make,c.model,c.variant].filter(Boolean).join(" ")||"Vehicle")}</h1>${sale?`<div class="hero-sale-price">${esc(salePrice(sale))}</div>`:''}${p.bio?`<div class="bio">${esc(p.bio)}</div>`:""}<div class="chips">${[c.make,c.model,c.variant,c.plate].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join("")}</div></div></section>
 ${renderSale(p.sale)}
 ${renderHighlights(p)}
 ${specItems.length?`<section class="section"><div class="section-head"><div><small>PERFORMANCE</small><h2>Technische Daten</h2></div><span>Die freigegebenen Daten dieses Builds</span></div><div class="specs">${specItems.map(x=>`<div class="spec"><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div>`).join("")}</div></section>`:""}
 ${(c.mileage!==null&&c.mileage!==undefined)||c.plate?`<section class="section"><div class="section-head"><div><small>IDENTITY</small><h2>Fahrzeugdetails</h2></div><span>Vom Besitzer freigegeben</span></div><div class="public-details">${c.mileage!==null&&c.mileage!==undefined?`<div><span>Kilometerstand</span><b>${Number(c.mileage||0).toLocaleString("de-DE")} km</b></div>`:""}${c.plate?`<div><span>Kennzeichen</span><b>${esc(c.plate)}</b></div>`:""}</div></section>`:""}
 ${mods.length?`<section class="section"><div class="section-head"><div><small>THE BUILD</small><h2>Umbauten</h2></div><span>${mods.length} ${mods.length===1?"Mod":"Mods"}</span></div><div class="build-grid">${mods.map((x,i)=>`<div class="build"><small>${esc(x.category||`MOD ${String(i+1).padStart(2,"0")}`)}</small><b>${esc(x.name)}</b>${x.date?`<time>${fmtDate(x.date)}</time>`:""}</div>`).join("")}</div></section>`:""}
 ${renderGallery(p.gallery)}
 <div class="footer"><span>Made with JIGGY. · Your car. Your story.</span><span>${updated?`Aktualisiert ${fmtDate(updated)}`:""}</span></div></div>`;
 setupGallery();
 setupShowcase();
 document.title=(p.displayName||"Fahrzeugprofil")+" · JIGGY";
}
run();


function setupShowcase(){
 document.body.classList.toggle('public-clean',Boolean(root.querySelector('.theme-clean')));
 const sections=[['.public-sale-view','angebot','Verkauf'],['.public-gallery','galerie','Galerie'],['.showcase-highlights','highlights','Highlights'],['.specs','daten','Daten'],['.build-grid','umbauten','Umbauten']];
 const nav=document.createElement('nav');nav.className='showcase-nav';nav.setAttribute('aria-label','Fahrzeugprofil Bereiche');
 for(const [selector,id,label] of sections){const node=root.querySelector(selector);if(!node)continue;const section=node.closest('section');section.id=id;const a=document.createElement('a');a.href='#'+id;a.textContent=label;nav.append(a);}
 const share=document.createElement('button');share.type='button';share.textContent='Profil teilen';share.className='showcase-share';nav.append(share);
 const notice=document.createElement('span');notice.className='showcase-share-notice';notice.setAttribute('role','status');nav.append(notice);
 share.onclick=async()=>{notice.textContent='';try{if(navigator.share)await navigator.share({title:document.title,url:location.href});else{await navigator.clipboard.writeText(location.href);notice.textContent='Link kopiert';}}catch(e){if(e.name!=='AbortError')notice.textContent='Du kannst den Profil-Link aus der Adressleiste kopieren.';}};
 root.querySelector('.hero').after(nav);
 const photos=[...root.querySelectorAll('.public-gallery-track figure')];
 if(!photos.length)return;
 const dialog=document.createElement('dialog');dialog.className='showcase-lightbox';dialog.setAttribute('aria-label','Fahrzeugfoto in Großansicht');
 const close=document.createElement('button');close.textContent='Schließen ×';close.className='lightbox-close';close.type='button';close.onclick=()=>dialog.close();
 const image=document.createElement('img');image.referrerPolicy='no-referrer';const caption=document.createElement('p');
 const controls=document.createElement('div');controls.className='lightbox-controls';const prev=document.createElement('button'),next=document.createElement('button'),count=document.createElement('span');prev.textContent='←';next.textContent='→';prev.setAttribute('aria-label','Vorheriges Bild in Großansicht');next.setAttribute('aria-label','Nächstes Bild in Großansicht');count.setAttribute('aria-live','polite');controls.append(prev,count,next);dialog.append(close,image,caption,controls);root.append(dialog);
 let index=0,opener=null;const show=i=>{index=Math.max(0,Math.min(photos.length-1,i));const original=photos[index].querySelector('img');image.src=original.src;image.alt=original.alt;caption.textContent=photos[index].querySelector('figcaption')?.textContent||'';count.textContent=(index+1)+' / '+photos.length;prev.disabled=index===0;next.disabled=index===photos.length-1;};
 prev.onclick=()=>show(index-1);next.onclick=()=>show(index+1);
 dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();show(index+(e.key==='ArrowRight'?1:-1));}});
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});dialog.addEventListener('close',()=>{document.body.classList.remove('lightbox-open');opener?.focus();});
 photos.forEach((figure,i)=>{const original=figure.querySelector('img'),button=document.createElement('button');button.type='button';button.className='gallery-open';button.setAttribute('aria-label','Fahrzeugfoto '+(i+1)+' vergrößern');original.before(button);button.append(original);button.onclick=()=>{show(i);opener=button;dialog.showModal();document.body.classList.add('lightbox-open');};});
}


function renderSale(value){
 const sale=publicSaleSnapshot(value);if(!sale)return '';const contact=saleContact(sale.contact);
 return `<section id="angebot" class="section public-sale-view" aria-label="Fahrzeugangebot"><div class="section-head"><div><small>DIESER BUILD SUCHT EIN NEUES ZUHAUSE</small><h2>Zu verkaufen</h2></div><span>Angaben des Besitzers</span></div><div class="sale-view-grid"><div><strong class="sale-view-price">${esc(salePrice(sale))}</strong><p class="sale-view-description">${esc(sale.description)}</p></div><aside><small>INTERESSE AN DIESEM AUTO?</small><h3>Direkt Kontakt aufnehmen</h3><p>${esc(contact.display)}</p><a class="sale-contact-button" href="${esc(contact.href)}" ${contact.kind==='url'?'target="_blank" rel="noopener noreferrer nofollow"':''}>${esc(contact.label)} ↗</a><span>Du kontaktierst den Besitzer über seinen gewählten Kontaktweg.</span></aside></div></section>`;
}
