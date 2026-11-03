import * as THREE from 'three';
import {CFG,WEAPONS} from './config.js';
export class Player{
  constructor(scene,camera){
    this.scene=scene;this.camera=camera;this.group=new THREE.Group();scene.add(this.group);
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.8,4,8),new THREE.MeshStandardMaterial({color:0x287caa,roughness:.7}));body.position.y=1;body.castShadow=true;this.group.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.28,16,12),new THREE.MeshStandardMaterial({color:0xc99572}));head.position.y=1.75;this.group.add(head);
    this.position=this.group.position;this.velocity=new THREE.Vector3();this.health=100;this.stamina=100;this.money=2500;this.weapon=0;this.weapons=[true,false,false,false];this.ammo=[12,0,0,0];this.reloading=false;this.crouch=false;this.inCar=null;this.interior=null;this.wanted=0;this.lastShot=0;this.lastPunch=0;this.onGround=true;
  }
  addWeapon(i){this.weapons[i]=true;this.ammo[i]=Math.max(this.ammo[i],WEAPONS[i].mag*2);}
  select(i){if(this.weapons[i])this.weapon=i;}
  update(dt,keys,mouse,world){
    if(this.inCar){this.drive(dt,keys);return;}
    const forward=new THREE.Vector3(Math.sin(this.group.rotation.y),0,Math.cos(this.group.rotation.y));
    const right=new THREE.Vector3(forward.z,0,-forward.x);
    let move=new THREE.Vector3();if(keys.KeyW)move.add(forward);if(keys.KeyS)move.sub(forward);if(keys.KeyD)move.add(right);if(keys.KeyA)move.sub(right);
    if(move.lengthSq()>0){move.normalize();let speed=keys.ShiftLeft&&this.stamina>0?CFG.runSpeed:CFG.playerSpeed;if(this.crouch)speed*=.45;this.position.addScaledVector(move,speed*dt);this.group.rotation.y=Math.atan2(move.x,move.z);}
    if(keys.ShiftLeft&&move.lengthSq()>0)this.stamina=Math.max(0,this.stamina-24*dt);else this.stamina=Math.min(100,this.stamina+16*dt);
    this.velocity.y-=CFG.gravity*dt;this.position.y+=this.velocity.y*dt;if(this.position.y<0){this.position.y=0;this.velocity.y=0;this.onGround=true;}
    this.position.x=THREE.MathUtils.clamp(this.position.x,-CFG.worldLimit,CFG.worldLimit);this.position.z=THREE.MathUtils.clamp(this.position.z,-CFG.worldLimit,CFG.worldLimit);
    if(this.interior){this.position.x=THREE.MathUtils.clamp(this.position.x,-8,8);this.position.z=THREE.MathUtils.clamp(this.position.z,-8,8);}
  }
  drive(dt,keys){
    const c=this.inCar;let accel=(keys.KeyW?1:0)-(keys.KeyS?1:0);c.speedValue=THREE.MathUtils.clamp((c.speedValue||0)+accel*CFG.carAcceleration*dt,-12,32);
    if(keys.Space)c.speedValue*=Math.pow(.05,dt);
    c.group.rotation.y+=((keys.KeyA?1:0)-(keys.KeyD?1:0))*1.7*dt*(Math.abs(c.speedValue)/18);
    c.group.translateZ(c.speedValue*dt);c.fuel=Math.max(0,c.fuel-Math.abs(c.speedValue)*dt*.018);
    this.position.copy(c.group.position);
  }
  jump(){if(this.onGround&&!this.inCar){this.velocity.y=8;this.onGround=false;}}
}
