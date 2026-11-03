export class Missions{
  constructor(game){this.game=game;this.current=0;this.completed=[];this.jobs=[
    {title:'FIRST DELIVERY',desc:'Complete a delivery to earn $750.',reward:750,kind:'delivery'},
    {title:'PROPERTY OWNER',desc:'Purchase any property in the city.',reward:1200,kind:'property'},
    {title:'CITY EXPLORER',desc:'Visit five different city blocks.',reward:900,kind:'explore'}
  ];this.blocks=new Set();}
  get active(){return this.jobs[this.current]||null;}
  update(){
    const p=this.game.player;
    if(this.current===0 && this.completed.includes('delivery'))this.finish(0);
    if(this.current===1 && this.game.world.buildings.some(b=>b.owned))this.finish(1);
    const bx=Math.floor((p.position.x+260)/52),bz=Math.floor((p.position.z+260)/52);
    this.blocks.add(`${bx}:${bz}`);
    if(this.current===2 && this.blocks.size>=5)this.finish(2);
    const m=this.active;
    document.getElementById('mission').textContent=m?`MISSION: ${m.title} — ${m.desc}`:'MISSION: ALL STORY TASKS COMPLETE';
  }
  finish(i){
    if(this.completed.includes(this.jobs[i].kind))return;
    this.completed.push(this.jobs[i].kind);this.game.player.money+=this.jobs[i].reward;
    this.current=Math.min(i+1,this.jobs.length);this.game.systems.toast(`${this.jobs[i].title} COMPLETE · +$${this.jobs[i].reward}`);
    this.game.save();
  }
  doDelivery(){if(this.current!==0){this.game.systems.toast('No delivery mission active');return;}this.finish(0);}
}
