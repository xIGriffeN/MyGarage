/* Uses the existing account API without changing local garage storage. */
document.getElementById('accountForgotPassword')?.addEventListener('click', () => {
  const modal=document.getElementById('accountRecoveryDialog');
  modal.querySelector('[name=email]').value=document.getElementById('accountEmail')?.value || '';
  modal.querySelector('[role=status]').textContent='';modal.showModal();
});
document.getElementById('accountRecoveryCancel')?.addEventListener('click',()=>document.getElementById('accountRecoveryDialog').close());
document.getElementById('accountRecoveryForm')?.addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget,button=form.querySelector('[type=submit]'),status=form.querySelector('[role=status]');
  button.disabled=true;status.textContent='Link wird angefordert …';
  try {
    const result=await cloudRequest('/api/auth/forgot-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.elements.email.value.trim()})});
    status.textContent=result.message;button.textContent='Link erneut anfordern';
  } catch(error){status.textContent=error.message || 'Anfrage konnte nicht verarbeitet werden.';}
  finally{button.disabled=false;}
});
