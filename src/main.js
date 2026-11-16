import './style.css';
import project from '../content/project.json';
import components from '../content/components.json';
import materials from '../content/materials.json';
import resources from '../content/resources.json';
import budget from '../content/budget.json';
import { routeColors } from './topology.js';

const $ = (id) => document.getElementById(id);
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let model;
let selectedPart = 'overview';
let selectedRoute = 'all';
let flow = false;
let lightsOn = false;

function selectPart(id) {
  const part = components.find((c) => c.id === id) || components[0];
  selectedPart = part.id;
  $('component-detail').innerHTML = `<span class="eyebrow">${escape(part.kind)}</span><h3>${escape(part.name)}</h3><p>${escape(part.what)}</p><details><summary>Why it works</summary><p>${escape(part.why)}</p><p class="component-note">${escape(part.look)}</p></details>`;
  document.querySelectorAll('[data-part]').forEach((button) => {const active = button.dataset.part === part.id; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));});
  model?.selectPart(part.id);
}
$('component-list').innerHTML = components.map((part) => `<button type="button" data-part="${part.id}" aria-pressed="false"><span>${part.number}</span>${part.id === 'overview' ? 'Overview' : ({frame:'Frame',reservoir:'Reservoir',pump:'Pump',supply:'Supply tees',upper:'Upper channels',drops:'Level connections',lower:'Lower channels',return:'Return tees',lights:'Grow lights'})[part.id]}</button>`).join('');
$('component-list').addEventListener('click', (event) => { const button = event.target.closest('[data-part]'); if (button) selectPart(button.dataset.part); });
selectPart('overview');
$('model-note').textContent = project.modelNote;
$('current-state').textContent = project.status;
$('current-copy').textContent = project.now;
$('next-copy').textContent = project.next;
$('update-date').textContent = `Classroom update / ${new Date(project.updated + 'T12:00:00').toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'})}`;
$('driving-question').textContent = project.question;
$('curriculum').innerHTML = project.phases.map((phase, index) => `<details class="phase"><summary><span class="phase-number">0${index+1}</span><h3>${escape(phase.title)}</h3><span class="phase-status ${phase.status === 'Current focus' ? 'current' : ''}">${escape(phase.status)}</span></summary><div class="phase-body"><p class="eyebrow">${escape(phase.scope)}</p><p>${escape(phase.description)}</p><p><strong>Try:</strong> ${escape(phase.activity)}</p><p><strong>Look for:</strong> ${escape(phase.evidence)}</p>${phase.resources.length ? `<div class="phase-resources">${phase.resources.map(id=>{const r=resources.find(r=>r.id===id);return `<a href="${r.url}" target="_blank" rel="noopener">${escape(r.title)} ↗</a>`;}).join('')}</div>` : ''}</div></details>`).join('');
$('assessment').innerHTML = project.assessment.map((item) => `<div class="assessment-row"><span>${escape(item.label)}</span><strong>${item.weight}%</strong></div>`).join('');
$('flow-diagram').innerHTML = `<div class="diagram-header">Reservoir → Pump → Supply tees</div><div class="diagram-routes">${routeColors.map((color,index)=>`<div style="--route-color:${color}"><b>${index+1}</b><span>Upper ${index+1}</span><span aria-hidden="true">→</span><span>Lower ${index+1}</span></div>`).join('')}</div><div class="diagram-header">Return tees → Reservoir</div>`;

function updateFlow() {
  $('flow-toggle').setAttribute('aria-pressed', String(flow));
  $('flow-toggle').innerHTML = `<span aria-hidden="true">↝</span> ${flow ? 'Hide water flow' : 'Show water flow'}`;
  model?.setFlow(flow);
}
$('flow-toggle').addEventListener('click', () => { flow = !flow; updateFlow(); });
$('lights-toggle').addEventListener('click', () => {
  lightsOn = !lightsOn;
  $('lights-toggle').setAttribute('aria-pressed', String(lightsOn));
  $('lights-toggle').innerHTML = `<span class="light-dot" aria-hidden="true"></span> Lights ${lightsOn ? 'on' : 'off'}`;
  model?.setLights(lightsOn);
});
document.querySelectorAll('[data-route]').forEach((button) => button.addEventListener('click', () => {
  selectedRoute = button.dataset.route;
  document.querySelectorAll('[data-route]').forEach((b) => {const active = b === button; b.classList.toggle('active',active); b.setAttribute('aria-pressed',String(active));});
  $('route-status').textContent = selectedRoute === 'all' ? 'Four separate pairs share one supply and one return.' : `Route ${Number(selectedRoute)+1}: supply → upper ${Number(selectedRoute)+1} → lower ${Number(selectedRoute)+1} → return.`;
  flow = true; updateFlow(); model?.setRoute(selectedRoute);
}));

