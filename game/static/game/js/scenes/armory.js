/** Armory — medieval forge. */
import { medievalPanel, medievalTitle, medievalBtn } from '../ui/medieval.js';
const W=[['attack_weapon','⚔️ Attack Weapon'],['defense_weapon','🛡️ Defense Weapon'],['spy_tools','🗡️ Spy Tools'],['sentry_tools','🪖 Sentry Tools']];
export class ArmoryScene {
    constructor(engine,game){this.engine=engine;this.game=game;this.scene=new BABYLON.Scene(engine);this.scene.clearColor=new BABYLON.Color4(0.12,0.1,0.07,1);this._setupScene();}
    _setupScene(){const s=this.scene;this.camera=new BABYLON.ArcRotateCamera("aC",-Math.PI/2,Math.PI/3,15,new BABYLON.Vector3(0,1.5,0),s);this.camera.lowerRadiusLimit=6;this.camera.upperRadiusLimit=30;this.camera.attachControl(true);new BABYLON.HemisphericLight("aL",new BABYLON.Vector3(0,1,0),s).intensity=0.4;const f=BABYLON.MeshBuilder.CreateGround("aF",{width:15,height:15},s);const fm=new BABYLON.StandardMaterial("aM",s);fm.diffuseColor=new BABYLON.Color3(0.18,0.15,0.12);f.material=fm;}
    async activate(){if(!this._built){this._buildPanel();this._built=true;}}
    deactivate(){this._ui?.dispose();this._ui=null;this._built=false;}
    _buildPanel(){
        const {ui}=medievalPanel(this.scene);this._ui=ui;
        medievalTitle(ui,"🔧 Armory","#aaa");
        const p=this.game.player;
        const lv={attack_weapon:p.attack_weapon,defense_weapon:p.defense_weapon,spy_tools:p.spy_tools,sentry_tools:p.sentry_tools};
        let top=-24;
        for(const [t,name] of W){
            const l=lv[t]||0,cost=l>=20?'MAX':500*(l+1)*(l+1);
            medievalBtn(ui,t,`${name} Lv.${l}  💰${cost}`,l>=20?null:()=>this._buy(t),`${top}%`,"#1a1a2a");
            top+=13;
        }
        medievalBtn(ui,"back","🏰 Back",()=>this.game.switchScene('kingdom'),`${top+5}%`,"#2a1a0a");
    }
    async _buy(t){try{const r=await this.game.api.buyWeapon(t);this.game.player=r.player;this._built=false;this._buildPanel();}catch(e){alert(e.message);}}
    onPlayerUpdated(p){}
}
