import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { hydrocarbon3dById } from './hydrocarbon3dData.js';
import { reaction3dData } from './reaction3dData.js';
import { getElectronShells } from './electronShells.js';

const COLORS = { H: '#e8f1ee', C: '#677b83', O: '#ff5f72', N: '#67a8ff', S: '#ffc45d', P: '#ff9860', F: '#8ce09d', Cl: '#7ee0ad', Na: '#b89aff', Mg: '#74d5c1', Fe: '#d77b55', Cu: '#edaa72', B: '#f1a8c8', Ca: '#d9c5a5', Si: '#bdc3ad', e: '#72f4d0', p: '#ff6475', n: '#a9c6d3', rust: '#bc6745' };
const V = (v) => new THREE.Vector3(v[0], v[1], v[2]);
const atomRadius = (symbol) => symbol === 'H' || symbol === 'e' ? 0.24 : symbol === 'O' || symbol === 'N' ? 0.43 : symbol === 'C' ? 0.48 : 0.42;
const formulaLabel = (formula) => ({ H2O: 'H₂O', CO2: 'CO₂', CH4: 'CH₄', NH3: 'NH₃', O2: 'O₂', HCl: 'HCl', NaCl: 'NaCl', C2H4: 'C₂H₄', C2H6: 'C₂H₆' }[formula] || formula);

function sphere(parent, symbol, position, scale = 1, options = {}) {
  const color = options.color || COLORS[symbol] || '#9ab2a9';
  const geometry = new THREE.SphereGeometry(atomRadius(symbol) * scale, 40, 32);
  const material = new THREE.MeshPhysicalMaterial({ color, roughness: 0.24, metalness: 0.16, clearcoat: 1, clearcoatRoughness: 0.16, emissive: color, emissiveIntensity: options.glow ? 0.65 : 0.1, transparent: options.opacity != null, opacity: options.opacity ?? 1 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(V(position));
  if(options.chemical!==false)mesh.userData.chemicalSymbol=symbol;
  if(options.materialName)mesh.userData.materialName=options.materialName;
  // Keep the orbital parameters on the rendered electron so the scene loop
  // can advance its position every frame.
  if (options.orbit) mesh.userData.orbit = options.orbit;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  if (options.label) {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 128;
    const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, 256, 128); ctx.fillStyle = 'rgba(7,17,22,.76)'; ctx.beginPath(); ctx.roundRect(30, 27, 196, 72, 34); ctx.fill(); ctx.strokeStyle = `${color}aa`; ctx.lineWidth = 4; ctx.stroke(); ctx.font = '700 43px Manrope, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f3f8f5'; ctx.fillText(options.labelText || symbol, 128, 64);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
    tag.userData.chemicalSymbol=symbol;
    const hydrogen = symbol === 'H';
    tag.position.copy(V(position)).add(new THREE.Vector3(0, atomRadius(symbol) * scale + (hydrogen ? 0.16 : 0.22), 0));
    tag.scale.set(hydrogen ? 0.42 : 0.56, hydrogen ? 0.23 : 0.28, 1); tag.renderOrder = 20; parent.add(tag);
  }
  return mesh;
}

function bond(parent, start, end, order = 1, color = '#88a89b', thickness = 0.065) {
  const a = V(start), b = V(end), direction = new THREE.Vector3().subVectors(b, a);
  const length = direction.length();
  const basis = Math.abs(direction.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const side = new THREE.Vector3().crossVectors(direction, basis).normalize();
  for (let i = 0; i < order; i++) {
    const offset = (i - (order - 1) / 2) * 0.105;
    const geometry = new THREE.CylinderGeometry(thickness, thickness, length, 16, 1, false);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, metalness: 0.4, emissive: color, emissiveIntensity: 0.18 }));
    mesh.position.copy(a).add(b).multiplyScalar(0.5).addScaledVector(side, offset);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    mesh.castShadow = true; parent.add(mesh);
  }
}

function addCaption(parent, text, position, color = '#d8f2e9') {
  const canvas=document.createElement('canvas');canvas.width=384;canvas.height=96;
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,384,96);ctx.fillStyle='rgba(7,17,22,.88)';ctx.beginPath();ctx.roundRect(8,8,368,80,32);ctx.fill();ctx.strokeStyle=`${color}99`;ctx.lineWidth=3;ctx.stroke();ctx.font='700 38px Manrope, Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f3f8f5';ctx.fillText(text,192,48);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));sprite.position.copy(V(position));sprite.scale.set(2.55,.64,1);sprite.renderOrder=21;parent.add(sprite);return sprite;
}

function molecule(parent, formula, origin = [0, 0, 0], scale = 1, options = {}) {
  const sets = {
    H2O: { atoms: ['O', 'H', 'H'], points: [[0, 0, 0], [-0.78, 0.62, 0], [0.78, 0.62, 0]], links: [[0,1,1],[0,2,1]] },
    CO2: { atoms: ['C','O','O'], points: [[0,0,0],[-1.3,0,0],[1.3,0,0]], links: [[0,1,2],[0,2,2]] },
    CH4: { atoms: ['C','H','H','H','H'], points: [[0,0,0],[-0.72,-0.72,-0.72],[0.72,0.72,-0.72],[-0.72,0.72,0.72],[0.72,-0.72,0.72]], links: [[0,1,1],[0,2,1],[0,3,1],[0,4,1]] },
    NH3: { atoms: ['N','H','H','H'], points: [[0,0.05,0],[-0.78,-0.48,0.5],[0.78,-0.48,0.5],[0,-0.48,-0.85]], links: [[0,1,1],[0,2,1],[0,3,1]] },
    H2: { atoms: ['H','H'], points: [[-0.48,0,0],[0.48,0,0]], links: [[0,1,1]] },
    O2: { atoms: ['O','O'], points: [[-0.68,0,0],[0.68,0,0]], links: [[0,1,2]] },
    HCl: { atoms: ['H','Cl'], points: [[-0.55,0,0],[0.55,0,0]], links: [[0,1,1]] },
    HF: { atoms: ['H','F'], points: [[-0.55,0,0],[0.55,0,0]], links: [[0,1,1]] },
    H3O: { atoms: ['O','H','H','H'], points: [[0,0,0],[-0.58,0.55,0.34],[0.58,0.55,0.34],[0,0.48,-0.68]], links: [[0,1,1],[0,2,1],[0,3,1]] },
    OH: { atoms: ['O','H'], points: [[0,0,0],[0.72,0.18,0]], links: [[0,1,1]] },
    CO3: { atoms: ['C','O','O','O'], points: [[0,0,0],[0,.76,0],[-.66,-.38,0],[.66,-.38,0]], links: [[0,1,1],[0,2,1],[0,3,1]] },
    N2: { atoms: ['N','N'], points: [[-0.54,0,0],[0.54,0,0]], links: [[0,1,3]] },
    C2H4: { atoms: ['C','C','H','H','H','H'], points: [[-0.65,0,0],[0.65,0,0],[-1.05,0.75,0],[-1.05,-0.75,0],[1.05,0.75,0],[1.05,-0.75,0]], links: [[0,1,2],[0,2,1],[0,3,1],[1,4,1],[1,5,1]] },
    C2H6: { atoms: ['C','C','H','H','H','H','H','H'], points: [[-0.73,0,0],[0.73,0,0],[-1.15,0.65,0.5],[-1.15,-0.65,0.5],[-0.73,0,0.85],[1.15,0.65,-0.5],[1.15,-0.65,-0.5],[0.73,0,-0.85]], links: [[0,1,1],[0,2,1],[0,3,1],[0,4,1],[1,5,1],[1,6,1],[1,7,1]] },
  };
  const data = sets[formula] || sets.H2O; const points = data.points.map(([x,y,z]) => [origin[0]+x*scale, origin[1]+y*scale, origin[2]+z*scale]);
  data.links.forEach(([a,b,order]) => { if (order) bond(parent, points[a], points[b], order, '#a6c4b8', 0.055 * scale); });
  data.atoms.forEach((symbol, i) => sphere(parent, symbol, points[i], scale, { label: options.labels }));
  return { points, atoms: data.atoms };
}

function orientedMolecule(parent, formula, origin, scale, index = 0, options = {}) {
  const group = new THREE.Group();
  molecule(group, formula, [0, 0, 0], scale, options);
  group.position.copy(V(origin));
  // Molecules in a liquid or gas do not all share one display orientation.
  // Keep each molecule's geometry intact while turning it through 3D space.
  group.rotation.set(.34 + (index % 3) * .47, index * 1.13, (index % 4) * .39);
  parent.add(group);
  return group;
}

function sedimentGrain(parent, position, scale = 1) {
  const materialName = 'Grain de sédiment · composition variable';
  const pieces = [
    [0, 0, 0, 1.05, '#a8896f'], [-.34, .12, .16, .64, '#9b806b'],
    [.31, -.12, -.17, .72, '#b49a7c'], [.1, .26, -.25, .52, '#7f7969'],
    [-.12, -.24, -.3, .58, '#927b67'], [.3, .23, .25, .47, '#aa8a6b']
  ];
  pieces.forEach(([dx, dy, dz, size, color]) => sphere(parent, 'Si', [position[0]+dx*scale, position[1]+dy*scale, position[2]+dz*scale], size*scale, { chemical:false, color, materialName }));
}

