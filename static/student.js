const $ = id => document.getElementById(id);
const state = { active:false, startId:null, startPhone:null, messageId:null, pendingText:null, programs:[], country:'All', starting:false, sending:false, selectedQuestion:null };
const setNotice = (id, message, error=false) => { const node=$(id); node.textContent=message; node.classList.toggle('error',error); };
const make = (tag, text, className) => { const node=document.createElement(tag); if(text!==undefined)node.textContent=String(text); if(className)node.className=className; return node; };
const key = () => crypto.randomUUID();
async function api(path, payload) {
  const opts = payload===undefined ? {} : {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)};
  const response=await fetch(path,opts);
  const result=await response.json();
  if(!response.ok)throw Error(result.error||'Request failed');
  return result;
}
function displayProfile(profile) {
  for(const id of ['full_name','preferred_country','marks','ielts_status','ielts_score','budget_amount','budget_currency']) {
    $(id).value=profile[id]??'';
  }
  $('phone').value=profile.normalized_phone||$('phone').value;
  toggleIelts();
  updateProgress();
}
function updateProgress() {
  const complete=[Boolean($('full_name').value.trim()),Boolean($('preferred_country').value),$('marks').value!=='',
    $('ielts_status').value==='not_taken'||($('ielts_status').value==='taken'&&$('ielts_score').value!==''),
    $('budget_amount').value!==''&&Boolean($('budget_currency').value)].filter(Boolean).length;
  $('profileProgress').textContent=`${complete} of 5`;
  $('progressFill').style.width=`${complete*20}%`;
  $('profileHelp').textContent=!state.active?'Start a chat to save your details.':complete===5?'Profile ready for staff review.':'Complete your details to help staff understand your plans.';
}
function activate(profile) {
  state.active=true;
  $('profileFields').disabled=false;
  $('documentFields').disabled=false;
  $('messageText').disabled=false;
  $('sendButton').disabled=false;
  $('startButton').textContent='Start a new chat →';
  $('sessionBadge').textContent='Chat active · '+(profile.full_name||profile.normalized_phone||'student');
  $('sessionBadge').className='tag';
  displayProfile(profile);
  if(state.selectedQuestion){$('messageText').value=state.selectedQuestion;state.selectedQuestion=null;}
}
function toggleIelts() {
  const taken=$('ielts_status').value==='taken';
  $('ielts_score').disabled=!taken;
  if(!taken)$('ielts_score').value='';
  updateProgress();
}
async function startChat(event) {
  event.preventDefault(); if(state.starting)return;
  const phone=$('phone').value.trim();
  if(!phone){setNotice('startNotice','Enter a test phone number.',true);return;}
  if(phone!==state.startPhone){state.startId=key();state.startPhone=phone;}
  state.starting=true;$('startButton').disabled=true;$('startButton').textContent='Starting…';
  setNotice('startNotice','Opening your conversation…');
  try {
    await api('/api/student/start',{phone,start_id:state.startId});
    const session=await api('/api/student/session');
    state.startId=null;state.startPhone=null;
    activate(session.profile);
    setNotice('startNotice','Chat ready. Save your profile or ask a question.');
    setNotice('messageNotice','New conversation started.');
    await refreshChat();
    $('workspace').scrollIntoView({behavior:'smooth'});
  } catch(error){setNotice('startNotice',error.message,true);}
  finally{state.starting=false;$('startButton').disabled=false;$('startButton').textContent=state.active?'Start a new chat →':'Start chat →';}
}
async function saveProfile(event) {
  event.preventDefault(); if(!state.active)return;
  const button=$('profileButton');button.disabled=true;button.textContent='Saving…';
  const details={};
  for(const id of ['full_name','preferred_country','marks','ielts_status','ielts_score','budget_amount','budget_currency']) {
    let value=$(id).value.trim();if(value!=='')details[id]=['marks','ielts_score','budget_amount'].includes(id)?Number(value):value;
  }
  if(details.ielts_status==='not_taken')details.ielts_score=null;
  try {await api('/api/student/details',details);setNotice('profileNotice','Profile saved. Staff can now see these details.');$('sessionBadge').textContent='Chat active · '+(details.full_name||$('phone').value);}
  catch(error){setNotice('profileNotice',error.message,true);}
  finally{button.disabled=false;button.textContent='Save profile';}
}
async function sendMessage(event) {
  event.preventDefault();if(!state.active||state.sending)return;
  const text=$('messageText').value.trim();
  if(!text){setNotice('messageNotice','Type a question first.',true);return;}
  if(text!==state.pendingText){state.messageId=key();state.pendingText=text;}
  state.sending=true;$('sendButton').disabled=true;$('sendButton').textContent='Saving…';
  setNotice('messageNotice','Saving your question…');
  try {
    await api('/api/student/message',{text,request_id:state.messageId});
    state.messageId=null;state.pendingText=null;$('messageText').value='';
    await refreshChat();
    setNotice('messageNotice','Question saved. The draft reply is waiting for staff approval.');
  } catch(error){setNotice('messageNotice',error.message,true);}
  finally{state.sending=false;$('sendButton').disabled=false;$('sendButton').textContent='Send question →';}
}
async function refreshChat() {
  if(!state.active){setNotice('messageNotice','Start a chat to see messages.');return;}
  try {
    const {messages}=await api('/api/student/messages');
    const box=$('chatWindow');box.replaceChildren();
    if(!messages.length){const empty=make('div',undefined,'chat-empty');empty.append(make('span','✧','empty-icon'),make('h3','Your chat is ready'),make('p','Ask about a program below. Replies appear after staff approval.'));box.append(empty);return;}
    for(const message of messages){const bubble=make('div',undefined,'bubble '+(message.direction==='outbound'?'outbound':''));bubble.append(make('small',message.direction==='inbound'?'You':'Office · staff approved'),make('div',message.body));box.append(bubble);}
    box.scrollTop=box.scrollHeight;
  } catch(error){setNotice('messageNotice',error.message,true);}
}
async function uploadDocument(event) {
  event.preventDefault();if(!state.active)return;
  const file=$('doc_file').files[0];if(!file){setNotice('documentNotice','Choose a fake test document.',true);return;}
  if(file.size>4_000_000||!['application/pdf','image/png','image/jpeg'].includes(file.type)){setNotice('documentNotice','Use a fake PDF, PNG or JPEG under 4 MB.',true);return;}
  const button=$('documentButton');button.disabled=true;button.textContent='Checking…';
  try {
    const encoded=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Could not read PDF'));reader.readAsDataURL(file);});
    const result=await api('/api/student/document',{type:$('doc_type').value,base64:encoded});
    const label={ok:'Checks passed',problem:'Problem found',needs_review:'Needs staff review'}[result.result]||result.result;
    setNotice('documentNotice',label+' · '+result.reason,result.result==='problem');
  } catch(error){setNotice('documentNotice',error.message,true);}
  finally{button.disabled=false;button.textContent='Upload and check';}
}
function filters() {
  const parent=$('countryFilters');parent.replaceChildren();
  for(const country of ['All',...new Set(state.programs.map(item=>item.country))]) {
    const button=make('button',country,'chip'+(state.country===country?' active':''));button.type='button';
    button.onclick=()=>{state.country=country;filters();renderPrograms();};parent.append(button);
  }
}
function renderPrograms() {
  const query=$('programSearch').value.trim().toLowerCase();
  const filtered=state.programs.filter(item=>(state.country==='All'||item.country===state.country)&&
    (item.university+' '+item.program+' '+item.country).toLowerCase().includes(query));
  const grid=$('programGrid');grid.replaceChildren();
  if(!filtered.length){grid.append(make('div','No programs match this search.','empty'));return;}
  for(const item of filtered) {
    const card=make('article',undefined,'panel program-card');
    card.append(make('span',item.country,'tag'),make('h3',item.university),make('p',item.program));
    const facts=make('div',undefined,'program-facts');
    for(const [label,value] of [['Fee',item.fee_text+' / '+item.fee_period],['Deadline',item.deadline],['Min. marks',Number(item.min_marks)+'%'],['Min. IELTS',item.min_ielts]]) {
      const cell=make('div');cell.append(make('small',label),make('strong',value));facts.append(cell);
    }
    const ask=make('button','Ask about this program →','btn btn-outline btn-small program-ask');ask.type='button';
    ask.addEventListener('click',()=>{
      const question=`What are the fee, deadline, and requirements for ${item.university} ${item.program}?`;
      if(state.active){$('messageText').value=question;$('workspace').scrollIntoView({behavior:'smooth'});$('messageText').focus();setNotice('messageNotice','Question prepared. Press Send question when ready.');}
      else{state.selectedQuestion=question;$('startForm').scrollIntoView({behavior:'smooth'});$('phone').focus();setNotice('startNotice','Program selected. Start a chat to ask about it.');}
    });
    card.append(facts,make('div','Documents: '+(item.required_documents||[]).join(', '),'program-docs'),ask);grid.append(card);
  }
}
async function loadPrograms() {
  try {const result=await api('/api/programs');state.programs=result.programs;$('programCount').textContent=`${state.programs.length} practice programs`;filters();renderPrograms();}
  catch(error){$('programGrid').replaceChildren(make('div','Program list unavailable: '+error.message,'empty'));}
}
async function restoreSession() {
  try {const session=await api('/api/student/session');activate(session.profile);setNotice('startNotice','Session restored. Select “Start a new chat” only when you want another conversation.');await refreshChat();}
  catch(error){if(!error.message.includes('Student session required'))setNotice('startNotice',error.message,true);}
}
$('startForm').addEventListener('submit',startChat);
$('profileForm').addEventListener('submit',saveProfile);
$('messageForm').addEventListener('submit',sendMessage);
$('documentForm').addEventListener('submit',uploadDocument);
$('refreshChat').addEventListener('click',refreshChat);
$('ielts_status').addEventListener('change',toggleIelts);
for(const id of ['full_name','preferred_country','marks','ielts_score','budget_amount','budget_currency'])$(id).addEventListener('input',updateProgress);
$('programSearch').addEventListener('input',renderPrograms);
updateProgress();loadPrograms();restoreSession();

for(const button of document.querySelectorAll('[data-channel-preview]'))button.addEventListener('click',()=>{
  const panel=$('channelPreview');panel.hidden=false;panel.replaceChildren();
  panel.append(make('h3',button.dataset.channelPreview+' — demo preview'),make('p','Inquiry → saved lead → program lookup → draft reply → staff approval → channel delivery after future setup.'),make('p','Nothing has been sent. Use website chat for the working demonstration.'));
  panel.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
});
