import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createLettuceBed } from './lettuce.js';
import { advanceGrowth } from './growth.js';
import { routePoints, routeDepths, routeColors } from './topology.js';

export function createModel(container, onSelect, onGrowth = () => {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#ffffff');
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .88;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const studio = new RoomEnvironment();
  const environment = pmrem.fromScene(studio, .04);
  scene.environment = environment.texture;
  scene.environmentIntensity = .38;
  studio.dispose();
  pmrem.dispose();
  container.replaceChildren(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', '3D hydroponics system. Arrow keys rotate; plus and minus zoom. Components can also be selected using the list below.');
  renderer.domElement.tabIndex = 0;
  const controls = new OrbitControls(camera,renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  // Leave wheel/trackpad and vertical touch gestures to the page.
  controls.enableZoom = false;
  controls.touches.TWO = null;
  renderer.domElement.style.touchAction = 'pan-y pinch-zoom';
  controls.minDistance = 3;
  controls.maxDistance = 14;
  controls.minPolarAngle = 0.05;
  controls.maxPolarAngle = Math.PI * .49;
  controls.target.set(-.25,1.35,0);

  scene.add(new THREE.HemisphereLight('#ffffff','#b1aaa1',.65));
  const sun = new THREE.DirectionalLight('#fff9f2',2.1);
  sun.position.set(-2,9,2);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  sun.shadow.radius=7;sun.shadow.blurSamples=16;
  sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=5;sun.shadow.camera.bottom=-5;
  sun.shadow.normalBias=.025;scene.add(sun);
  const fill = new THREE.DirectionalLight('#e8f0ff',.65);fill.position.set(4,4,-4);scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.15}));
  floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;floor.position.y=.005;scene.add(floor);
  const root=new THREE.Group();scene.add(root);
  const groups={}; const pickable=[]; const materialsByPart={}; const channelMaterials=[];
  let selected='overview',flow=false,lightsOn=false,route='all',visible=true,disposed=false;
  const growLights=[], lightHalos=[], plantingSites=[];
  let growth=0, lastTime=null, lastGrowthLabel='', shadowGrowth=-1;
  RectAreaLightUniformsLib.init();
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');

  function group(id){if(!groups[id]){groups[id]=new THREE.Group();root.add(groups[id]);}return groups[id];}
  const woodCanvas=document.createElement('canvas');woodCanvas.width=256;woodCanvas.height=1024;
  const ctx=woodCanvas.getContext('2d');ctx.fillStyle='#d9bd98';ctx.fillRect(0,0,256,1024);
  let seed=42; const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<650;i++){
    const x=random()*256;ctx.strokeStyle=`rgba(100,67,38,${.025+random()*.14})`;ctx.lineWidth=.3+random()*1.2;ctx.beginPath();
    for(let y=0;y<=1024;y+=8){const bend=Math.sin(y*.009+x*.03)*3+Math.sin(y*.003+x*.02)*8;const px=x+bend; y===0?ctx.moveTo(px,y):ctx.lineTo(px,y);}
    ctx.stroke();
  }
  for(let i=0;i<3;i++){const x=40+random()*170,y=100+random()*820;for(let r=2;r<25;r+=2){ctx.strokeStyle=`rgba(94,61,35,${.12-r*.003})`;ctx.beginPath();ctx.ellipse(x,y,r*.5,r*3,0,0,Math.PI*2);ctx.stroke();}}
  const woodTexture=new THREE.CanvasTexture(woodCanvas);woodTexture.colorSpace=THREE.SRGBColorSpace;
  woodTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const wood=new THREE.MeshStandardMaterial({color:'#ffffff',map:woodTexture,bumpMap:woodTexture,bumpScale:.0015,roughness:.7});
  const white=new THREE.MeshPhysicalMaterial({color:'#f5f5f1',roughness:.29,clearcoat:.28,clearcoatRoughness:.3});
  const green=new THREE.MeshPhysicalMaterial({color:'#4eaaa5',roughness:.28,clearcoat:.35,clearcoatRoughness:.25});
  const dark=new THREE.MeshStandardMaterial({color:'#252b2b',roughness:.74});
  const metal=new THREE.MeshStandardMaterial({color:'#b7bfc3',metalness:.85,roughness:.24});
  const tubeMaterial=new THREE.MeshPhysicalMaterial({color:'#aabbb7',roughness:.25,clearcoat:.45});
  const pink=new THREE.MeshStandardMaterial({color:'#efadc8',emissive:'#ff6cab',emissiveIntensity:0,roughness:.3});
  function mesh(geometry,material,id){const own=material.clone();const m=new THREE.Mesh(geometry,own);m.castShadow=true;m.receiveShadow=true;m.userData.part=id;group(id).add(m);pickable.push(m);(materialsByPart[id]??=[]).push(own);return m;}
  function rounded(size){return new RoundedBoxGeometry(...size,3,Math.min(.007,Math.min(...size)/5));}
  function box(size,position,mat,id){const horizontal=mat===wood&&size[0]>size[1];const m=mesh(rounded(horizontal?[size[1],size[0],size[2]]:size),mat,id);m.position.set(...position);if(horizontal)m.rotation.z=-Math.PI/2;return m;}
  function cylinder(a,b,r,mat,id){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);const m=mesh(new THREE.CylinderGeometry(r,r,start.distanceTo(end),40),mat,id);m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());return m;}
  function beam(a,b,width=.095,depth=.095){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);const m=mesh(rounded([width,start.distanceTo(end),depth]),wood,'frame');m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());return m;}
  function tube(points,id,r=.022,mat=tubeMaterial){for(let i=1;i<points.length;i++)cylinder(points[i-1],points[i],r,mat,id);for(const p of points.slice(1,-1)){const joint=mesh(new THREE.SphereGeometry(r,12,8),mat,id);joint.position.set(...p);}}

  // Four uprights and three rectangular rails. Measurements are illustrative model units.
  for(const x of [-1.32,1.32])for(const z of [-.78,.78]){
    box([.105,2.39,.105],[x,1.495,z],wood,'frame');
    const wheel=mesh(new THREE.CylinderGeometry(.115,.115,.075,24),dark,'frame');wheel.rotation.x=Math.PI/2;wheel.position.set(x,.125,z);
    box([.055,.17,.1],[x,.23,z],metal,'frame');
    for(const side of [-1,1])cylinder([x,.125,z+side*.039],[x,.125,z+side*.044],.062,metal,'frame');
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

  // Open cylindrical shells with planting apertures, rather than painted-on holes.
  function channelGeometry(radius,yLeft,yRight,z){
    const positions=[],indices=[],nx=480,nt=96;
    for(let i=0;i<=nx;i++)for(let j=0;j<=nt;j++){
      const x=-1.2+2.4*i/nx,a=j/nt*Math.PI*2;
      positions.push(x,yLeft+(yRight-yLeft)*i/nx+radius*Math.cos(a),z+radius*Math.sin(a));
    }
    for(let i=0;i<nx;i++)for(let j=0;j<nt;j++){
      const x=-1.2+2.4*(i+.5)/nx,a=(j+.5)/nt*Math.PI*2;
      const hole=Math.cos(a)>0&&Array.from({length:6},(_,k)=>-.97+k*.388).some(h=>(x-h)**2+(radius*Math.sin(a))**2<.043**2);
      if(hole)continue;
      const n=i*(nt+1)+j;indices.push(n,n+1,n+nt+1,n+1,n+nt+2,n+nt+1);
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
  }
  const haloCanvas=document.createElement('canvas');haloCanvas.width=64;haloCanvas.height=64;
  const haloContext=haloCanvas.getContext('2d');
  const gradient=haloContext.createRadialGradient(32,32,0,32,32,32);
  gradient.addColorStop(0,'rgba(255,90,161,.65)');gradient.addColorStop(.3,'rgba(255,112,177,.3)');gradient.addColorStop(1,'rgba(255,112,177,0)');
  haloContext.fillStyle=gradient;haloContext.fillRect(0,0,64,64);
  const haloTexture=new THREE.CanvasTexture(haloCanvas);
  routeDepths.forEach((z,index)=>{
    for(const lower of [false,true]){
      const yLeft=lower?.56:1.96,yRight=lower?.65:1.87,r=lower?.11:.087,id=lower?'lower':'upper';
      const pipe=mesh(channelGeometry(r,yLeft,yRight,z),lower?green:white,id);pipe.material.side=THREE.DoubleSide;pipe.userData.route=index;channelMaterials.push(pipe.material);
      for(const [x,y] of [[-1.22,yLeft],[1.22,yRight]]){const cap=cylinder([x-.025,y,z],[x+.025,y,z],r+.008,white,id);cap.userData.route=index;channelMaterials.push(cap.material);}
      for(let j=0;j<6;j++){
        const x=-.97+j*.388,y=yLeft+(yRight-yLeft)*((x+1.2)/2.4)+r*.94;
        const cup=mesh(new THREE.CylinderGeometry(.039,.027,.07,24,1,true),dark,id);cup.position.set(x,y-.034,z);cup.userData.route=index;cup.material.side=THREE.DoubleSide;
        plantingSites.push({x,y:y+.008,z});
        const collar=mesh(new THREE.TorusGeometry(.044,.004,12,40),dark,id);collar.rotation.x=Math.PI/2;collar.position.set(x,y+.005,z);collar.userData.route=index;
      }
    }
    // Fixtures above each row, offset from the plants.
    for(const y of [2.5,1.42]){
      box([2.22,.035,.07],[0,y,z],white,'lights');
      const diffuser=box([2.15,.009,.055],[0,y-.021,z],pink,'lights');
      diffuser.material.userData.growEmitter=true;
      const light=new THREE.RectAreaLight('#ff6ca9',0,2.15,.22);
      light.position.set(0,y-.029,z);light.lookAt(0,y-1,z);scene.add(light);growLights.push(light);
      const halo=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.7),new THREE.MeshBasicMaterial({map:haloTexture,transparent:true,opacity:.55,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
      halo.rotation.x=-Math.PI/2;halo.position.set(0,y-.035,z);halo.visible=false;root.add(halo);lightHalos.push(halo);
    }
    tube([[1.25,1.87,z],[1.47,1.87,z],[1.47,.65,z],[1.25,.65,z]],'drops',.024);
    tube([[-1.44,2.11,z],[-1.44,1.96,z],[-1.25,1.96,z]],'supply');
    tube([[-1.25,.56,z],[-1.48,.56,z],[-1.65,.43,z]],'return',.027);
  });
  const lettuce=createLettuceBed(plantingSites);root.add(lettuce.group);
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
  for(let i=0;i<6;i++)box([.003,.4,.035],[-2.57,.3,-.3+i*.12],dark,'reservoir');

  const flowGroup=new THREE.Group();root.add(flowGroup);flowGroup.visible=false;
  const flows=[];
  function flowLine(points,color,index){
    const curve=new THREE.CurvePath();for(let i=1;i<points.length;i++)curve.add(new THREE.LineCurve3(new THREE.Vector3(...points[i-1]),new THREE.Vector3(...points[i])));
    const line=new THREE.Mesh(new THREE.TubeGeometry(curve,80,.012,6,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.65,depthTest:true}));line.renderOrder=5;flowGroup.add(line);
    const dots=[];for(let i=0;i<15;i++){const dot=new THREE.Mesh(new THREE.SphereGeometry(.02,8,6),new THREE.MeshBasicMaterial({color,depthTest:true}));dot.renderOrder=6;flowGroup.add(dot);dots.push(dot);}
    flows.push({curve,line,dots,index});
  }
  routeDepths.forEach((z,index)=>{
    const side=z<0?-1:1;
    flowLine([[-1.72,2.22,0],[-1.72,2.22,side*.38],[-1.44,2.11,side*.38],[-1.44,2.11,z],...routePoints(index),[-1.65,.43,z],[-1.65,.43,side*.38],[-1.83,.38,side*.38],[-1.83,.38,0]],routeColors[index],index);
  });
  flowLine([[-2.04,.35,0],[-1.9,.35,0],[-1.9,2.22,0],[-1.72,2.22,0]],'#254b3b',-1);
  flowLine([[-1.83,.38,0],[-2.12,.38,0]],'#254b3b',-1);

  function styleModel(){
    renderer.shadowMap.needsUpdate=true;
    Object.entries(materialsByPart).forEach(([id,mats])=>mats.forEach((mat)=>{
      mat.emissive?.set(id===selected?'#986328':'#000000');mat.emissiveIntensity=id===selected?.16:0;
      if(mat.userData.growEmitter){mat.emissive.set('#ff6cab');mat.emissiveIntensity=lightsOn?1.5:0;}
    }));
    channelMaterials.forEach(mat=>{mat.transparent=flow;mat.opacity=flow?.68:1;mat.depthWrite=!flow;});
    flows.forEach((f)=>{const show=route==='all'||f.index===Number(route)||f.index===-1;f.line.visible=show;f.dots.forEach(d=>d.visible=show);});
  }
  function frameModel(){
    const ratio=container.clientWidth/container.clientHeight;
    controls.target.set(-.2,1.13,-.2);
    // Fit the full rack and reservoir tightly, with room for the bottom toolbar.
    const distance=Math.max(7.15,6.9/ratio);
    const direction=new THREE.Vector3(4.98,1.84,6.3).normalize();
    camera.position.copy(controls.target).addScaledVector(direction,distance);controls.update();
  }
  let lastWidth=0;
  function resize(){const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);if(!lastWidth||Math.abs(w-lastWidth)>150)frameModel();lastWidth=w;}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);resize();
  const resetClock=()=>{lastTime=null;};
  document.addEventListener('visibilitychange',resetClock);
  const intersectionObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resetClock();});intersectionObserver.observe(container);
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
  function zoomModel(factor){
    const offset=camera.position.clone().sub(controls.target);
    offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance));
    camera.position.copy(controls.target).add(offset);controls.update();refresh();
  }
  function updateGrowth(seconds=0){
    growth=advanceGrowth(growth,seconds,{water:flow,lights:lightsOn,reducedMotion:reduced.matches});
    lettuce.update(growth);
    const shadowStep=Math.floor(growth*24);
    if(shadowStep!==shadowGrowth){shadowGrowth=shadowStep;renderer.shadowMap.needsUpdate=true;}
    const phase=growth>=1?'grown':flow&&lightsOn?'growing':growth>0?'paused':'ready';
    if(phase!==lastGrowthLabel){lastGrowthLabel=phase;onGrowth(phase);}
  }
  function refresh(){updateGrowth();renderer.render(scene,camera);}
  let frame;function animate(time){
    if(disposed)return;frame=requestAnimationFrame(animate);
    if(!visible||document.hidden){lastTime=null;return;}
    if(lastTime!==null&&time-lastTime<1000/30)return;
    const seconds=lastTime===null?0:Math.min((time-lastTime)/1000,1);lastTime=time;
    controls.update();updateGrowth(seconds);
    if(flow)flows.forEach(f=>f.dots.forEach((dot,i)=>dot.position.copy(f.curve.getPointAt(((reduced.matches?0:time*.000055)+i/f.dots.length)%1))));
    renderer.render(scene,camera);
  }
  styleModel();frame=requestAnimationFrame(animate);
  const dispose=()=>{disposed=true;cancelAnimationFrame(frame);resizeObserver.disconnect();intersectionObserver.disconnect();document.removeEventListener('visibilitychange',resetClock);controls.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of [o.material].flat())m.dispose();});woodTexture.dispose();haloTexture.dispose();environment.dispose();renderer.dispose();};
  if(import.meta.hot)import.meta.hot.dispose(dispose);
  return {
    setLights(enabled){lightsOn=enabled;growLights.forEach(light=>light.intensity=enabled?36:0);lightHalos.forEach(halo=>halo.visible=enabled);styleModel();refresh();},
    selectPart(id){selected=id;styleModel();refresh();},
    setFlow(enabled){flow=enabled;flowGroup.visible=flow;styleModel();refresh();},
    setRoute(value){route=value;styleModel();refresh();},
    zoomIn(){zoomModel(.85);},
    zoomOut(){zoomModel(1/.85);},
    restartGrowth(){growth=0;lastTime=null;updateGrowth();refresh();},
    dispose
  };
}