function renderMolecularModel(parent, model, scale = 0.72, labels = true) {
  const center = model.atoms.reduce((sum, atom) => sum.map((value, axis) => value + atom.position[axis] / model.atoms.length), [0, 0, 0]);
  const points = new Map(model.atoms.map((atom) => [atom.id, atom.position.map((value, axis) => (value - center[axis]) * scale)]));
  model.bonds.forEach(({ from, to, order }) => bond(parent, points.get(from), points.get(to), order, '#a6c4b8', 0.055 * scale));
  const atomScale = scale / 0.72;
  model.atoms.forEach((atom) => sphere(parent, atom.symbol, points.get(atom.id), (atom.symbol === 'H' ? 0.78 : 1) * atomScale, { label: labels }));
}

function renderReactionSnapshot(parent, reaction, snapshotIndex) {
  const snapshot = reaction.snapshots[snapshotIndex];
  if (!snapshot) return;
  const center = snapshot.atoms.reduce((sum, atom) => sum.map((value, axis) => value + atom.position[axis] / snapshot.atoms.length), [0, 0, 0]);
  const points = new Map(snapshot.atoms.map((atom) => [atom.id, atom.position.map((value, axis) => (value - center[axis]) * 0.78)]));
  snapshot.bonds.forEach(({ a, b, order }) => bond(parent, points.get(a), points.get(b), order, '#a6c4b8', 0.055));
  snapshot.atoms.forEach((atom) => sphere(parent, atom.element, points.get(atom.id), atom.element === 'H' ? 0.78 : 1, { label: true }));
}

function saltCrystal(parent, center=[0,-1.35,0]) {
  // Small alternating Na+/Cl- lattice: a crystal is an ionic network, not
  // separate neutral NaCl molecules. Counts are enlarged for visibility.
  const spacing = 0.62;
  const lattice = new Map();
  for(let x=0;x<4;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++){
    const position=[center[0]+(x-1.5)*spacing,center[1]+(y-.5)*spacing,center[2]+(z-.5)*spacing];
    lattice.set(`${x},${y},${z}`, position);
  }
  // Show the nearest-neighbour ionic connections as the same clear bridges
  // used for molecular bonds; the caption identifies these as ionic, not covalent.
  for(let x=0;x<4;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++){
    const from=lattice.get(`${x},${y},${z}`);
    [[x+1,y,z],[x,y+1,z],[x,y,z+1]].forEach(([nx,ny,nz])=>{
      const to=lattice.get(`${nx},${ny},${nz}`);
      if(to)bond(parent,from,to,1,'#8bd4cf',.045);
    });
  }
  for(let x=0;x<4;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++){
    const symbol=(x+y+z)%2===0?'Na':'Cl';
    const position=lattice.get(`${x},${y},${z}`);
    const firstOfSymbol=(x===0&&y===0&&z===0)||(x===1&&y===0&&z===0);
    sphere(parent,symbol,position,.58,{label:firstOfSymbol,labelText:symbol==='Na'?'Na⁺':'Cl⁻'});
  }
}

function atomModel(parent, symbol, protons, neutrons, electrons, element) {
  const nucleus = new THREE.Group(); parent.add(nucleus);
  const total = protons + neutrons;
  const placements=[];
  for (let i = 0; i < total; i++) {
    const phi = Math.acos(1 - 2 * (i + 0.5) / total), theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const radius = total === 1 ? 0 : 0.34 * Math.cbrt(i / Math.max(1,total));
    placements.push([radius * Math.sin(phi) * Math.cos(theta), radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi)]);
  }
  const center=placements.reduce((sum,point)=>sum.map((value,axis)=>value+point[axis]/total),[0,0,0]);
  placements.forEach((point)=>point.forEach((value,axis)=>{point[axis]=value-center[axis];}));
  for (const [kind,count,start] of [['p',protons,0],['n',neutrons,protons]]) {
    const geometry=new THREE.SphereGeometry(.105,16,12), material=new THREE.MeshPhysicalMaterial({color:COLORS[kind],roughness:.2,emissive:COLORS[kind],emissiveIntensity:.25});
    const mesh=new THREE.InstancedMesh(geometry,material,count);const dummy=new THREE.Object3D();
    for(let i=0;i<count;i++){dummy.position.set(...placements[start+i]);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;nucleus.add(mesh);
  }
  const makeAnchor=(position)=>{const anchor=new THREE.Object3D();anchor.position.set(...position);parent.add(anchor);return anchor;};
  const anchors={nucleus:makeAnchor([0,0,0]),proton:makeAnchor(placements[0]||[0,0,0]),neutron:makeAnchor(neutrons?placements[protons]:[0,0,0])};
  const shells = getElectronShells(element,protons-electrons),electronMeshes=[],shellTracks=[];
  let index = 0; let electronAnchor=null; let shellAnchorPosition=[1,0,0];
  shells.forEach((count, shell) => {
    const radius = 1.0 + shell * 0.43;
    const orientation=new THREE.Euler(.35+shell*.34,shell*.27,shell*.42);
    if(count>0){const shellPoint=new THREE.Vector3(0,0,radius).applyEuler(orientation);shellAnchorPosition=shellPoint.toArray();}
    if(count>0){const trackPoints=[];for(let i=0;i<240;i++){const a=i/240*Math.PI*2;trackPoints.push(new THREE.Vector3(Math.cos(a)*radius,0,Math.sin(a)*radius).applyEuler(orientation));}const geometry=new THREE.BufferGeometry().setFromPoints(trackPoints);const colors=['#74e3d7','#7bb9e8','#b09bf2','#e1b681','#77d5bc','#93a6ef','#d39abb'];const path=new THREE.LineLoop(geometry,new THREE.LineBasicMaterial({color:colors[shell%colors.length],transparent:true,opacity:.62,depthWrite:false}));path.renderOrder=2;path.userData.shellIndex=shell;parent.add(path);shellTracks.push(path);}
    for (let j=0;j<count;j++) {
      const phase=2*Math.PI*j/count+shell*.35;const position=new THREE.Vector3(Math.cos(phase)*radius,0,Math.sin(phase)*radius).applyEuler(orientation).toArray();
      const e=sphere(parent,'e',position,0.42,{glow:true,orbit:{radius,phase,speed:(shell%2?-1:1)*(1.25/Math.sqrt(shell+1)),rotation:orientation.clone(),shellIndex:shell,shellElectronIndex:j}});e.userData.electronIndex=index++;electronMeshes.push(e);if(!electronAnchor)electronAnchor=e;
    }
  });
  anchors.electron=electronAnchor||makeAnchor([1,0,0]);anchors.shell=makeAnchor(shellAnchorPosition);parent.userData.atomAnchors=anchors;parent.userData.neutronCount=neutrons;return{electrons:electronMeshes,shellTracks,shellCounts:shells};
}

function shellElectronPosition(shell, count, index) {
  const radius=1+shell*.43,orientation=new THREE.Euler(.35+shell*.34,shell*.27,shell*.42),phase=2*Math.PI*index/count+shell*.35;
  return new THREE.Vector3(Math.cos(phase)*radius,0,Math.sin(phase)*radius).applyEuler(orientation);
}

function addShellTrack(parent, shell, opacity=.42) {
  const radius=1+shell*.43,orientation=new THREE.Euler(.35+shell*.34,shell*.27,shell*.42),points=[];
  for(let i=0;i<240;i++){const angle=i/240*Math.PI*2;points.push(new THREE.Vector3(Math.cos(angle)*radius,0,Math.sin(angle)*radius).applyEuler(orientation));}
  const geometry=new THREE.BufferGeometry().setFromPoints(points),colors=['#74e3d7','#7bb9e8','#b09bf2','#e1b681','#77d5bc','#93a6ef','#d39abb'];
  const track=new THREE.LineLoop(geometry,new THREE.LineBasicMaterial({color:colors[shell%colors.length],transparent:true,opacity,depthWrite:false}));track.renderOrder=2;parent.add(track);return track;
}

function makeBeaker(parent) {
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(2.25,2.0,3.1,64,1,true),new THREE.MeshPhysicalMaterial({color:'#72ccdb',roughness:.16,metalness:.04,transparent:true,opacity:.12,side:THREE.DoubleSide,clearcoat:1}));
  glass.position.y = -0.15; parent.add(glass);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.99,2,0.12,64),new THREE.MeshPhysicalMaterial({color:'#73d7e3',transparent:true,opacity:.32,roughness:.18})); base.position.y=-1.72; parent.add(base);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(2.25,0.045,12,64),new THREE.MeshStandardMaterial({color:'#a4edf0',emissive:'#2e9fa6',emissiveIntensity:.5,transparent:true,opacity:.7})); lip.rotation.x=Math.PI/2; lip.position.y=1.4; parent.add(lip);
}

