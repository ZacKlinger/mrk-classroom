import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { routePoints, routeDepths, routeColors } from './topology.js';

export function createModel(container, onSelect) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#dce6bd');
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  container.replaceChildren(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', '3D hydroponics system. Arrow keys rotate; plus and minus zoom. Components can also be selected using the list below.');
  renderer.domElement.tabIndex = 0;
  const controls = new OrbitControls(camera,renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 3;
  controls.maxDistance = 14;
  controls.minPolarAngle = 0.05;
  controls.maxPolarAngle = Math.PI * .49;
  controls.target.set(-.25,1.35,0);

  scene.add(new THREE.HemisphereLight('#fffdf4','#9ba77d',3));
  const sun = new THREE.DirectionalLight('#fff8ed',4);
  sun.position.set(-3,7,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=5;sun.shadow.camera.bottom=-5;
  sun.shadow.normalBias=.025;scene.add(sun);
  const fill = new THREE.DirectionalLight('#d3e9f1',1.3);fill.position.set(4,3,-4);scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.13}));
  floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;floor.position.y=.005;scene.add(floor);
  const root=new THREE.Group();scene.add(root);
  const groups={}; const pickable=[]; const materialsByPart={}; const channelMaterials=[];
  let selected='overview',flow=false,route='all',visible=true,disposed=false;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');

  function group(id){if(!groups[id]){groups[id]=new THREE.Group();root.add(groups[id]);}return groups[id];}
  const woodCanvas=document.createElement('canvas');woodCanvas.width=64;woodCanvas.height=512;
  const ctx=woodCanvas.getContext('2d');ctx.fillStyle='#bd9a71';ctx.fillRect(0,0,64,512);
  let seed=42; const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<140;i++){const x=random()*64;ctx.strokeStyle=`rgba(85,53,26,${.03+random()*.11})`;ctx.lineWidth=.4+random();ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+random()*7,160,x-random()*7,340,x+random()*4,512);ctx.stroke();}
  const woodTexture=new THREE.CanvasTexture(woodCanvas);woodTexture.colorSpace=THREE.SRGBColorSpace;
  const wood=new THREE.MeshStandardMaterial({color:'#ebca9e',map:woodTexture,roughness:.85});
  const white=new THREE.MeshStandardMaterial({color:'#f5f3e7',roughness:.36});
  const green=new THREE.MeshStandardMaterial({color:'#39a8a0',roughness:.38});
  const dark=new THREE.MeshStandardMaterial({color:'#263830',roughness:.8});
  const metal=new THREE.MeshStandardMaterial({color:'#9bada7',metalness:.7,roughness:.4});
  const tubeMaterial=new THREE.MeshStandardMaterial({color:'#507b76',roughness:.5});
  const pink=new THREE.MeshStandardMaterial({color:'#fbe2e7',emissive:'#ed8dac',emissiveIntensity:.5,roughness:.3});
  function mesh(geometry,material,id){const own=material.clone();const m=new THREE.Mesh(geometry,own);m.castShadow=true;m.receiveShadow=true;m.userData.part=id;group(id).add(m);pickable.push(m);(materialsByPart[id]??=[]).push(own);return m;}
  function box(size,position,mat,id){const m=mesh(new THREE.BoxGeometry(...size),mat,id);m.position.set(...position);return m;}
  function cylinder(a,b,r,mat,id){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);const m=mesh(new THREE.CylinderGeometry(r,r,start.distanceTo(end),20),mat,id);m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());return m;}
  function beam(a,b,width=.095,depth=.095){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);const m=mesh(new THREE.BoxGeometry(width,start.distanceTo(end),depth),wood,'frame');m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());return m;}
  function tube(points,id,r=.022,mat=tubeMaterial){for(let i=1;i<points.length;i++)cylinder(points[i-1],points[i],r,mat,id);for(const p of points.slice(1,-1)){const joint=mesh(new THREE.SphereGeometry(r,12,8),mat,id);joint.position.set(...p);}}

  // Four uprights and three rectangular rails. Measurements are illustrative model units.
  for(const x of [-1.32,1.32])for(const z of [-.78,.78]){
    box([.105,2.39,.105],[x,1.495,z],wood,'frame');
    const wheel=mesh(new THREE.CylinderGeometry(.115,.115,.075,24),dark,'frame');wheel.rotation.x=Math.PI/2;wheel.position.set(x,.125,z);
    box([.055,.17,.1],[x,.23,z],metal,'frame');
  }
  for(const y of [.34,1.69,2.66]){
    for(const z of [-.78,.78])box([2.75,.115,.085],[0,y,z],wood,'frame');
    for(const x of [-1.32,1.32])box([.09,.115,1.64],[x,y,0],wood,'frame');
  }
  for(const z of [-.79,.79]){
    beam([-1.27,1.72,z],[-.47,2.6,z],.14,.06);beam([1.27,1.72,z],[.47,2.6,z],.14,.06);
    beam([-1.27,1.02,z],[-.65,.4,z],.13,.06);beam([1.27,1.02,z],[.65,.4,z],.13,.06);
  }
  for(const x of [-1.33,1.33]){
    beam([x,1.73,-.73],[x,2.57,.47],.075,.11);
    beam([x,.4,-.5],[x,1.08,.73],.075,.11);
  }
  for(const z of [-.78,.78])for(const x of [-1.3,1.3])for(const y of [.34,1.69,2.66]){
    const screw=mesh(new THREE.CylinderGeometry(.013,.013,.005,8),metal,'frame');screw.rotation.x=Math.PI/2;screw.position.set(x,y,z+(z>0?.045:-.045));
  }

  // Eight growing channels, modeled as gently sloped cylinders with planting collars.
  routeDepths.forEach((z,index)=>{
    for(const lower of [false,true]){
      const yLeft=lower?.56:1.96,yRight=lower?.65:1.87,r=lower?.11:.087,id=lower?'lower':'upper';
      const pipe=cylinder([-1.2,yLeft,z],[1.2,yRight,z],r,lower?green:white,id);pipe.userData.route=index;channelMaterials.push(pipe.material);
      for(const [x,y] of [[-1.22,yLeft],[1.22,yRight]]){const cap=cylinder([x-.025,y,z],[x+.025,y,z],r+.008,white,id);cap.userData.route=index;channelMaterials.push(cap.material);}
      for(let j=0;j<6;j++){
        const x=-.97+j*.388,y=yLeft+(yRight-yLeft)*((x+1.2)/2.4)+r*.94;
        const hole=mesh(new THREE.CylinderGeometry(.043,.039,.018,24),dark,id);hole.position.set(x,y,z);hole.userData.route=index;
        const collar=mesh(new THREE.TorusGeometry(.045,.008,8,24),dark,id);collar.rotation.x=Math.PI/2;collar.position.set(x,y+.011,z);collar.userData.route=index;
      }
    }
    // Fixtures above each row, offset from the plants.
    for(const y of [2.5,1.42]){box([2.22,.035,.07],[0,y,z],white,'lights');box([2.15,.009,.055],[0,y-.021,z],pink,'lights');}
    tube([[1.25,1.87,z],[1.47,1.87,z],[1.47,.65,z],[1.25,.65,z]],'drops',.024);
    tube([[-1.44,2.11,z],[-1.44,1.96,z],[-1.25,1.96,z]],'supply');
    tube([[-1.25,.56,z],[-1.48,.56,z],[-1.65,.43,z]],'return',.027);
  });
  // Three-tee binary supply and three-tee collector: 1→2→4, then 4→2→1.
  tube([[-2.04,.35,0],[-1.9,.35,0],[-1.9,2.22,0],[-1.72,2.22,0]],'pump',.03);
  tube([[-1.72,2.22,-.38],[-1.72,2.22,.38]],'supply');
  for(const side of [-1,1]){
    tube([[-1.72,2.22,side*.38],[-1.44,2.11,side*.38]],'supply');
    tube([[-1.44,2.11,side*.19],[-1.44,2.11,side*.57]],'supply');
    tube([[-1.65,.43,side*.19],[-1.65,.43,side*.57]],'return',.027);
    tube([[-1.65,.43,side*.38],[-1.83,.38,side*.38]],'return',.03);
  }
  tube([[-1.83,.38,-.38],[-1.83,.38,.38]],'return',.03);
  tube([[-1.83,.38,0],[-2.12,.38,0]],'return',.035);
  // Fitting collars emphasize the three branch junctions on each side.
  for(const p of [[-1.72,2.22,0],[-1.44,2.11,-.38],[-1.44,2.11,.38]]){const fitting=mesh(new THREE.SphereGeometry(.037,12,8),white,'supply');fitting.position.set(...p);}
  for(const p of [[-1.83,.38,0],[-1.65,.43,-.38],[-1.65,.43,.38]]){const fitting=mesh(new THREE.SphereGeometry(.043,12,8),white,'return');fitting.position.set(...p);}
  // Open reservoir study: side walls, base, water surface, and schematic pump.
  box([.78,.045,.83],[-2.16,.08,0],dark,'reservoir');
  for(const x of [-2.55,-1.77])box([.035,.52,.84],[x,.33,0],dark,'reservoir');
  for(const z of [-.42,.42])box([.8,.52,.035],[-2.16,.33,z],dark,'reservoir');
  for(const z of [-.44,.44])box([.84,.035,.04],[-2.16,.6,z],dark,'reservoir');
  for(const x of [-2.57,-1.75])box([.04,.035,.88],[x,.6,0],dark,'reservoir');
  const waterMat=new THREE.MeshStandardMaterial({color:'#7fb9a2',transparent:true,opacity:.65,roughness:.15});
  box([.73,.015,.76],[-2.16,.32,0],waterMat,'reservoir');
  box([.18,.19,.19],[-2.04,.24,0],metal,'pump');

  const flowGroup=new THREE.Group();root.add(flowGroup);flowGroup.visible=false;
  const flows=[];
  function flowLine(points,color,index){
    const curve=new THREE.CurvePath();for(let i=1;i<points.length;i++)curve.add(new THREE.LineCurve3(new THREE.Vector3(...points[i-1]),new THREE.Vector3(...points[i])));
    const line=new THREE.Mesh(new THREE.TubeGeometry(curve,80,.012,6,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.65,depthTest:false}));line.renderOrder=5;flowGroup.add(line);
    const dots=[];for(let i=0;i<15;i++){const dot=new THREE.Mesh(new THREE.SphereGeometry(.027,8,6),new THREE.MeshBasicMaterial({color,depthTest:false}));dot.renderOrder=6;flowGroup.add(dot);dots.push(dot);}
    flows.push({curve,line,dots,index});
  }
  routeDepths.forEach((z,index)=>{
    const side=z<0?-1:1;
    flowLine([[-1.72,2.22,0],[-1.72,2.22,side*.38],[-1.44,2.11,side*.38],[-1.44,2.11,z],...routePoints(index),[-1.65,.43,z],[-1.65,.43,side*.38],[-1.83,.38,side*.38],[-1.83,.38,0]],routeColors[index],index);
  });
  flowLine([[-2.04,.35,0],[-1.9,.35,0],[-1.9,2.22,0],[-1.72,2.22,0]],'#254b3b',-1);
  flowLine([[-1.83,.38,0],[-2.12,.38,0]],'#254b3b',-1);

  function styleModel(){
    Object.entries(materialsByPart).forEach(([id,mats])=>mats.forEach((mat)=>{
      mat.emissive?.set(id===selected?'#986328':'#000000');mat.emissiveIntensity=id===selected?.16:0;
      if(id==='lights'&&mat.color.r>.8){mat.emissive.set('#eaa9b8');mat.emissiveIntensity=.28;}
    }));
    channelMaterials.forEach(mat=>{mat.transparent=flow;mat.opacity=flow?.22:1;mat.depthWrite=!flow;});
    flows.forEach((f)=>{const show=route==='all'||f.index===Number(route)||f.index===-1;f.line.visible=show;f.dots.forEach(d=>d.visible=show);});
  }
  function setView(name){
    const ratio=container.clientWidth/container.clientHeight;
    const scale=ratio<.9?1.42:1;
    controls.target.set(-.48,1.36,0);
    const positions={perspective:[5.1,3.8,6.4],front:[-.5,2.5,8.6],top:[-.5,8.8,.06]};
    const pos=positions[name]||positions.perspective;
    camera.position.set(controls.target.x+(pos[0]-controls.target.x)*scale,controls.target.y+(pos[1]-controls.target.y)*scale,pos[2]*scale);controls.update();
  }
  let lastWidth=0;
  function resize(){const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);if(!lastWidth||Math.abs(w-lastWidth)>150)setView('perspective');lastWidth=w;}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);resize();
  const intersectionObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;});intersectionObserver.observe(container);
  const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();let pointerDown;
  renderer.domElement.addEventListener('pointerdown',e=>{pointerDown={x:e.clientX,y:e.clientY};});
  renderer.domElement.addEventListener('pointerup',e=>{
    if(!pointerDown||Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>5)return;
    const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(pickable,false)[0];if(hit)onSelect(hit.object.userData.part);
  });
  renderer.domElement.addEventListener('keydown',event=>{
    const offset=camera.position.clone().sub(controls.target);const spherical=new THREE.Spherical().setFromVector3(offset);
    if(event.key==='ArrowLeft')spherical.theta-=.15;else if(event.key==='ArrowRight')spherical.theta+=.15;
    else if(event.key==='ArrowUp')spherical.phi=Math.max(.05,spherical.phi-.12);else if(event.key==='ArrowDown')spherical.phi=Math.min(Math.PI*.49,spherical.phi+.12);
    else if(event.key==='+'||event.key==='=')spherical.radius=Math.max(3,spherical.radius*.9);else if(event.key==='-')spherical.radius=Math.min(14,spherical.radius*1.1);else return;
    event.preventDefault();camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));controls.update();
  });
  let frame;function animate(time){if(disposed)return;frame=requestAnimationFrame(animate);if(!visible||document.hidden)return;controls.update();if(flow){flows.forEach(f=>f.dots.forEach((dot,i)=>dot.position.copy(f.curve.getPointAt(((reduced.matches?0:time*.000055)+i/f.dots.length)%1))));}renderer.render(scene,camera);}
  styleModel();frame=requestAnimationFrame(animate);
  const dispose=()=>{disposed=true;cancelAnimationFrame(frame);resizeObserver.disconnect();intersectionObserver.disconnect();controls.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of [o.material].flat())m.dispose();});woodTexture.dispose();renderer.dispose();};
  if(import.meta.hot)import.meta.hot.dispose(dispose);
  return {setView,selectPart(id){selected=id;styleModel();},setFlow(enabled){flow=enabled;flowGroup.visible=flow;styleModel();},setRoute(value){route=value;styleModel();},dispose};
}
