const $ = id => document.getElementById(id);
const state = { data:null, programs:[], view:'overview', busy:false };
const make = (tag, value, className) => {
  const node=document.createElement(tag);
  if(value!==undefined && value!==null)node.textContent=String(value);
  if(className)node.className=className;
  return node;
};
const value = x => x===null || x===undefined || x==='' ? '—' : String(x);
const stamp = x => x ? new Date(x).toLocaleString() : '—';
const label = x => value(x).replaceAll('_',' ');
const lead = id => state.data.leads.find(item=>item.id===id) || {};
const student = id => lead(id).full_name || lead(id).normalized_phone || 'Student';
async function api(path, payload) {
  const options=payload===undefined ? {} : {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)};
  const response=await fetch(path,options);
  const result=await response.json();
  if(!response.ok)throw Error(result.error||'Request failed');
  return result;
}
function notice(message, error=false) {
  $('staffNotice').textContent=message;
  $('staffNotice').classList.toggle('error',error);
}
function empty(container, message) { container.replaceChildren(make('div',message,'empty')); }
function tag(status) {
  const className=['problem','rejected','cancelled'].includes(status)?'red':
    ['pending_approval','needs_review','sending','delivery_unknown'].includes(status)?'amber':'neutral';
  return make('span',label(status),'tag '+className);
}
function item(title, status, lines=[], body='') {
  const card=make('article',undefined,'record');
  const head=make('div',undefined,'record-head');
  const heading=make('div');heading.append(make('h3',title));head.append(heading);
  if(status)head.append(tag(status));card.append(head);
  if(body)card.append(make('p',body));
  for(const [caption,content] of lines) {
    const line=make('div',undefined,'detail-line');line.append(make('strong',caption+': '),make('span',value(content)));card.append(line);
  }
  return card;
}
function show(view) {
  state.view=view;
  for(const node of document.querySelectorAll('.staff-view'))node.hidden=node.id!==`view-${view}`;
  for(const node of document.querySelectorAll('[data-view]'))node.classList.toggle('active',node.dataset.view===view);
  const titles={integrations:['Channels & demo setup','Optional channels and current practice capabilities.'],overview:['Overview','Review every step before a message reaches the local test chat.'],queue:['Approval queue','Edit, approve or reject drafts before any test delivery.'],leads:['Leads','Saved profiles with one record per phone number.'],conversations:['Conversations','Student questions and staff-approved replies.'],documents:['Document results','Practice checks on clearly labeled fake PDFs.'],escalations:['Staff escalations','Questions the agents could not answer from the program list.'],activity:['Message history','Track drafts, decisions and local test delivery.'],programs:['Program list','The only program data used for automated answers.']};
  [$('pageTitle').textContent,$('pageSubtitle').textContent]=titles[view];
  window.scrollTo({top:0,behavior:'smooth'});
}
function renderQueue() {
  const pending=state.data.outbound_messages.filter(x=>x.status==='pending_approval');
  const recover=state.data.outbound_messages.filter(x=>x.status==='sending');
  $('queueCount').textContent=pending.length;
  const compact=$('overviewQueue'), full=$('queueList'), recovery=$('recoveryList');
  compact.replaceChildren();full.replaceChildren();recovery.replaceChildren();
  if(!pending.length){empty(compact,'No drafts awaiting approval.');empty(full,'Approval queue is empty.');}
  for(const draft of pending) {
    const lines=[['Type',label(draft.kind)],['Created',stamp(draft.created_at)],['Recipient',draft.recipient]];
    compact.append(item(student(draft.lead_id),draft.status,lines,draft.body));
    const card=item(student(draft.lead_id),draft.status,lines);
    const source=state.data.messages.filter(x=>x.conversation_id===draft.conversation_id&&x.direction==='inbound'&&x.created_at<=draft.created_at)
      .sort((a,b)=>b.created_at.localeCompare(a.created_at))[0];
    if(source){const context=make('div',undefined,'draft-context');context.append(make('small','Student asked'),make('p',source.body));card.append(context);}
    card.append(make('label','Reply to review','draft-label'));
    const text=make('textarea');text.value=draft.body||'';text.setAttribute('aria-label','Draft reply for '+student(draft.lead_id));
    const actions=make('div',undefined,'actions');
    for(const [action,caption,style] of [['approve','Approve and send','btn btn-small'],['reject','Reject draft','btn btn-outline btn-small']]) {
      const button=make('button',caption,style);button.type='button';
      button.addEventListener('click',()=>decide(draft,action,text,card));actions.append(button);
    }
    card.append(text,actions);full.append(card);
  }
  if(!recover.length)empty(recovery,'No deliveries need recovery.');
  for(const draft of recover) {
    const card=item(student(draft.lead_id),draft.status,[['Created',stamp(draft.created_at)]],draft.body);
    if(draft.channel==='test_chat'){
      const button=make('button','Reconcile local delivery','btn btn-outline btn-small');
      button.addEventListener('click',()=>decide(draft,'recover',null,card));card.append(button);
    }else card.append(make('p','Check the Meta provider delivery status before any manual action.','tiny'));
    recovery.append(card);
  }
}
async function decide(draft,action,editor,card) {
  if(state.busy)return;
  const body=editor?.value.trim();
  if(action==='approve'&&!body){notice('Approved message cannot be empty.',true);editor.focus();return;}
  state.busy=true;
  for(const button of card.querySelectorAll('button'))button.disabled=true;
  try {
    const result=await api(`/api/staff/outbound/${draft.id}/${action}`,action==='approve'?{body}:{});
    await refresh();notice(`${action==='approve'?'Approved':action==='reject'?'Rejected':'Recovered'} · ${label(result.status)}${result.channel?' via '+result.channel:''}.`);
  } catch(error){notice(error.message,true);for(const button of card.querySelectorAll('button'))button.disabled=false;}
  finally{state.busy=false;}
}
function renderLeads() {
  const query=$('leadSearch').value.toLowerCase().trim();
  const entries=state.data.leads.filter(x=>((x.full_name||'')+' '+(x.normalized_phone||'')).toLowerCase().includes(query));
  const box=$('leadsList');box.replaceChildren();if(!entries.length)empty(box,'No leads match this search.');
  for(const x of entries)box.append(item(x.full_name||'Name not collected',x.status,[
    ['Phone',x.normalized_phone||'Not provided (Facebook contact)'],['Country',x.preferred_country],['Marks',x.marks===null?'—':x.marks+'%'],
    ['IELTS',x.ielts_status==='taken'?value(x.ielts_score):label(x.ielts_status)],
    ['Budget',x.budget_amount===null?'—':`${x.budget_amount} ${value(x.budget_currency)}`],
    ['Last reply',stamp(x.last_reply_at)],['Created',stamp(x.created_at)]
  ]));
}
function renderConversations() {
  const box=$('conversationsList');box.replaceChildren();if(!state.data.conversations.length)empty(box,'No conversations yet.');
  for(const chat of state.data.conversations) {
    const messages=state.data.messages.filter(x=>x.conversation_id===chat.id).sort((a,b)=>a.created_at.localeCompare(b.created_at));
    const card=item(student(chat.lead_id),chat.channel,[['Started',stamp(chat.created_at)],['Messages',messages.length]]);
    for(const message of messages) {
      const line=make('div',undefined,'detail-line');
      line.append(make('strong',(message.direction==='inbound'?'Student':'Office approved')+' · '+stamp(message.created_at)+': '),make('span',message.body));card.append(line);
    }
    box.append(card);
  }
}
function renderDocuments() {
  const box=$('documentsList');box.replaceChildren();if(!state.data.documents.length)empty(box,'No fake test documents checked yet.');
  for(const x of state.data.documents)box.append(item(student(x.lead_id)+' · '+label(x.document_type),x.result,[
    ['Reason',x.reason],['Extracted name',x.extracted_fields?.name],['Checked',stamp(x.checked_at||x.created_at)]
  ]));
}
function renderEscalations() {
  const box=$('escalationsList');box.replaceChildren();
  $('escalationCount').textContent=state.data.escalations.filter(x=>x.status==='open').length;
  if(!state.data.escalations.length)empty(box,'No questions escalated to staff.');
  for(const x of state.data.escalations)box.append(item(student(x.lead_id),x.status,[['Reason',x.reason],['Created',stamp(x.created_at)]],x.question));
}
function renderActivity() {
  const outbound=$('outboundList'), audit=$('auditList'), overview=$('overviewActivity');
  outbound.replaceChildren();audit.replaceChildren();overview.replaceChildren();
  if(!state.data.outbound_messages.length)empty(outbound,'No outbound drafts yet.');
  for(const x of state.data.outbound_messages)outbound.append(item(student(x.lead_id)+' · '+label(x.kind),x.status,[['Recipient',x.recipient],['Created',stamp(x.created_at)],['Sent',stamp(x.sent_at)]],x.body));
  if(!state.data.audit_log.length)empty(audit,'No audited actions yet.');
  for(const x of state.data.audit_log)audit.append(item(label(x.action),null,[['Actor',x.actor_type],['Entity',x.entity_type],['When',stamp(x.created_at)]]));
  const combined=[...state.data.messages.map(x=>({when:x.created_at,title:student(x.lead_id)+' · '+(x.direction==='inbound'?'Question':'Approved reply'),body:x.body})),
    ...state.data.documents.map(x=>({when:x.checked_at||x.created_at,title:student(x.lead_id)+' · '+label(x.document_type),body:`${label(x.result)}: ${x.reason}`}))].sort((a,b)=>b.when.localeCompare(a.when)).slice(0,12);
  if(!combined.length)empty(overview,'No activity yet.');
  for(const x of combined)overview.append(item(x.title,null,[['When',stamp(x.when)]],x.body));
}
function renderPrograms() {
  const box=$('staffPrograms');box.replaceChildren();if(!state.programs.length)empty(box,'Program list unavailable.');
  for(const x of state.programs)box.append(item(x.university+' · '+x.program,x.country,[
    ['Fee',`${x.fee_text} per ${x.fee_period}`],['Deadline',x.deadline],['Minimum marks',x.min_marks+'%'],
    ['Minimum IELTS',x.min_ielts],['Documents',(x.required_documents||[]).join(', ')]
  ]));
}
function render() {
  const d=state.data;
  $('statLeads').textContent=d.leads.length;
  $('statPending').textContent=d.outbound_messages.filter(x=>x.status==='pending_approval').length;
  $('statProblems').textContent=d.documents.filter(x=>x.result==='problem').length;
  $('statSent').textContent=d.outbound_messages.filter(x=>x.status==='sent').length;
  renderQueue();renderLeads();renderConversations();renderDocuments();renderEscalations();renderActivity();renderPrograms();
}
async function refresh() {
  state.data=await api('/api/staff/dashboard');
  try{state.programs=(await api('/api/programs')).programs;}catch(error){state.programs=[];notice('Records loaded; program list unavailable: '+error.message,true);}
  $('loginWrap').hidden=true;$('staffPane').hidden=false;$('logoutButton').hidden=false;render();
}
async function login(event) {
  event.preventDefault();const button=$('loginButton');button.disabled=true;button.textContent='Signing in…';
  try {await api('/api/staff/login',{email:$('email').value.trim(),password:$('password').value});$('password').value='';await refresh();notice('Workspace ready. Drafts stay pending until you approve them.');}
  catch(error){$('loginNotice').textContent=error.message;$('loginNotice').classList.add('error');}
  finally{button.disabled=false;button.textContent='Sign in to workspace →';}
}
async function logout() {
  try {await api('/api/staff/logout',{});$('staffPane').hidden=true;$('logoutButton').hidden=true;$('loginWrap').hidden=false;state.data=null;notice('');$('loginNotice').textContent='Signed out.';}
  catch(error){notice(error.message,true);}
}
async function runReminders() {
  const button=$('reminderButton');button.disabled=true;
  try {const result=await api('/api/staff/reminders/run',{});await refresh();notice(`${result.created} reminder draft(s) created. Review the approval queue before sending.`);if(result.created)show('queue');}
  catch(error){notice(error.message,true);}
  finally{button.disabled=false;}
}
async function manualRefresh() {try{await refresh();notice('Records refreshed.');}catch(error){notice(error.message,true);}}
$('loginForm').addEventListener('submit',login);
$('logoutButton').addEventListener('click',logout);
$('refreshButton').addEventListener('click',manualRefresh);
$('sidebarRefresh').addEventListener('click',manualRefresh);
$('reminderButton').addEventListener('click',runReminders);
$('leadSearch').addEventListener('input',()=>{if(state.data)renderLeads();});
for(const node of document.querySelectorAll('[data-view]'))node.addEventListener('click',()=>show(node.dataset.view));
for(const node of document.querySelectorAll('[data-goto]'))node.addEventListener('click',()=>show(node.dataset.goto));
refresh().catch(()=>{$('loginWrap').hidden=false;});
api('/health').then(config=>{if(config.staff_auth_mode==='supabase'){$('emailField').hidden=false;$('email').required=true;$('passwordLabel').textContent='Staff account password';}}).catch(()=>{});