function buildMatterZoom(parent) {
  const glass = new THREE.Group(), water = new THREE.Group(), waterMolecules = new THREE.Group(), waterMolecule = new THREE.Group(), waterAtoms = new THREE.Group(), glassNetwork = new THREE.Group();
  parent.add(glass,water,waterMolecules,waterMolecule,waterAtoms,glassNetwork);
  const glassMaterial=new THREE.MeshPhysicalMaterial({color:'#b9dce0',roughness:.12,metalness:.02,transparent:true,opacity:.16,side:THREE.DoubleSide,clearcoat:1,clearcoatRoughness:.08});
  const shell=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.14,2.45,96,1,true),glassMaterial);shell.position.y=-.15;glass.add(shell);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(1.14,1.15,.1,96),new THREE.MeshPhysicalMaterial({color:'#d5eef0',transparent:true,opacity:.22,roughness:.14,clearcoat:1}));base.position.y=-1.38;glass.add(base);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(1.35,.035,16,96),new THREE.MeshStandardMaterial({color:'#e2ffff',transparent:true,opacity:.68,emissive:'#65dce0',emissiveIntensity:.24}));rim.rotation.x=Math.PI/2;rim.position.y=1.075;glass.add(rim);
  // The water column reaches the beaker floor and its surface sits just below the rim.
  const liquid=new THREE.Mesh(new THREE.CylinderGeometry(1.115,1.005,1.76,80),new THREE.MeshPhysicalMaterial({color:'#238ca3',roughness:.16,metalness:.01,transparent:true,opacity:.48,clearcoat:1,clearcoatRoughness:.08}));liquid.position.y=-.46;water.add(liquid);
  const surface=new THREE.Mesh(new THREE.CircleGeometry(1.115,80),new THREE.MeshPhysicalMaterial({color:'#58c4cb',roughness:.12,transparent:true,opacity:.68,side:THREE.DoubleSide,emissive:'#175d70',emissiveIntensity:.12}));surface.rotation.x=-Math.PI/2;surface.position.y=.415;water.add(surface);
  // A schematic molecule field reveals progressively as the camera penetrates the material.
  for(let x=0;x<7;x++)for(let y=0;y<5;y++)for(let z=0;z<7;z++){
    const px=(x-3)*.24, py=-.46+(y-2)*.23, pz=(z-3)*.24;
    if(px*px+pz*pz<.78)molecule(waterMolecules,'H2O',[px,py,pz],.065,{labels:false});
  }
  molecule(waterMolecule,'H2O',[0,0,0],.16,{labels:false});
  molecule(waterAtoms,'H2O',[0,0,0],.025,{labels:false});
  // Dense schematic silica network. Instancing keeps hundreds of atoms smooth to navigate.
  const silicon=[], oxygen=[], links=[];
  const tetra=[[-1,-1,-1],[-1,1,1],[1,-1,1],[1,1,-1]];
  for(let ix=0;ix<5;ix++)for(let iy=0;iy<4;iy++)for(let iz=0;iz<5;iz++){
    const si=new THREE.Vector3((ix-2)*.155+Math.sin(ix*17+iy*5+iz)*.012,(iy-1.5)*.16+Math.sin(iy*11+iz*3)*.01,(iz-2)*.155+Math.sin(iz*13+ix*7)*.012);
    silicon.push(si);
    for(const [dx,dy,dz] of tetra){const o=si.clone().add(new THREE.Vector3(dx,dy,dz).normalize().multiplyScalar(.072));oxygen.push(o);links.push([si,o]);}
  }
  const makeField=(positions,radius,symbol,material)=>{const mesh=new THREE.InstancedMesh(new THREE.SphereGeometry(radius,16,12),material,positions.length),dummy=new THREE.Object3D();mesh.userData.chemicalSymbol=symbol;positions.forEach((point,index)=>{dummy.position.copy(point);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;glassNetwork.add(mesh);};
  makeField(silicon,.027,'Si',new THREE.MeshPhysicalMaterial({color:COLORS.Si,roughness:.23,metalness:.08,emissive:COLORS.Si,emissiveIntensity:.2}));
  makeField(oxygen,.019,'O',new THREE.MeshPhysicalMaterial({color:COLORS.O,roughness:.2,metalness:.05,emissive:COLORS.O,emissiveIntensity:.17}));
  const sodium=silicon.filter((_,index)=>index%13===2).map(point=>point.clone().add(new THREE.Vector3(.035,.025,-.025)));
  const calcium=silicon.filter((_,index)=>index%17===5).map(point=>point.clone().add(new THREE.Vector3(-.035,-.02,.03)));
  makeField(sodium,.022,'Na',new THREE.MeshPhysicalMaterial({color:COLORS.Na,roughness:.24,metalness:.08,emissive:COLORS.Na,emissiveIntensity:.18}));
  makeField(calcium,.024,'Ca',new THREE.MeshPhysicalMaterial({color:COLORS.Ca,roughness:.25,metalness:.06,emissive:COLORS.Ca,emissiveIntensity:.15}));
  const bondGeometry=new THREE.CylinderGeometry(.0045,.0045,1,8,1,false),bondMaterial=new THREE.MeshStandardMaterial({color:'#9db5ac',roughness:.38,metalness:.24});
  const bondField=new THREE.InstancedMesh(bondGeometry,bondMaterial,links.length),dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0);
  links.forEach(([from,to],index)=>{const direction=new THREE.Vector3().subVectors(to,from);dummy.position.copy(from).add(to).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,direction.clone().normalize());dummy.scale.set(1,direction.length(),1);dummy.updateMatrix();bondField.setMatrixAt(index,dummy.matrix);});bondField.instanceMatrix.needsUpdate=true;glassNetwork.add(bondField);
  parent.userData.matterLayers={glass,water,waterMolecules,waterMolecule,waterAtoms,glassNetwork};
  for(const layer of Object.values(parent.userData.matterLayers)){layer.userData.opacityMaterials=[];layer.traverse(obj=>{if(!obj.material)return;for(const material of Array.isArray(obj.material)?obj.material:[obj.material])layer.userData.opacityMaterials.push({material,base:material.opacity});});}
}

const smoothStep=(start,end,value)=>{const t=Math.max(0,Math.min(1,(start-value)/(start-end)));return t*t*(3-2*t);};