[...new Set(materials.map((item)=>item.category))].forEach((category)=>{ const option=document.createElement('option'); option.value=category; option.textContent=category; $('material-category').append(option); });
$('materials-total').textContent = `${materials.length} items +`;
function filterMaterials() {
  const query = $('material-search').value.trim().toLowerCase();
  const category = $('material-category').value;
  const filtered = materials.filter((item) => (category === 'all' || item.category === category) && Object.values(item).join(' ').toLowerCase().includes(query));
  $('material-rows').innerHTML = filtered.map((item)=>`<tr><th scope="row">${escape(item.name)}<span>${escape(item.category)}</span></th><td>${escape(item.quantity)}</td><td>${escape(item.purpose)}<small>${escape(item.note)}</small></td></tr>`).join('');
  $('material-count').textContent = `${filtered.length} of ${materials.length} materials`;
  $('no-materials').hidden = filtered.length > 0;
}
$('material-search').addEventListener('input',filterMaterials);
$('material-category').addEventListener('change',filterMaterials);
filterMaterials();
$('download-materials').addEventListener('click',()=>{
  const rows = [['Category','Material','Planning quantity','Role','Notes'], ...materials.map((i)=>[i.category,i.name,i.quantity,i.purpose,i.note])];
  const csv = rows.map((row)=>row.map((v)=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a'); link.href=url; link.download='mrk-hydroponics-materials.csv'; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
});
let printState = [];
window.addEventListener('beforeprint',()=>{printState=[...document.querySelectorAll('#syllabus details')].map(el=>[el,el.open]);printState.forEach(([el])=>el.open=true);});
window.addEventListener('afterprint',()=>printState.forEach(([el,open])=>el.open=open));
$('print-syllabus').addEventListener('click',()=>window.print());

// Keep the syllabus and materials available even when WebGL is unavailable.
import('./model.js').then(({createModel})=>{
  model = createModel($('model'), selectPart);
  model.selectPart(selectedPart); model.setLights(lightsOn); model.setFlow(flow); model.setRoute(selectedRoute);
}).catch((error)=>{
  console.error('3D view unavailable:',error);
  $('model').innerHTML = `<div class="model-fallback"><h3>The water path</h3><p>The 3D view isn’t available in this browser. Explore the same system using the component buttons below.</p>${$('flow-diagram').innerHTML}</div>`;
  document.querySelector('.model-toolbar').hidden = true;
});

function renderResources(type = 'all') {
  const shown = resources.filter(r=>type==='all'||r.type===type);
  $('resource-count').textContent = `${shown.length} ${shown.length === 1 ? 'resource' : 'resources'}`;
  $('resource-list').innerHTML = shown.map(r=>`<article class="resource-card"><div><p class="eyebrow">${escape(r.type)} · ${escape(r.meta)}</p><h3><a href="${r.url}" target="_blank" rel="noopener">${escape(r.title)} <span aria-hidden="true">↗</span></a></h3><p>${escape(r.description)}</p>${r.note ? `<details ${r.id === 'tees' ? 'open' : ''}><summary>Teaching note</summary><p>${escape(r.note)}</p></details>` : ''}</div><a class="resource-download" href="${r.url}" download aria-label="Download ${escape(r.title)}">${escape(r.format)} ↓</a></article>`).join('');
}
document.querySelectorAll('[data-resource-filter]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-resource-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  renderResources(button.dataset.resourceFilter);
}));
renderResources();
const money = cents => new Intl.NumberFormat('en-US',{style:'currency',currency:budget.currency}).format(cents/100);
const total = basis => budget.rows.filter(r=>r.basis===basis).reduce((n,r)=>n+r.totalCents,0);
$('budget-baseline').textContent = money(total('Listed purchase')+total('Frame estimate'));
$('budget-summary').innerHTML = [['Listed purchase','Parts marked purchased','Estimated line totals; receipts not reconciled.'],['Frame estimate','Frame allowance','Lumber, screws, and casters from the earlier plan.'],['Proposed addition','Later proposed additions','Separate from the baseline; confirm what is still needed.']].map(([basis,label,note])=>`<div><span>${label}<small>${note}</small></span><strong>${money(total(basis))}</strong></div>`).join('');
$('budget-rows').innerHTML = budget.rows.map(r=>`<tr><th scope="row">${escape(r.name)}<span>${escape(r.basis)} · ${escape(r.source)}</span>${r.note?`<small>${escape(r.note)}</small>`:''}</th><td>${r.quantity}</td><td>${money(r.totalCents)}</td></tr>`).join('');
$('budget-notes').innerHTML = budget.notes.map(note=>`<li>${escape(note)}</li>`).join('');
