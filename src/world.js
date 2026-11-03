import * as THREE from 'three';
import {CFG} from './config.js';

const mat=(color,roughness=.8,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
export class World {
  constructor(scene){
    this.scene=scene; this.buildings=[]; this.cars=[]; this.npcs=[]; this.pickups=[];
    this.makeGround(); this.makeRoads(); this.makeBuildings(); this.makeStreetProps(); this.makeCars(); this.makeNPCs(); this.makePickups();
  }
  addBox(x,y,z,sx,sy,sz,material,group=this.scene){
    const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;
  }
  makeGround(){
    this.addBox(0,-.55,0,CFG.cityHalf*2,1,CFG.cityHalf*2,mat(0x25343b));
    const grid=new THREE.GridHelper(CFG.cityHalf*2,52,0x3a5961,0x34464b);grid.position.y=.01;this.scene.add(grid);
  }
  makeRoads(){
    const asphalt=mat(0x20272d),line=mat(0xe7d98b),side=mat(0x69777b);
    for(let i=-5;i<=5;i++){
      const p=i*CFG.block;
      this.addBox(p,.015,0,CFG.road,.05,CFG.cityHalf*2,asphalt);
      this.addBox(0,.016,p,CFG.cityHalf*2,.05,CFG.road,asphalt);
      this.addBox(p+CFG.road/2+.8,.12,0,1.6,.24,CFG.cityHalf*2,side);
      this.addBox(0,.12,p+CFG.road/2+.8,CFG.cityHalf*2,.24,1.6,side);
      for(let t=-240;t<240;t+=14){
        this.addBox(p,.05,t, .22,.03,5,line);
        this.addBox(t,.05,p,5,.03,.22,line);
      }
    }
    // intersections and crosswalks
    const white=mat(0xd9e3e5);
    for(let x=-5;x<=5;x++)for(let z=-5;z<=5;z++){
      let px=x*CFG.block,pz=z*CFG.block;
      for(let k=-3;k<=3;k++){
        this.addBox(px+k*1.8,.07,pz-8,1,.025,3,white);
        this.addBox(px-8,.07,pz+k*1.8,3,.025,1,white);
      }
    }
  }
  makeBuildings(){
    const colors=[0x627987,0x8b7568,0x596c78,0x8b9294,0x5c6b62,0x786d89,0x9b8060];
    const types=['HOUSE','SHOP','OFFICE','APARTMENT','MALL','HOSPITAL','POLICE'];
    let index=0;
    for(let gx=-5;gx<5;gx++)for(let gz=-5;gz<5;gz++){
      const x=gx*CFG.block+CFG.block/2,z=gz*CFG.block+CFG.block/2;
      // two lots per city block
      for(let side=0;side<2;side++){
        if(index>=CFG.buildingCount)break;
        const bx=x+(side?13:-13),bz=z+(side?-10:10);
        const w=side?17:18,d=side?19:17,h=8+((index*17)%29);
        const type=index===0?'POLICE':index===1?'HOSPITAL':index===2?'MALL':types[index%types.length];
        const g=new THREE.Group();g.position.set(bx,0,bz);this.scene.add(g);
        const base=mat(colors[index%colors.length]),dark=mat(0x263945),glass= new THREE.MeshStandardMaterial({color:0x64cde0,metalness:.45,roughness:.2,emissive:0x102c38});
        this.addBox(0,h/2,0,w,h,d,base,g);
        this.addBox(0,h+.25,0,w+.8,.5,d+.8,dark,g);
        // windows on all visible sides
        for(let yy=2.3;yy<h-1;yy+=3.2){
          for(let xx=-w/2+2;xx<w/2-1;xx+=3.5){
            this.addBox(xx,yy,d/2+.035,1.5,1.25,.08,glass,g);
            this.addBox(xx,yy,-d/2-.035,1.5,1.25,.08,glass,g);
          }
          for(let zz=-d/2+2;zz<d/2-1;zz+=3.5){
            this.addBox(w/2+.035,yy,zz,.08,1.25,1.5,glass,g);
            this.addBox(-w/2-.035,yy,zz,.08,1.25,1.5,glass,g);
          }
        }
        const door=this.addBox(0,1.35,d/2+.06,2.2,2.7,.14,mat(0x25313a),g);
        const sign=this.addBox(0,h*.65,d/2+.12,Math.min(w-3,12),.8,.12,mat(type==='POLICE'?0x163b75:type==='HOSPITAL'?0x2d796c:0x253d55),g);
        this.buildings.push({group:g,x:bx,z:bz,w,d,h,type,owned:false,price:5000,door});
        index++;
      }
    }
  }
  makeStreetProps(){
    const pole=mat(0x303b43),lamp=new THREE.MeshStandardMaterial({color:0xffe9b0,emissive:0xffd27a,emissiveIntensity:1.2});
    for(let x=-5;x<=5;x++)for(let z=-5;z<=5;z++){
      const px=x*CFG.block,pz=z*CFG.block;
      this.addBox(px+12,3,pz+12,.25,6,.25,pole);
      this.addBox(px+12,6,pz+12,2,.2,.2,lamp);
      // traffic lights
      this.addBox(px+10,2.8,pz-10,.18,5,.18,pole);
      this.addBox(px+10,4.9,pz-10,.5,.9,.35,mat(0x151b20));
      this.addBox(px+10,5.15,pz-9.8,.18,.18,.05,mat(0xff3434));
      this.addBox(px+10,4.9,pz-9.8,.18,.18,.05,mat(0xffd343));
      this.addBox(px+10,4.65,pz-9.8,.18,.18,.05,mat(0x3dff85));
    }
  }
  makeCars(){
    const colors=[0xd72e4c,0x1c91d0,0xd9dfe4,0x252a32,0xe5a62d,0x4caa77,0x8e61c9];
    for(let i=0;i<CFG.carCount;i++){
      const g=new THREE.Group();this.scene.add(g);
      const body=new THREE.MeshStandardMaterial({color:colors[i%colors.length],metalness:.55,roughness:.28});
      this.addBox(0,.8,0,2.2,.75,4.3,body,g);
      this.addBox(0,1.42,-.15,1.75,.7,2.15,mat(0x263f4b,.2,.4),g);
      for(const x of [-1,1])for(const z of [-1.35,1.35]){
        const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.28,16),mat(0x111318));wheel.rotation.z=Math.PI/2;wheel.position.set(x*1.08,.42,z);g.add(wheel);
      }
      g.position.set(-230+i*39,.05,(i%2? -7:7));g.rotation.y=i%2?0:Math.PI;
      this.cars.push({group:g,speed:5+(i%4)*1.2,health:100,fuel:100,occupied:false,police:i===8,ambulance:i===9,route:i%2?1:-1});
    }
  }
  makeNPCs(){
    const skin=[0xc58b68,0x8b5b43,0xe0b28a],shirts=[0x2876a8,0x9c4261,0x397c5b,0x9a8240,0x555d9b];
    for(let i=0;i<CFG.npcCount;i++){
      const g=new THREE.Group();this.scene.add(g);
      const shirt=mat(shirts[i%shirts.length]),face=mat(skin[i%3]),pants=mat(0x263343);
      this.addBox(0,1.05,0,.65,.9,.35,shirt,g);
      const head=new THREE.Mesh(new THREE.SphereGeometry(.27,12,10),face);head.position.y=1.75;g.add(head);
      this.addBox(-.18,.42,0,.2,.75,.22,pants,g);this.addBox(.18,.42,0,.2,.75,.22,pants,g);
      g.position.set((Math.random()-.5)*440,0,(Math.random()-.5)*440);
      this.npcs.push({group:g,dir:new THREE.Vector3(Math.random()-.5,0,Math.random()-.5).normalize(),timer:Math.random()*4,alive:true});
    }
  }
  makePickups(){
    const names=['Pistol','AK-47','Shotgun','Sniper'];
    for(let i=0;i<24;i++){
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(.45,.18,.8),mat([0xadb9c1,0x515e66,0x80634a,0x2b3948][i%4],.4,.6));
      mesh.position.set((Math.random()-.5)*420,.5,(Math.random()-.5)*420);mesh.rotation.y=Math.random()*6.2;this.scene.add(mesh);
      this.pickups.push({mesh,weapon:i%4,name:names[i%4],taken:false});
    }
  }
  update(dt,player){
    for(const n of this.npcs){if(!n.alive)continue;n.timer-=dt;if(n.timer<=0){n.dir.set(Math.random()-.5,0,Math.random()-.5).normalize();n.timer=2+Math.random()*5;}n.group.position.addScaledVector(n.dir,dt*1.3);n.group.rotation.y=Math.atan2(n.dir.x,n.dir.z);}
    for(const c of this.cars){
      if(c.occupied)continue;
      if(c.police && player.wanted>0){
        const dx=player.position.x-c.group.position.x, dz=player.position.z-c.group.position.z;
        const target=Math.atan2(dx,dz);
        let delta=((target-c.group.rotation.y+Math.PI*3)%(Math.PI*2))-Math.PI;
        c.group.rotation.y+=THREE.MathUtils.clamp(delta,-dt*1.8,dt*1.8);
        c.group.translateZ(dt*(8+player.wanted*1.5));
        if(c.group.position.distanceTo(player.position)<3)player.health=Math.max(0,player.health-dt*4);
      }else{
        c.group.position.x+=c.speed*c.route*dt;
        if(c.group.position.x>250)c.group.position.x=-250;
        if(c.group.position.x< -250)c.group.position.x=250;
      }
    }
    for(const p of this.pickups){if(!p.taken){p.mesh.rotation.y+=dt;if(p.mesh.position.distanceTo(player.position)<2){p.taken=true;p.mesh.visible=false;player.addWeapon(p.weapon);}}}
  }
}