function buildModel(parent, p) {
  if (p.type === 'atom') { const element=p.element||{symbol:'Na',number:11,massNumber:23,shells:[2,8,1]}; atomModel(parent,element.symbol,element.number,element.massNumber-element.number,Math.max(0,element.number-(p.charge||0)),element); return; }
  if (p.type === 'matter-zoom') {
    buildMatterZoom(parent);
    return;
  }
  if (p.type === 'molecule') { molecule(parent,p.formula,[0,0,0],1.18,{labels:true}); return; }
  if (p.type === 'matter') {
    const count = 18; const gas = p.phase === 'Gaz', solid = p.phase === 'Solide';
    const saltVapor = [
      [-1.6,.85,-1.2], [0,.85,1.2], [1.6,.85,-1.1], [-1.6,1.75,1.1], [0,1.8,-1.1],
      [1.6,1.8,1.15], [-.8,2.25,0], [.8,2.25,0], [-.8,1.35,0], [.8,1.35,0],
    ];
    for(let i=0;i<count;i++) {
      const a=i%3, b=Math.floor(i/3)%3, c=Math.floor(i/9);
      const spacing=solid?.78:gas?1.55:1.32;
      const x=(a-1)*spacing+Math.sin(i*12.4)*(solid?.035:.12), z=(b-1)*spacing*.9+Math.cos(i*8.7)*(solid?.035:.12);
      const y=solid?-.42+c*.7:gas?(c-.5)*1.5+Math.sin(i*5.2)*.18:(c-.5)*.96+Math.sin(i*5.2)*.12;
      if(p.mixture==='Eau salée' && gas) {
        // Use one spaced 3D vapor field. The old branch fell through for its last
        // four particles, placing extra H2O molecules inside the vapor cluster.
        if(i<saltVapor.length)orientedMolecule(parent,'H2O',saltVapor[i],.34,i,{labels:false});
        else continue;
      } else if(p.mixture==='Eau salée' && i%6===0) {
        if(solid)continue;
        sphere(parent,'Na',[x-.44,y,z],.72,{label:true,labelText:'Na⁺'});
        sphere(parent,'Cl',[x+.44,y,z],.72,{label:true,labelText:'Cl⁻'});
      } else if(p.mixture==='Eau boueuse' && i%4===0) {
        sedimentGrain(parent,[x,y,z],.72);
      } else if(p.mixture==='Air') orientedMolecule(parent,i%5===0?'O2':'N2',[x,y,z],.48,i);
      else orientedMolecule(parent,'H2O',[x,y,z],.52,i);
    }
    if(p.mixture==='Eau salée'&&gas)saltCrystal(parent);
    if(p.mixture==='Eau salée'&&solid){
      const brine=new THREE.Mesh(new THREE.SphereGeometry(.76,32,24),new THREE.MeshPhysicalMaterial({color:'#318e9a',transparent:true,opacity:.2,roughness:.18,depthWrite:false}));brine.position.set(1.2,-.45,.72);parent.add(brine);
      [[.94,-.52,.72],[1.4,-.38,.72],[1.2,-.55,.98],[1.2,-.3,.47]].forEach((point,index)=>sphere(parent,index%2?'Cl':'Na',point,.68,{label:index<2,labelText:index%2?'Cl⁻':'Na⁺'}));
      [[.92,-.18,.55],[1.47,-.67,.9],[1.38,-.12,.9]].forEach((point,index)=>orientedMolecule(parent,'H2O',point,.31,index+20));
    }
    return;
  }
  if (p.type === 'balance') {
    const species = [
      { count:p.coefficients[0], formula:'CH4', center:[-2.15,.58,.95], rotation:[.68,.88,-.48] },
      { count:p.coefficients[1], formula:'O2', center:[-.78,-.62,-.92], rotation:[1.02,.72,.86] },
      { count:p.coefficients[2], formula:'CO2', center:[.82,.68,-.72], rotation:[.76,1.02,-.58] },
      { count:p.coefficients[3], formula:'H2O', center:[2.12,-.5,.88], rotation:[-.78,.82,.72] },
    ];
    const offsets = [[0,0,0],[0,.72,.78],[0,-.72,-.78]];
    species.forEach(({count,formula,center,rotation})=>{
      for(let i=0;i<Math.min(count,3);i++){
        const item = new THREE.Group();
        molecule(item,formula,[0,0,0],.46,{labels:false});
        const offset=offsets[i]; item.position.set(center[0]+offset[0],center[1]+offset[1],center[2]+offset[2]);
        item.rotation.set(rotation[0]+i*.24,rotation[1]+i*.31,rotation[2]-i*.18); parent.add(item);
      }
    });
    return;
  }
  if (p.type === 'ph') {
    makeBeaker(parent);
    for(let i=0;i<9;i++){const x=(i%3-1)*1.05,z=(Math.floor(i/3)-1)*.9,y=-1.12+(i%2)*.24;orientedMolecule(parent,'H2O',[x,y,z],.3,i);}
    const acidic=p.ph<7,basic=p.ph>7,excess=Math.min(6,Math.round(Math.abs(p.ph-7)));
    const hydronium=acidic?1+excess:1,hydroxide=basic?1+excess:1;
    for(let i=0;i<Math.max(hydronium,hydroxide);i++){
      const column=i%2,row=Math.floor(i/2),z=(row-1)*.78,y=-.18+(column*.22);
      if(i<hydronium)orientedMolecule(parent,'H3O',[-1.35+column*.75,y,z],.3,i+9);
      if(i<hydroxide)orientedMolecule(parent,'OH',[.6+column*.75,y+.04,z+.12],.32,i+12);
    }
    return;
  }
  if (p.type === 'strength') {
    const strong = p.strength === 'Fort', ionized = strong ? 6 : 0;
    if(strong){for(let i=0;i<ionized;i++){const column=i%2,row=Math.floor(i/2),z=(row-1)*.86,y=column*.24-.12;orientedMolecule(parent,'H3O',[-1.3+column*.65,y,z],.32,i);sphere(parent,'Cl',[.65+column*.65,y,z],.54,{label:i===0,labelText:'Cl⁻'});}}
    else for(let i=0;i<6;i++){const x=(i%3-1)*1.25,z=(Math.floor(i/3)-.5)*1.15,y=(i%2)*.38-.19;orientedMolecule(parent,'HF',[x,y,z],.42,i,{labels:i===0});}
    return;
  }
  if (p.type === 'lewis') {
    const nitrogen = p.reacted ? [-.85,0,0] : [-1.55,0,0];
    const boron = p.reacted ? [.85,0,0] : [1.2,0,0];
    molecule(parent,'NH3',nitrogen,.95,{labels:true});
    const b = sphere(parent,'B',boron,1.1,{label:true});
    // BF3 is trigonal planar: each F and its bridge share the same B-centred
    // geometry. Keeping endpoints at atom centres makes every declared bond
    // visibly terminate inside the two atoms it connects.
    const fluorines=[[boron[0],1.02,0],[boron[0],-.51,.884],[boron[0],-.51,-.884]];
    fluorines.forEach((xyz)=>{ bond(parent,boron,xyz,1,'#b8d8ce',.075);sphere(parent,'F',xyz,.82); });
    if(p.reacted){ bond(parent,nitrogen,boron,1,'#72f4d0',.09); sphere(parent,'e',[0,.16,.12],.8,{glow:true}); sphere(parent,'e',[0,-.16,.12],.8,{glow:true}); b.material.emissiveIntensity=.7; }
    else { sphere(parent,'e',[nitrogen[0]+.28,.15,-.5],.6,{glow:true});sphere(parent,'e',[nitrogen[0]+.28,-.15,-.5],.6,{glow:true}); }
    return;
  }
  if (p.type === 'application') {
    const soil = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7,3),new THREE.MeshStandardMaterial({color:'#876748',roughness:.95,flatShading:true})); soil.position.y=-.72; soil.scale.set(1.7,.52,1.2); parent.add(soil);
    for(let i=0;i<12;i++){
      const x=Math.sin(i*7.1)*1.72,z=Math.cos(i*4.7)*1.05,y=-.08+(i%4)*.28;
      if(p.choice==='Eau')orientedMolecule(parent,'H2O',[x,y,z],.42,i);
      else if(p.choice==='Sol calcaire'){
        sphere(parent,'Ca',[x-.28,y,z],.55,{label:i%4===0,labelText:'Ca²⁺'});
        orientedMolecule(parent,'CO3',[x+.28,y,z],.42,i+12);
      }else sphere(parent,'Si',[x,y,z],.62,{chemical:false,color:'#b59a75',materialName:'Particule minérale du sol'});
    }
    return;
  }
  if (p.type === 'redox') {
    const atomScale=.72,ironCenter=-2.45,copperCenter=2.45;
    const ironElement={symbol:'Fe',number:26,massNumber:56,shells:[2,8,14,2]},copperElement={symbol:'Cu',number:29,massNumber:64,shells:[2,8,18,1]};
    const iron=new THREE.Group(),copper=new THREE.Group();iron.position.x=ironCenter;copper.position.x=copperCenter;iron.scale.setScalar(atomScale);copper.scale.setScalar(atomScale);parent.add(iron,copper);
    const ironElectrons=p.reacted?24:26,copperElectrons=p.reacted?29:27;
    atomModel(iron,'Fe',26,30,ironElectrons,ironElement);const copperModel=atomModel(copper,'Cu',29,35,copperElectrons,copperElement);
    addCaption(parent,`${p.reacted?'Fe²⁺':'Fe'} · 26 p⁺ · 30 n⁰`,[ironCenter,2.45,0],COLORS.Fe);
    addCaption(parent,`${p.reacted?'Cu':'Cu²⁺'} · 29 p⁺ · 35 n⁰`,[copperCenter,2.45,0],COLORS.Cu);
    if(p.reacted){
      // Cu²⁺ gains one electron in the third shell and one in the fourth.
      // Hide those two product-state electrons until the travelling markers arrive.
      const targets=[
        copperModel.electrons.find((electron)=>electron.userData.orbit.shellIndex===2&&electron.userData.orbit.shellElectronIndex===17),
        copperModel.electrons.find((electron)=>electron.userData.orbit.shellIndex===3&&electron.userData.orbit.shellElectronIndex===0),
      ].filter(Boolean);
      targets.forEach((electron)=>{electron.visible=false;});
      const fourthShell=copperModel.shellTracks.find((track)=>track.userData.shellIndex===3);if(fourthShell)fourthShell.visible=false;
      const transientIronShell=addShellTrack(iron,3,.3);
      for(let i=0;i<2;i++){
        const lane=(i===0?-.55:.55),start=shellElectronPosition(3,2,i).multiplyScalar(atomScale).add(new THREE.Vector3(ironCenter,lane,0));
        const target=targets[i],shell=i===0?2:3,shellCount=i===0?18:1,targetIndex=i===0?17:0;
        const end=shellElectronPosition(shell,shellCount,targetIndex).multiplyScalar(atomScale).add(new THREE.Vector3(copperCenter,lane,0));
        const electron=sphere(parent,'e',start.toArray(),.95,{glow:true});
        electron.userData.transfer={start,end,phase:i*.16,mode:'once',duration:1.25,startTime:null,onComplete:()=>{electron.visible=false;if(target)target.visible=true;if(i===1)transientIronShell.visible=false;if(i===1&&fourthShell)fourthShell.visible=true;}};
      }
    }
    return;
  }
  if (p.type === 'cell' || p.type === 'electrolysis') {
    makeBeaker(parent);
    const galvanic=p.type==='cell', reversed = !galvanic && p.reversed;
    const leftSymbol = galvanic?'Zn':'C', rightSymbol = galvanic?'Cu':'C';
    const leftX=-1.1,rightX=1.1;
    const electrode = (symbol,x)=>{ const rod=new THREE.Mesh(new THREE.CylinderGeometry(.14,.2,2.3,32),new THREE.MeshPhysicalMaterial({color:COLORS[symbol],metalness:.78,roughness:.22,clearcoat:1}));rod.position.set(x,-.05,0);parent.add(rod);};
    electrode(leftSymbol,leftX);electrode(rightSymbol,rightX);
    if(galvanic){
      const divider=new THREE.Mesh(new THREE.BoxGeometry(.055,2.7,2.3),new THREE.MeshPhysicalMaterial({color:'#a4edf0',transparent:true,opacity:.24,roughness:.18,side:THREE.DoubleSide}));divider.position.set(0,-.1,0);parent.add(divider);
      for(let i=0;i<8;i++){const y=-1.22+(i%4)*.55,z=(Math.floor(i/4)-.5)*.8;sphere(parent,'Zn',[-1.63,y,z],.5,{label:i===0,labelText:'Zn²⁺',opacity:.88});sphere(parent,'Cu',[1.63,y,z],.5,{label:i===0,labelText:'Cu²⁺',opacity:.88});}
      const bridge=new THREE.CatmullRomCurve3([new THREE.Vector3(-1.55,.52,.7),new THREE.Vector3(-1.55,1.18,.7),new THREE.Vector3(0,1.18,.7),new THREE.Vector3(1.55,1.18,.7),new THREE.Vector3(1.55,.52,.7)]);parent.add(new THREE.Mesh(new THREE.TubeGeometry(bridge,40,.075,12,false),new THREE.MeshPhysicalMaterial({color:'#7bd6c8',transparent:true,opacity:.82,roughness:.25})));
    }else{
      for(let i=0;i<12;i++){const x=(i%3-1)*.82,z=(Math.floor(i/3)-1)*.68,y=-1.15+(i%2)*.22;orientedMolecule(parent,'H2O',[x,y,z],.34,i);}
      if(p.reacted){const cathodeX=reversed?leftX:rightX,anodeX=reversed?rightX:leftX;molecule(parent,'H2',[cathodeX-.24,.92,0],.52,{labels:true});molecule(parent,'H2',[cathodeX+.24,.92,.28],.52);molecule(parent,'O2',[anodeX,.92,0],.56,{labels:true});}
    }
    bond(parent,[leftX,1.15,0],[leftX,1.75,0],1,'#89c8b5',.055);
    if(galvanic)bond(parent,[leftX,1.75,0],[rightX,1.75,0],1,'#89c8b5',.055);
    else{
      bond(parent,[leftX,1.75,0],[-.3,1.75,0],1,'#89c8b5',.055);bond(parent,[.3,1.75,0],[rightX,1.75,0],1,'#89c8b5',.055);
      const source=new THREE.Mesh(new THREE.BoxGeometry(.6,.38,.3),new THREE.MeshPhysicalMaterial({color:'#d6ae58',metalness:.55,roughness:.25,emissive:'#755822',emissiveIntensity:.2}));source.position.set(0,1.75,0);parent.add(source);
    }
    bond(parent,[rightX,1.75,0],[rightX,1.15,0],1,'#89c8b5',.055);
    const electron=sphere(parent,'e',[p.reacted?(reversed?rightX:leftX):0,1.75,0],.82,{glow:true}); if(p.reacted)electron.userData.transfer={start:new THREE.Vector3(reversed?rightX:leftX,1.75,0),end:new THREE.Vector3(reversed?leftX:rightX,1.75,0),phase:0,mode:'once',duration:1.15,startTime:null};
    return;
  }
  if (p.type === 'corrosion') {
    const wet=p.choice==='Humide', coated=p.choice==='Protégé', running=p.reacted&&wet;
    const steel=new THREE.Mesh(new THREE.BoxGeometry(4.5,.55,2.8),new THREE.MeshPhysicalMaterial({color:'#455d66',metalness:.82,roughness:.3,clearcoat:.45}));steel.position.set(0,-.68,0);steel.castShadow=true;steel.receiveShadow=true;parent.add(steel);
    const ironSites=[];
    for(let x=0;x<5;x++)for(let z=0;z<3;z++){
      const pos=[(x-2)*.78,-.36,(z-1)*.72], atom=sphere(parent,'Fe',pos,.72,{label:x===0&&z===1,labelText:'Fe · fer'});
      ironSites.push({atom,position:new THREE.Vector3(...pos),x,z});
    }
    const oxygenPosition=[.22,1.22,.42];
    orientedMolecule(parent,'O2',oxygenPosition,.48,1);
    if(wet){
      const waterFilm=new THREE.Mesh(new THREE.BoxGeometry(4.4,.24,2.72),new THREE.MeshPhysicalMaterial({color:'#54c7c7',transparent:true,opacity:.23,roughness:.16,metalness:.05,transmission:.12,depthWrite:false,side:THREE.DoubleSide}));waterFilm.position.set(0,.03,0);waterFilm.renderOrder=2;parent.add(waterFilm);
      [[-1.28,.13,-.54],[1.28,.14,-.52]].forEach((pos,index)=>orientedMolecule(parent,'H2O',pos,.31,index));
    }
    if(coated){
      const paint=new THREE.Mesh(new THREE.BoxGeometry(4.58,.15,2.88),new THREE.MeshPhysicalMaterial({color:'#63b7a4',metalness:.32,roughness:.22,clearcoat:1,transparent:true,opacity:.86}));paint.position.set(0,-.29,0);paint.castShadow=true;paint.receiveShadow=true;parent.add(paint);
      addCaption(parent,'REVÊTEMENT · BARRIÈRE',[0,1.75,0],'#8ee0cb').scale.set(1.35,.36,1);
    }
    if(wet&&!running)addCaption(parent,'EAU + O₂',[0,1.75,0],'#7fe1dc').scale.set(1.35,.36,1);
    else if(!wet&&!coated)addCaption(parent,'AIR · O₂ · SANS EAU',[0,1.75,0],'#b3d3da').scale.set(1.35,.36,1);
    if(running){
      const sources=[ironSites[6],ironSites[8]], target=new THREE.Vector3(...oxygenPosition);
      const rustGroup=new THREE.Group();parent.add(rustGroup);
      [[-.7,-.06,-.28],[.12,-.04,.02],[.73,-.05,-.25],[-.34,-.045,.4],[.47,-.04,.4]].forEach(([x,y,z],index)=>{const material=new THREE.MeshStandardMaterial({color:index%2?'#a95134':'#c36b43',roughness:.94,metalness:0});const patch=new THREE.Mesh(new THREE.IcosahedronGeometry(.42,2),material);patch.position.set(x,y,z);patch.scale.set(.84+(index%3)*.08,.2,.62+(index%2)*.08);patch.rotation.set(index*.21,index*1.7,index*.37);patch.castShadow=true;patch.receiveShadow=true;rustGroup.add(patch);});
      rustGroup.visible=false;
      sources.forEach((source,sourceIndex)=>{
        const start=source.position.clone().add(new THREE.Vector3(0,.18,0));
        const ion=sphere(parent,'Fe',start.toArray(),.44,{label:sourceIndex===0,labelText:'Fe²⁺',color:'#f0a16d',glow:true});ion.visible=false;
        ion.userData.corrosionIon={start,end:start.clone().add(new THREE.Vector3(sourceIndex===0?-.18:.18,.9,sourceIndex===0?-.12:.12)),source:source.atom};
        for(let electronIndex=0;electronIndex<2;electronIndex++){
          const lane=(electronIndex===0?-.1:.1)+(sourceIndex-.5)*.16;
          const from=start.clone().add(new THREE.Vector3(0,lane,0)),to=target.clone().add(new THREE.Vector3(lane*.7,.04,sourceIndex===0?-.11:.11));
          const points=[from,from.clone().lerp(to,.35).add(new THREE.Vector3(0,.25,0)),from.clone().lerp(to,.72).add(new THREE.Vector3(0,.2,0)),to];
          const curve=new THREE.CatmullRomCurve3(points),line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(32)),new THREE.LineDashedMaterial({color:'#77f5d5',dashSize:.09,gapSize:.075,transparent:true,opacity:.82}));line.computeLineDistances();parent.add(line);
          const electron=sphere(parent,'e',from.toArray(),.72,{glow:true});electron.userData.transfer={start:from,end:to,phase:.28+electronIndex*.14+sourceIndex*.52,mode:'once',duration:1.35,startTime:null,onComplete:()=>{electron.visible=false;if(sourceIndex===0&&electronIndex===0){source.atom.visible=false;ion.visible=true;ion.userData.transfer={start:ion.userData.corrosionIon.start,end:ion.userData.corrosionIon.end,phase:0,mode:'once',duration:.7,startTime:null};}if(sourceIndex===1&&electronIndex===0){sources[1].atom.visible=false;parent.children.filter((child)=>child.userData.corrosionIon&&child.userData.corrosionIon.source===sources[1].atom).forEach((item)=>{item.visible=true;item.userData.transfer={start:item.userData.corrosionIon.start,end:item.userData.corrosionIon.end,phase:0,mode:'once',duration:.7,startTime:null};});}if(sourceIndex===1&&electronIndex===1)rustGroup.visible=true;}};
        }
      });
      addCaption(parent,'TRANSFERT e⁻ → O₂',[0,1.75,0],'#8df5dc').scale.set(1.45,.38,1);
    }
    return;
  }
  if (p.type === 'naming') {
    const model = hydrocarbon3dById[['methane','ethane','propane','butane','pentane','hexane','heptane','octane','nonane','décane','undécane','dodécane'][p.carbonCount - 1]];
    if (model) {
      const scale = .72 * Math.min(1, 3.4 / Math.max(3.4,p.carbonCount - 1));
      renderMolecularModel(parent, model, scale, p.carbonCount <= 5);
    }
    return;
  }
  if (p.type === 'functional') {
    const variants={Alcool:{a:['C','C','O','H'],x:[[-.9,0,0],[0,0,0],[.3,.67,.67],[.02,.9,1.34]],links:[[0,1,1],[1,2,1],[2,3,1]]},'Acide carboxylique':{a:['C','C','O','O','H'],x:[[-1.2,0,0],[0,0,0],[.85,.62,0],[.85,-.62,0],[1.45,-.62,0]],links:[[0,1,1],[1,2,2],[1,3,1],[3,4,1]]},Ester:{a:['C','C','O','C','O'],x:[[-1.5,0,0],[-.5,0,0],[.35,0,0],[1.3,.22,.58],[.35,.8,0]],links:[[0,1,1],[1,2,1],[2,3,1],[2,4,2]]},Aldéhyde:{a:['C','C','O','H'],x:[[-.9,0,0],[0,0,0],[.8,.62,0],[.8,-.62,0]],links:[[0,1,1],[1,2,2],[1,3,1]]}};
    const m=variants[p.choice]||variants.Alcool; m.links.forEach(([a,b,o])=>bond(parent,m.x[a],m.x[b],o));m.a.forEach((sym,i)=>sphere(parent,sym,m.x[i],.58,{label:true})); return;
  }
  if (p.type === 'organic-reaction') {
    const reaction = reaction3dData.find(({ id }) => id === 'ethene-hydrogenation');
    renderReactionSnapshot(parent, reaction, p.reacted ? 1 : 0);
    return;
  }
  if (p.type === 'biomolecule') {
    if(p.choice==='ADN') { const pointsA=[],pointsB=[];for(let i=0;i<48;i++){const t=i*.27,y=(i-24)*.09;pointsA.push([Math.cos(t)*1.05,y,Math.sin(t)*1.05]);pointsB.push([Math.cos(t+Math.PI)*1.05,y,Math.sin(t+Math.PI)*1.05]);sphere(parent,i%4===0?'O':'C',pointsA[i],.24);sphere(parent,i%3===0?'N':'C',pointsB[i],.24);if(i>0){bond(parent,pointsA[i-1],pointsA[i],1,'#80d9d0',.05);bond(parent,pointsB[i-1],pointsB[i],1,'#b69cff',.05);}} }
    else if(p.choice==='Protéines'){let prev=null;for(let i=0;i<44;i++){const t=i*.47,point=[1.4*Math.sin(t)*(.85+Math.sin(t*.23)*.3),1.4*Math.cos(t*.61)*.92,1.4*Math.sin(t*.73)*.7];sphere(parent,['C','N','O','C','S'][i%5],point,.38);if(prev)bond(parent,prev,point,1,'#b6a1e5',.05);prev=point;}}
    else if(p.choice==='Lipides'){const head=[-1.45,0,0];sphere(parent,'O',head,.82,{glow:true,label:true});for(let strand=0;strand<2;strand++){let prev=head;for(let i=0;i<11;i++){const point=[-.8+i*.34,Math.sin(i*.43+strand)*(.12+strand*.06),(strand-.5)*.56];sphere(parent,i%5===0?'O':'C',point,.3);bond(parent,prev,point,1,'#e5bc80',.05);prev=point;}}}
    else {const pts=[];for(let i=0;i<6;i++){const a=i*Math.PI/3,pt=[Math.cos(a)*1.2,Math.sin(a)*1.2,Math.sin(a*2)*.18];pts.push(pt);sphere(parent,i===0?'O':'C',pt,.55,{label:i===0});}for(let i=0;i<6;i++)bond(parent,pts[i],pts[(i+1)%6],1,'#8dddaf',.06);}
    return;
  }
}

