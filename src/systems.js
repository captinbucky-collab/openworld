import * as THREE from 'three';
import {WEAPONS} from './config.js';
export class Systems{
  constructor(game){this.game=game;this.toastTimer=0;this.day=0;this.interiorGroup=null;this.lastInteract=0;this.nearbyFurniture=null;}
  toast(s){const el=document.getElementById('toast');el.textContent=s;el.style.opacity=1;clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>el.style.opacity=0,2200);}
  nearest(list,pos,max=5){let best=null,d=max;for(const o of list){const p=o.group?.position||o.mesh?.position;if(!p)continue;const n=p.distanceTo(pos);if(n<d){d=n;best=o;}}return best;}
  nearestBuilding(){let best=null,d=9;for(const b of this.game.world.buildings){const p=new THREE.Vector3(b.x,0,b.z);const n=p.distanceTo(this.game.player.position);if(n<d){d=n;best=b;}}return best;}
  enterBuilding(b){
    this.interiorGroup=new THREE.Group();this.game.scene.add(this.interiorGroup);
    const mat=(color)=>new THREE.MeshStandardMaterial({color,roughness:.8});
    const add=(x,y,z,sx,sy,sz,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;this.interiorGroup.add(o);return o;};
    add(0,-.2,0,18,.3,18,mat(0x777c78));
    const wall=mat(0x59656b);
    for(const [x,z,sx,sz] of [[0,-9,18,.3],[0,9,18,.3],[-9,0,.3,18],[9,0,.3,18]])add(x,2.3,z,sx,5,sz,wall);
    // room dividers, furniture, bed, wardrobe, weapon locker and staircase.
    add(-3,1.5,0,.18,3,9,wall);add(3,1.5,0,.18,3,9,wall);
    const wood=mat(0x704a31),cloth=mat(0x385a75),metal=mat(0x303c45);
    add(-5,.45,-5,3,.9,2,wood);add(-5,1,-5,2.8,.18,1.8,cloth); // bed
    add(5,1,-5,1.8,2,1.2,wood); // wardrobe
    add(5,.9,0,1.5,1.8,1.1,metal); // locker
    add(-5,.5,4,2.5,1,1.2,wood); // table
    for(let i=0;i<5;i++)add(6,.35+i*.35,5-i*.75,2,.25,1.5,wood);
    this.furniture=[
      {name:'BED',x:-5,z:-5,action:()=>{this.game.save();this.toast('Game saved at your bed');}},
      {name:'WARDROBE',x:5,z:-5,action:()=>{this.game.player.outfit=(this.game.player.outfit+1)%4;const colors=[0x287caa,0x8d3e6b,0x397c5b,0x9b7839];this.game.player.group.children[0].material.color.setHex(colors[this.game.player.outfit]);this.toast('Outfit changed');}},
      {name:'WEAPON LOCKER',x:5,z:0,action:()=>{this.game.player.weapons=[true,true,true,true];this.game.player.ammo=[60,120,32,20];this.toast('Locker supplied: all weapon types unlocked');}}
    ];
    this.game.player.interior=b;this.game.player.position.set(0,0,0);this.game.camera.position.set(0,5,10);this.toast(`${b.type} interior · approach furniture and press E`);
  }
  exitBuilding(){if(this.interiorGroup)this.game.scene.remove(this.interiorGroup);this.interiorGroup=null;this.furniture=null;const b=this.game.player.interior;this.game.player.interior=null;this.game.player.position.set(b.x,0,b.z+12);this.toast('Returned to the city');}
  interact(){
    const p=this.game.player;
    if(p.interior){
      let near=null,dist=3.2;for(const f of this.furniture||[]){const d=Math.hypot(p.position.x-f.x,p.position.z-f.z);if(d<dist){dist=d;near=f;}}
      if(near){near.action();return;}this.exitBuilding();return;
    }
    const b=this.nearestBuilding();if(b){this.enterBuilding(b);return;}
    const pickup=this.nearest(this.game.world.pickups,p.position,2.5);if(pickup&&!pickup.taken){pickup.taken=true;pickup.mesh.visible=false;p.addWeapon(pickup.weapon);this.toast(`${pickup.name} collected`);return;}
    this.toast('Nothing to interact with nearby');
  }
  buy(){const b=this.nearestBuilding();if(!b){this.toast('Move closer to a property');return;}if(b.owned){this.toast('This property is already yours');return;}if(this.game.player.money<b.price){this.toast('Not enough cash — need $5,000');return;}this.game.player.money-=b.price;b.owned=true;this.game.save();this.toast(`${b.type} purchased · property is now a save point`);}
  enterCar(){const p=this.game.player;if(p.inCar){p.inCar.occupied=false;p.inCar=null;p.position.x+=3;this.toast('Exited vehicle');return;}let best=this.nearest(this.game.world.cars,p.position,5);if(best){best.occupied=true;p.inCar=best;p.position.copy(best.group.position);this.toast('Vehicle entered · WASD drive · F exit');}else this.toast('No vehicle nearby');}
  shoot(){
    const p=this.game.player,w=WEAPONS[p.weapon],now=performance.now();if(now-p.lastShot<w.rate)return;p.lastShot=now;
    if(!p.weapons[p.weapon]){this.toast('Weapon not owned');return;}if(p.ammo[p.weapon]<=0){this.toast('Out of ammo · press R');return;}p.ammo[p.weapon]--;
    const dir=new THREE.Vector3();this.game.camera.getWorldDirection(dir);const ray=new THREE.Raycaster(this.game.camera.position,dir,0,90);
    const targets=this.game.world.npcs.filter(n=>n.alive).map(n=>n.group);const hits=ray.intersectObjects(targets,true);
    if(hits.length){const npc=this.game.world.npcs.find(n=>n.group===hits[0].object.parent||n.group===hits[0].object.parent?.parent);if(npc){npc.alive=false;npc.group.visible=false;p.wanted=Math.min(5,p.wanted+1);this.toast('Crime reported · wanted level increased');}}
  }
  reload(){const p=this.game.player,w=WEAPONS[p.weapon];if(!p.weapons[p.weapon]){this.toast('No weapon selected');return;}p.ammo[p.weapon]=w.mag;this.toast('Reloaded');}
  punch(){const p=this.game.player;if(performance.now()-p.lastPunch<600)return;p.lastPunch=performance.now();const n=this.nearest(this.game.world.npcs,p.position,2.3);if(n){n.alive=false;n.group.visible=false;p.wanted=Math.min(5,p.wanted+1);this.toast('NPC attacked · police alerted');}}
  job(){this.game.missions.doDelivery();}
  update(dt){
    this.day+=dt*.006;this.game.sun.position.set(Math.cos(this.day)*100,Math.sin(this.day)*100,40);
    this.game.sun.intensity=.4+Math.max(0,Math.sin(this.day))*2;
    this.game.scene.background=new THREE.Color().setHSL(.59,.45,.08+Math.max(0,Math.sin(this.day))*.12);
    const p=this.game.player;const b=p.interior?null:this.nearestBuilding();let prompt='';
    if(p.interior){let near=null,dist=3.2;for(const f of this.furniture||[]){const d=Math.hypot(p.position.x-f.x,p.position.z-f.z);if(d<dist){dist=d;near=f;}}prompt=near?`E — Use ${near.name}`:'E — Exit building';}
    else if(b)prompt=`E — Enter ${b.type}  |  ${b.owned?'OWNED':'B — Buy for $5,000'}`;
    else if(this.nearest(this.game.world.cars,p.position,5))prompt='F — Enter vehicle';
    else prompt='M Map · Tab Inventory · E Interact · J Delivery mission';
    const el=document.getElementById('prompt');el.textContent=prompt;el.style.display='block';
  }
}
