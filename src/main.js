import * as THREE from 'three';
import {World} from './world.js';
import {Player} from './player.js';
import {Systems} from './systems.js';
import {WEAPONS} from './config.js';
import {saveGame,loadGame} from './save.js';
import {Missions} from './missions.js';

class Game{
 constructor(){
  this.container=document.getElementById('game');this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x101c2a);
  this.camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.1,900);
  this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.setSize(innerWidth,innerHeight);this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1;this.container.appendChild(this.renderer.domElement);
  this.scene.add(new THREE.HemisphereLight(0xa6dfff,0x26313a,2));
  this.sun=new THREE.DirectionalLight(0xffe4bc,2.2);this.sun.position.set(80,100,30);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);this.sun.shadow.camera.left=-280;this.sun.shadow.camera.right=280;this.sun.shadow.camera.top=280;this.sun.shadow.camera.bottom=-280;this.scene.add(this.sun);
  this.world=new World(this.scene);this.player=new Player(this.scene,this.camera);this.systems=new Systems(this);this.missions=new Missions(this);this.save=()=>saveGame(this);
  this.keys={};this.mouse={x:0,y:0};this.yaw=0;this.pitch=.2;this.locked=false;this.last=performance.now();this.setupEvents();loadGame(this);addEventListener('beforeunload',()=>this.save());this.animate();
 }
 setupEvents(){
  addEventListener('resize',()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);});
  document.addEventListener('keydown',e=>{this.keys[e.code]=true;if(e.repeat)return;const p=this.player;
   if(e.code==='Space'&&!p.inCar)p.jump();if(e.code==='KeyC')p.crouch=!p.crouch;
   if(e.code==='KeyE')this.systems.interact();if(e.code==='KeyF')this.systems.enterCar();if(e.code==='KeyB')this.systems.buy();
   if(e.code==='KeyQ')this.systems.punch();if(e.code==='KeyR')this.systems.reload();if(e.code==='KeyG')this.dropWeapon();
   if(e.code.startsWith('Digit'))p.select(Number(e.code.slice(5))-1);
   if(e.code==='KeyM')document.getElementById('map').classList.toggle('hidden');
   if(e.code==='Tab'){e.preventDefault();this.inventory();}
   if(e.code==='KeyJ')this.systems.job();if(e.code==='F5'){e.preventDefault();this.save();this.systems.toast('Game saved');}if(e.code==='F9'){if(loadGame(this))this.systems.toast('Saved game loaded');else this.systems.toast('No saved game found');}
  });
  document.addEventListener('keyup',e=>this.keys[e.code]=false);
  document.addEventListener('mousemove',e=>{if(document.pointerLockElement===this.renderer.domElement){this.yaw-=e.movementX*.0022;this.pitch=Math.max(-.35,Math.min(.8,this.pitch+e.movementY*.0018));}});
  this.renderer.domElement.addEventListener('click',()=>{if(!this.locked)this.renderer.domElement.requestPointerLock();else this.systems.shoot();});
  document.addEventListener('pointerlockchange',()=>this.locked=document.pointerLockElement===this.renderer.domElement);
  document.getElementById('start').onclick=()=>{document.getElementById('help').classList.add('hidden');this.renderer.domElement.requestPointerLock();};
  document.getElementById('map').addEventListener('click',()=>document.getElementById('map').classList.add('hidden'));
 }
 dropWeapon(){const p=this.player;if(!p.weapons[p.weapon])return;const mesh=new THREE.Mesh(new THREE.BoxGeometry(.5,.18,.8),new THREE.MeshStandardMaterial({color:0xb4c2c8,metalness:.6}));mesh.position.copy(p.position).add(new THREE.Vector3(0,.5,0));this.scene.add(mesh);this.world.pickups.push({mesh,weapon:p.weapon,name:WEAPONS[p.weapon].name,taken:false});p.weapons[p.weapon]=false;this.systems.toast('Weapon dropped');}
 inventory(){const el=document.getElementById('inventory');el.classList.toggle('hidden');document.getElementById('items').innerHTML=WEAPONS.map((w,i)=>`<div>${i+1}. ${w.name}<br>Ammo: ${this.player.ammo[i]} · ${this.player.weapons[i]?'Owned':'Not owned'}</div>`).join('');}
 updateHUD(){
  const p=this.player;document.getElementById('health').textContent=Math.round(p.health);document.getElementById('stamina').textContent=Math.round(p.stamina);document.getElementById('money').textContent='$'+p.money.toLocaleString();document.getElementById('fuel').textContent=(p.inCar?Math.round(p.inCar.fuel):100)+'%';
  document.getElementById('healthbar').style.width=p.health+'%';document.getElementById('staminabar').style.width=p.stamina+'%';document.getElementById('wanted').textContent='★'.repeat(p.wanted)+'☆'.repeat(5-p.wanted);
 }
 updateCamera(){
  const p=this.player;if(p.inCar){this.camera.position.copy(p.position).add(new THREE.Vector3(0,5,-9).applyAxisAngle(new THREE.Vector3(0,1,0),p.inCar.group.rotation.y));this.camera.lookAt(p.position.x,p.position.y+1,p.position.z);return;}
  p.group.rotation.y=this.yaw;
  const target=p.position.clone().add(new THREE.Vector3(0,p.crouch?1.4:2.2,0));
  const offset=new THREE.Vector3(0,3.2,-7).applyEuler(new THREE.Euler(this.pitch,this.yaw,0,'YXZ'));
  this.camera.position.copy(target).add(offset);this.camera.lookAt(target);
 }
 drawMap(){
  const c=document.getElementById('mapcanvas'),ctx=c.getContext('2d');ctx.clearRect(0,0,420,420);ctx.fillStyle='#172b37';ctx.fillRect(0,0,420,420);
  ctx.strokeStyle='#687983';ctx.lineWidth=5;for(let i=0;i<=10;i++){let v=20+i*38;ctx.beginPath();ctx.moveTo(v,0);ctx.lineTo(v,420);ctx.stroke();ctx.beginPath();ctx.moveTo(0,v);ctx.lineTo(420,v);ctx.stroke();}
  const xy=(x,z)=>[210+x/520*420,210+z/520*420];ctx.fillStyle='#d8b56a';for(const b of this.world.buildings){let [x,y]=xy(b.x,b.z);ctx.fillRect(x-2,y-2,4,4);}
  ctx.fillStyle='#36aaff';for(const car of this.world.cars){let [x,y]=xy(car.group.position.x,car.group.position.z);ctx.fillRect(x-2,y-2,4,4);}
  let [x,y]=xy(this.player.position.x,this.player.position.z);ctx.fillStyle='#52ffad';ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();
 }
 animate(){
  requestAnimationFrame(()=>this.animate());const now=performance.now(),dt=Math.min((now-this.last)/1000,.04);this.last=now;
  this.player.update(dt,this.keys,this.mouse,this.world);this.world.update(dt,this.player);this.systems.update(dt);this.missions.update();this.updateCamera();this.updateHUD();if(!document.getElementById('map').classList.contains('hidden'))this.drawMap();
  this.renderer.render(this.scene,this.camera);
 }
}
new Game();