export default function ChemistryScene3D({ type, element, charge, formula, ph, carbonCount, phase, mixture, strength, choice, reversed, coefficients, reacted, spinning, onToggleSpin, onReset, compact = false }) {
  const mountRef = useRef(null); const controlsRef = useRef(null); const cameraRef=useRef(null); const groupRef = useRef(null); const fitRef=useRef(null); const [failed,setFailed]=useState(false); const spinningRef=useRef(spinning); const typeRef=useRef(type); spinningRef.current=spinning; typeRef.current=type;
  const settings=useMemo(()=>({type,element,charge,formula,ph,carbonCount,phase,mixture,strength,choice,reversed,coefficients,reacted}),[type,element,charge,formula,ph,carbonCount,phase,mixture,strength,choice,reversed,coefficients,reacted]);
  useEffect(()=>{
    const host=mountRef.current;if(!host)return;
    let renderer,controls,observer,frame=0;
    try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'}); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.setClearColor(0x071113,0);renderer.domElement.className='chemistry-canvas';renderer.domElement.setAttribute('aria-label','Scène scientifique 3D manipulable : fais glisser pour tourner et utilise la molette ou le pincement pour zoomer.');host.appendChild(renderer.domElement);
    const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x071113,type==='matter'?.02:.045);
    const camera=new THREE.PerspectiveCamera(36,1,type==='matter-zoom' ? 0.001 : 0.1,90);camera.position.set(type==='atom'?7.8:compact?3.6:4.8,type==='atom'?5.2:compact?2.4:2.8,type==='atom'?9.6:compact?4.7:6.2);cameraRef.current=camera;
    controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.12;controls.enablePan=type==='matter-zoom';controls.enableRotate=type!=='matter-zoom';controls.enableZoom=true;controls.minDistance=type==='matter-zoom' ? 0.008 : 4;controls.maxDistance=type==='redox'?40:18;controls.zoomSpeed=2.1;controls.autoRotate=spinningRef.current;controls.autoRotateSpeed=.6;controlsRef.current=controls;
    scene.add(new THREE.HemisphereLight(0xc9fff2,0x16252f,2.15));
    const key=new THREE.DirectionalLight(0xffffff,3.7);key.position.set(4,7,6);scene.add(key);
    const rim=new THREE.PointLight(0x35d8c3,95,18,2);rim.position.set(-4,1,3);scene.add(rim);
    const violet=new THREE.PointLight(0x7b76ff,58,16,2);violet.position.set(2,-1,-5);scene.add(violet);
    const starPos=[];for(let i=0;i<170;i++)starPos.push((Math.random()-.5)*24,(Math.random()-.5)*15,(Math.random()-.5)*16-5);const stars=new THREE.BufferGeometry();stars.setAttribute('position',new THREE.Float32BufferAttribute(starPos,3));scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0x91c8bc,size:.018,transparent:true,opacity:.66,sizeAttenuation:true})));
    const group=new THREE.Group();scene.add(group);groupRef.current=group;
    const fitScene=()=>{
      const sceneType=typeRef.current;
      if(sceneType==='atom'||sceneType==='matter-zoom'||(sceneType==='balance'&&host.clientWidth<500))return;
      group.updateMatrixWorld(true);
      const bounds=new THREE.Box3().setFromObject(group);
      if(bounds.isEmpty())return;
      const sphere=bounds.getBoundingSphere(new THREE.Sphere());
      const width=Math.max(host.clientWidth,1),height=Math.max(host.clientHeight,1),aspect=width/height;
      const halfWidthTangent=Math.tan(camera.fov*Math.PI/360)*Math.max(aspect,.5);
      const requiredDistance=sphere.radius/halfWidthTangent*(sceneType==='corrosion'?1.12:1.1);
      const offset=camera.position.clone().sub(controls.target);
      if(offset.lengthSq()<1e-6)offset.set(4.8,2.8,6.2);
      controls.target.copy(sphere.center);
      camera.position.copy(sphere.center).add(offset.setLength(sceneType==='corrosion'?requiredDistance:Math.max(offset.length(),requiredDistance)));
      controls.update();
    };
    fitRef.current=fitScene;
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),spherical=new THREE.Spherical();
    const pointers=new Map();let press=null,pinchStart=null;
    const onScenePointerDown=(event)=>{
      const sceneType=typeRef.current;
      if(event.button!==0)return;
      if(sceneType==='matter'){press={id:event.pointerId,x:event.clientX,y:event.clientY,moved:0};return;}
      if(sceneType!=='matter-zoom')return;
      event.preventDefault();event.stopImmediatePropagation();const point={x:event.clientX,y:event.clientY};pointers.set(event.pointerId,point);if(pointers.size===1)press={id:event.pointerId,x:point.x,y:point.y,moved:0};if(pointers.size===2){const values=[...pointers.values()];pinchStart={distance:Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y),radius:camera.position.distanceTo(controls.target)};}try{renderer.domElement.setPointerCapture(event.pointerId);}catch{}
    };
    const onScenePointerMove=(event)=>{
      if(typeRef.current==='matter'){if(press?.id===event.pointerId)press.moved=Math.max(press.moved,Math.hypot(event.clientX-press.x,event.clientY-press.y));return;}
      const previous=pointers.get(event.pointerId);if(!previous)return;event.preventDefault();event.stopImmediatePropagation();pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(press)press.moved=Math.max(press.moved,Math.hypot(event.clientX-press.x,event.clientY-press.y));if(pointers.size>=2&&pinchStart){const values=[...pointers.values()],distance=Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y),radius=Math.max(.008,Math.min(18,pinchStart.radius*pinchStart.distance/Math.max(distance,1))),direction=camera.position.clone().sub(controls.target).normalize();camera.position.copy(controls.target).addScaledVector(direction,radius);camera.lookAt(controls.target);controls.update();}else{const bounds=renderer.domElement.getBoundingClientRect(),dx=event.clientX-previous.x,dy=event.clientY-previous.y,offset=camera.position.clone().sub(controls.target);spherical.setFromVector3(offset);spherical.theta-=dx/Math.max(bounds.width,1)*Math.PI*2;spherical.phi-=dy/Math.max(bounds.height,1)*Math.PI*2;spherical.makeSafe();camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));camera.lookAt(controls.target);controls.update();}
    };
    const identifyAtom=(event)=>{
      const bounds=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-((event.clientY-bounds.top)/bounds.height*2-1));raycaster.setFromCamera(pointer,camera);
      const hits=raycaster.intersectObject(group,true).filter(({object})=>{const material=object.material;return (object.userData.chemicalSymbol||object.userData.materialName)&&object.visible&&(!material||((Array.isArray(material)?material[0]:material).opacity??1)>.12);});
      // Prefer an atom's visible label when the pointer lands on it. Labels sit
      // slightly in front of their spheres and should identify that atom even
      // when another molecule overlaps behind or in front of it.
      const hit=hits.find(({object})=>object.isSprite)||hits[0];
      if(!hit)return;
      const {chemicalSymbol,materialName}=hit.object.userData;
      const names={H:'Hydrogène',O:'Oxygène',Si:'Silicium',Na:'Sodium',Ca:'Calcium',N:'Azote',Cl:'Chlore'};
      const label=host.querySelector('.matter-selection-label');
      if(label)label.textContent=materialName?materialName:`${names[chemicalSymbol]||chemicalSymbol} (${chemicalSymbol})${chemicalSymbol==='Na'?' · ion sodium Na⁺':chemicalSymbol==='Cl'?' · ion chlorure Cl⁻':''} · élément sélectionné`;
    };
    const onScenePointerUp=(event)=>{
      const sceneType=typeRef.current;
      if(sceneType==='matter'){
        const wasClick=press?.id===event.pointerId&&press.moved<5;press=null;
        if(wasClick)identifyAtom(event);
        return;
      }
      if(!pointers.has(event.pointerId))return;event.preventDefault();event.stopImmediatePropagation();pointers.delete(event.pointerId);if(pointers.size<2)pinchStart=null;const wasClick=press&&press.id===event.pointerId&&press.moved<5;press=null;if(wasClick&&sceneType==='matter-zoom')identifyAtom(event);try{renderer.domElement.releasePointerCapture(event.pointerId);}catch{}
    };
    const onScenePointerCancel=(event)=>{pointers.delete(event.pointerId);press=null;pinchStart=null;};
    renderer.domElement.addEventListener('pointerdown',onScenePointerDown,true);renderer.domElement.addEventListener('pointermove',onScenePointerMove,true);renderer.domElement.addEventListener('pointerup',onScenePointerUp,true);renderer.domElement.addEventListener('pointercancel',onScenePointerCancel,true);
    const resize=()=>{const width=Math.max(host.clientWidth,1),height=Math.max(host.clientHeight,1);camera.aspect=width/height;camera.updateProjectionMatrix();const narrowBalance=typeRef.current==='balance'&&width<500;group.scale.setScalar(narrowBalance?.8:1);if(narrowBalance)camera.position.set(4.8,2.8,6.2).setLength(10.2);fitScene();renderer.setSize(width,height,false);renderer.render(scene,camera);};observer=new ResizeObserver(resize);observer.observe(host);resize();
    let lastFrame=performance.now(),simulationTime=0;renderer.setAnimationLoop((t)=>{const delta=Math.min((t-lastFrame)/1000,.05);lastFrame=t;if(spinningRef.current)simulationTime+=delta;const sec=simulationTime;controls.autoRotate=typeRef.current==='matter-zoom'?false:spinningRef.current;controls.enableZoom=true;controls.enablePan=typeRef.current==='matter-zoom';controls.enableRotate=typeRef.current!=='matter-zoom';controls.minDistance=typeRef.current==='matter-zoom'?.008:4;controls.maxDistance=typeRef.current==='redox'?40:18;controls.update();group.rotation.y=typeRef.current==='atom'?0:Math.sin(sec*.25)*.045;group.rotation.x=typeRef.current==='molecule'?Math.sin(sec*.31)*.025:0;group.traverse(obj=>{if(obj.userData.orbit){const o=obj.userData.orbit,a=sec*o.speed+o.phase;obj.position.set(Math.cos(a)*o.radius,0,Math.sin(a)*o.radius).applyEuler(o.rotation);}if(obj.userData.transfer){const transfer=obj.userData.transfer,{start,end,phase:offset=0,mode,duration=1}=transfer;if(mode==='once'&&transfer.startTime==null)transfer.startTime=sec;const progress=mode==='once'?THREE.MathUtils.clamp((sec-transfer.startTime-offset)/duration,0,1):(Math.sin(sec*1.25+offset)+1)/2;const f=mode==='once'?THREE.MathUtils.smoothstep(progress,0,1):progress;obj.position.copy(start).lerp(end,f);if(mode==='once'&&progress>=1&&!transfer.completed){transfer.completed=true;transfer.onComplete?.(obj);}} });
      if(typeRef.current==='matter-zoom'&&group.userData.matterLayers){const d=camera.position.distanceTo(controls.target),vertical=(camera.position.y-controls.target.y)/Math.max(d,.001),waterView=smoothStep(.12,.72,vertical),glassView=1-waterView,layers=group.userData.matterLayers;const waterLayer=smoothStep(.9,.28,d)*waterView,waterCore=smoothStep(.32,.095,d)*waterView,waterAtomsFade=smoothStep(.09,.022,d)*waterView,glassCore=smoothStep(1.5,1.0,d)*glassView,shellFade=1-smoothStep(.45,.1,d)*.72,waterFade=Math.max(0,1-smoothStep(.9,.25,d)*.96);const azimuth=Math.atan2(camera.position.x-controls.target.x,camera.position.z-controls.target.z);layers.glassNetwork.position.set(0,0,0);layers.glassNetwork.rotation.y=azimuth;const fades={glass:shellFade,water:waterFade,waterMolecules:waterLayer,waterMolecule:waterCore,waterAtoms:waterAtomsFade,glassNetwork:glassCore};for(const [name,opacity] of Object.entries(fades)){for(const {material,base} of layers[name].userData.opacityMaterials){material.opacity=base*opacity;material.transparent=base<.999||opacity<.999;material.depthWrite=base>=.999&&opacity>=.999;}}const focus=waterView>.58?'EAU':'VERRE';const scale=d>.9?'SURFACE':d>.28?'ZOOM DANS LA MATIÈRE':d>.095?waterView>.58?'H₂O':'RÉSEAU VERRE':waterView>.58?'ATOMES H/O':'ATOMES Si/O';const badge=host.querySelector('.matter-focus-label');if(badge){const value=focus+'  ·  '+scale;if(badge.textContent!==value)badge.textContent=value;}const composition=host.querySelector('.matter-composition-label');if(composition){const value=waterView>.58?'H hydrogène · O oxygène · H₂O · clic pour identifier':'Si silicium · O oxygène · Na sodium · Ca calcium · clic pour identifier';if(composition.textContent!==value)composition.textContent=value;}}
      if(typeRef.current==='atom'&&group.userData.atomAnchors){const svg=host.querySelector('.atom-callouts svg');if(svg){const bounds=host.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);svg.setAttribute('preserveAspectRatio','none');const specs=[['nucleus','callout-nucleus'],['proton','callout-proton'],['neutron','callout-neutron'],['shell','callout-shell'],['electron','callout-electron']];for(const [key,labelClass] of specs){const path=svg.querySelector(`[data-anchor="${key}"]`),label=host.querySelector(`.${labelClass}`),anchor=group.userData.atomAnchors[key];if(!path||!label||!anchor)continue;if(key==='neutron'&&!group.userData.neutronCount){path.style.display='none';continue;}path.style.display='';const labelBounds=label.getBoundingClientRect();const target=anchor.getWorldPosition(new THREE.Vector3()).project(camera);const tx=(target.x*.5+.5)*bounds.width,ty=(-target.y*.5+.5)*bounds.height;const sx=(labelBounds.left+(labelBounds.right<bounds.left+bounds.width/2?labelBounds.width:0))-bounds.left,sy=labelBounds.top+labelBounds.height/2-bounds.top;const elbow=sx+(tx-sx)*.55;path.setAttribute('d',`M ${sx} ${sy} L ${elbow} ${sy} L ${tx} ${ty}`);}}
      }renderer.render(scene,camera);});
    return()=>{fitRef.current=null;renderer.setAnimationLoop(null);observer?.disconnect();renderer.domElement.removeEventListener('pointerdown',onScenePointerDown,true);renderer.domElement.removeEventListener('pointermove',onScenePointerMove,true);renderer.domElement.removeEventListener('pointerup',onScenePointerUp,true);renderer.domElement.removeEventListener('pointercancel',onScenePointerCancel,true);controls.dispose();scene.traverse(obj=>{if(obj.geometry)obj.geometry.dispose();if(obj.material){const materials=Array.isArray(obj.material)?obj.material:[obj.material];materials.forEach(m=>{if(m.map)m.map.dispose();m.dispose();});}});renderer.dispose();renderer.domElement.remove();};
  },[]);
  useEffect(()=>{const group=groupRef.current;if(!group)return;while(group.children.length){const child=group.children[0];group.remove(child);child.traverse?.(obj=>{if(obj.geometry)obj.geometry.dispose();if(obj.material){const materials=Array.isArray(obj.material)?obj.material:[obj.material];materials.forEach(mat=>{if(mat.map)mat.map.dispose();mat.dispose();});}});}if(settings.type==='molecule'&&compact)molecule(group,settings.formula,[0,0,0],1.55,{labels:true});else buildModel(group,settings);if(cameraRef.current&&controlsRef.current){controlsRef.current.maxDistance=settings.type==='redox'?40:18;if(settings.type==='atom'){const outer=1+((settings.element?.shells?.length||1)-1)*.43;const aspect=Math.max(.65,(mountRef.current?.clientWidth||400)/(mountRef.current?.clientHeight||400));const distance=Math.max(13.5,outer/(Math.tan(36*Math.PI/360)*aspect)*1.28);cameraRef.current.position.set(7.8,5.2,9.6).setLength(distance);cameraRef.current.near=.1;cameraRef.current.updateProjectionMatrix();controlsRef.current.minDistance=4;controlsRef.current.enablePan=false;controlsRef.current.enableRotate=true;}else if(settings.type==='matter-zoom'){cameraRef.current.position.set(4.8,2.8,6.2);cameraRef.current.near=.001;cameraRef.current.updateProjectionMatrix();controlsRef.current.minDistance=.008;controlsRef.current.enablePan=true;controlsRef.current.enableRotate=false;}controlsRef.current.target.set(0,settings.type==='matter-zoom'?.45:0,0);if(settings.type==='redox')cameraRef.current.position.set(0,0,20);fitRef.current?.();controlsRef.current.update();controlsRef.current.saveState();}},[settings,compact]);
  const reset=()=>{if(controlsRef.current){controlsRef.current.reset();onReset?.();}};
  const readout={atom:`${element.symbol} · ${element.number} p⁺ · ${Math.max(0,element.number-charge)} e⁻`,molecule:formulaLabel(formula),matter:mixture==='Eau salée'&&phase==='Gaz'?'Évaporation · H₂O(g) + NaCl(s)':mixture==='Eau salée'&&phase==='Solide'?'Glace H₂O · saumure piégée':`${phase} · ${mixture}`,'matter-zoom':'Explore la matière · zoom continu',balance:'Combustion du méthane',ph:`pH ${String(ph).replace('.',',')}`,strength:strength==='Fort'?'HCl · acide fort':'HF · acide faible',lewis:reacted?'Complexe donneur-accepteur':'Doublet libre de NH₃',application:choice,redox:'Transfert d’électrons',cell:'Pile · compartiments Zn / Cu',electrolysis:'Électrolyse de l’eau',corrosion:choice,naming:['Méthane','Éthane','Propane','Butane','Pentane','Hexane','Heptane','Octane','Nonane','Décane','Undécane','Dodécane'][carbonCount-1],functional:choice,'organic-reaction':reacted?'Éthane formé':'Réaction d’addition',biomolecule:choice}[type]||'Modèle moléculaire';
  const legendSymbols=type==='atom'?['p','n','e']:type==='matter-zoom'?['H','O','Si','Na','Ca']:type==='matter'?mixture==='Air'?['N','O']:mixture==='Eau salée'?['H','O','Na','Cl']:mixture==='Eau boueuse'?['H','O']:['H','O']:type==='molecule'?({H2O:['H','O'],CO2:['C','O'],CH4:['C','H'],NH3:['N','H']}[formula]||['H','O']):type==='balance'?['C','H','O']:type==='naming'||type==='organic-reaction'?['C','H']:type==='functional'?['C','H','O']:type==='ph'?['H','O']:type==='strength'?['H','O',strength==='Fort'?'Cl':'F']:type==='lewis'?['H','N','B','F','e']:type==='redox'?['Fe','Cu','e']:type==='cell'?['Zn','Cu','e']:type==='electrolysis'?['H','O','e']:type==='corrosion'?['Fe','O','H']:type==='application'?choice==='Eau'?['H','O']:choice==='Sol calcaire'?['Ca','C','O']:[]:type==='biomolecule'?['C','H','O','N','S']:['H','O'];
  return <div className={`scene3d-shell ${compact ? 'compact' : ''}`}>
    <div className="scene3d-toolbar"><span className="scene3d-title" title={readout}>{readout}</span><div className="scene-tools">{type!=='matter-zoom'&&<button onClick={onToggleSpin} aria-pressed={spinning}>{spinning?'⏸ Pause rotation':'▶ Rotation'}</button>}<button onClick={reset}>◎ Recentrer</button></div></div>
    <div className={`scene3d-stage scene3d-${type} ${type==='atom'?'atom-stage':''} ${type==='matter-zoom'?'matter-zoom-stage':''}`} ref={mountRef}>{failed&&<div className="webgl-fallback"><span>3D indisponible</span><small>Ce navigateur ou cet appareil ne fournit pas WebGL.</small></div>}<div className="scene3d-vignette"/>{type==='matter-zoom'&&<><span className="matter-focus-label">VERRE · SURFACE</span><span className="matter-composition-label">Si silicium · O oxygène · Na sodium · Ca calcium</span></>}{(type==='matter'||type==='matter-zoom')&&<span className="matter-selection-label" role="status" aria-live="polite">Clique sur un atome pour l’identifier</span>}{type==='atom'&&<div className="atom-callouts" aria-label="Repères du modèle atomique"><svg aria-hidden="true"><defs><marker id="atom-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M1 1 L5 3 L1 5" fill="none" stroke="#9cbec0" strokeWidth=".8"/></marker></defs>{['nucleus','proton','neutron','shell','electron'].map((name)=><path key={name} data-anchor={name}/>)}</svg><span className="callout-nucleus">NOYAU</span><span className="callout-proton">PROTON · p⁺</span>{element.massNumber>element.number&&<span className="callout-neutron">NEUTRON · n⁰</span>}<span className="callout-shell">COUCHE ÉLECTRONIQUE</span><span className="callout-electron">ÉLECTRON · e⁻</span></div>}<span className="scene3d-drag">GLISSE POUR TOURNER · CLIC DROIT POUR DÉPLACER · MOLETTE OU PINCE POUR ZOOMER</span></div>
    <div className="scene3d-legend">{legendSymbols.map((symbol)=><span key={symbol}><i style={{'--atom-color':COLORS[symbol]}}/>{symbol==='p'?'p⁺':symbol==='n'?'n⁰':symbol==='e'?'e⁻':symbol}</span>)}<small>{type==='matter-zoom'?'Structure agrandie pour rendre visible l’échelle atomique.':type==='matter'?mixture==='Eau salée'?phase==='Gaz'?'Vapeur H₂O + réseau ionique NaCl(s). Les ponts du cristal représentent les interactions ioniques, pas des liaisons covalentes; proportions schématiques.':phase==='Solide'?'Glace H₂O + poches de saumure Na⁺/Cl⁻; pas de sel sec.':'H₂O + ions Na⁺ et Cl⁻ · aucun atome N.':mixture==='Air'?'Azote N₂ majoritaire; dioxygène O₂.':mixture==='Eau boueuse'?'H₂O + grains minéraux ou organiques, de composition variable; amas schématiques.':'Molécules H₂O uniquement.':type==='application'?choice==='Eau'?'Molécules H₂O.':choice==='Sol calcaire'?'Ca²⁺ et groupes carbonate CO₃²⁻; proportions schématiques.':'Particules minérales variées; composition non détaillée.':type==='cell'?'Zn(s) dans sa demi-pile, Cu²⁺ dans l’autre; pont salin schématique.':type==='electrolysis'?'Eau H₂O et électrodes inertes; produits gazeux montrés pendant l’électrolyse.':'Tailles, distances et proportions sont schématiques.'}</small></div>
  </div>;
}
