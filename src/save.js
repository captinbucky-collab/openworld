// Local browser save system. Saves player progress, owned properties and vehicle state.
const KEY = 'neon-city-final-save-v1';
export function saveGame(game){
  const p=game.player;
  const data={
    version:1, money:p.money, health:p.health, stamina:p.stamina,
    weapons:p.weapons, ammo:p.ammo, weapon:p.weapon, wanted:p.wanted,
    position:{x:p.position.x,y:p.position.y,z:p.position.z},
    owned:game.world.buildings.map((b,i)=>b.owned?i:null).filter(v=>v!==null),
    mission:game.missions?.current ?? 0, completed:game.missions?.completed ?? []
  };
  try{localStorage.setItem(KEY,JSON.stringify(data));return true;}catch(e){return false;}
}
export function loadGame(game){
  try{
    const raw=localStorage.getItem(KEY);if(!raw)return false;
    const d=JSON.parse(raw);if(d.version!==1)return false;
    const p=game.player;p.money=d.money??p.money;p.health=d.health??100;p.stamina=d.stamina??100;
    p.weapons=d.weapons??p.weapons;p.ammo=d.ammo??p.ammo;p.weapon=d.weapon??0;p.wanted=d.wanted??0;
    if(d.position)p.position.set(d.position.x,d.position.y,d.position.z);
    for(const i of d.owned??[])if(game.world.buildings[i])game.world.buildings[i].owned=true;
    if(game.missions){game.missions.current=d.mission??0;game.missions.completed=d.completed??[];}
    return true;
  }catch(e){return false;}
}
export function clearSave(){localStorage.removeItem(KEY);}
