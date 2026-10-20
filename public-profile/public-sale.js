// Shared by the editor and both public viewers. Only explicit public sale data.
export function parseSalePrice(value){
 const text=String(value??'').trim();
 if(!/^(?:\d{1,9}|\d{1,3}(?:\.\d{3}){1,2})(?:,\d{1,2})?$/.test(text))return null;
 const [euros,cents='']=text.replaceAll('.','').split(','),result=Number(euros)*100+Number(cents.padEnd(2,'0'));
 return Number.isSafeInteger(result)&&result>0&&result<=99999999900?result:null;
}
export function saleContact(contact){
 if(!contact||typeof contact.value!=='string')return null;
 const value=contact.value.trim();if(!value||/[\r\n\x00-\x1f]/.test(value))return null;
 if(contact.kind==='email'&&value.length<=254&&/^[A-Za-z0-9.!#$%&'*+/=^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}$/.test(value))return {kind:'email',value,href:'mailto:'+encodeURIComponent(value),label:'E-Mail schreiben',display:value};
 if(contact.kind==='phone'&&value.length<=40&&/^\+?[0-9 ()/\-]+$/.test(value)){
  const number=value.replace(/[ ()/\-]/g,'');if(/^\+?\d{7,20}$/.test(number))return {kind:'phone',value,href:'tel:'+number,label:'Anrufen',display:value};
 }
 if(contact.kind==='url'&&value.length<=1000){
  try{const url=new URL(value);if(url.protocol==='https:'&&!url.username&&!url.password&&url.hostname.includes('.')&&!/[\s<>"']/.test(value))return {kind:'url',value:url.href,href:url.href,label:'Inserat öffnen',display:url.hostname};}catch{}
 }
 return null;
}
export function validatePublicSale(value){
 if(!value?.enabled)return '';
 if(value.enabled!==true||value.version!==1)return 'Diese Verkaufsansicht kann hier nicht bearbeitet werden. Schalte sie aus oder lade den aktuellen Stand.';
 if(!['amount','request'].includes(value.priceKind))return 'Wähle eine Preisangabe aus.';
 if(value.priceKind==='amount'&&(!Number.isSafeInteger(value.priceCents)||value.priceCents<=0||value.priceCents>99999999900))return 'Gib einen gültigen Preis ein, z. B. 26.500 oder 26.500,50.';
 if(typeof value.description!=='string'||!value.description.trim()||value.description.trim().length>2000)return 'Ergänze eine Verkaufsbeschreibung mit höchstens 2.000 Zeichen.';
 if(!saleContact(value.contact))return 'Ergänze einen gültigen öffentlichen Kontakt: E-Mail, Telefonnummer oder HTTPS-Inserat-Link.';
 return '';
}
export function publicSaleSnapshot(value){
 if(value?.enabled!==true||validatePublicSale(value))return null;
 const contact=saleContact(value.contact);
 return {version:1,enabled:true,priceKind:value.priceKind,priceCents:value.priceKind==='amount'?value.priceCents:null,negotiable:value.priceKind==='amount'&&value.negotiable===true,description:value.description.trim(),contact:{kind:contact.kind,value:contact.value}};
}
export function salePrice(value){
 if(value?.priceKind==='request')return 'Preis auf Anfrage';
 return new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',minimumFractionDigits:value.priceCents%100?2:0,maximumFractionDigits:2}).format(value.priceCents/100)+(value.negotiable?' VB':'');
}
