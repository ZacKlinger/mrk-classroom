import { readFileSync } from 'node:fs';
const read = name => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url), 'utf8'));
const project=read('project'),components=read('components'),materials=read('materials');
function requireValue(condition,message){if(!condition)throw new Error(message);}
for(const field of ['title','status','updated','now','next','question','modelNote'])requireValue(typeof project[field]==='string'&&project[field].trim(),`Project needs ${field}`);
requireValue(/^\d{4}-\d{2}-\d{2}$/.test(project.updated),'Use YYYY-MM-DD for the update date');
requireValue(project.assessment.reduce((n,a)=>n+a.weight,0)===100,'Assessment weights must total 100');
requireValue(new Set(components.map(c=>c.id)).size===components.length,'Component IDs must be unique');
for(const id of ['overview','frame','reservoir','pump','supply','upper','drops','lower','return','lights'])requireValue(components.some(c=>c.id===id),`Missing component ${id}`);
for(const item of components)for(const key of ['id','name','kind','what','why','look'])requireValue(typeof item[key]==='string'&&item[key].trim(),`Component missing ${key}`);
for(const item of materials)for(const key of ['category','name','quantity','purpose','note'])requireValue(typeof item[key]==='string'&&item[key].trim(),`Material missing ${key}`);
console.log(`Content valid: ${project.phases.length} syllabus phases, ${components.length} component guides, ${materials.length} materials.`);
