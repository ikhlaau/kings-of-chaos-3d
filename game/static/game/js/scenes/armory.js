/** Armory — responsive. */
import { HUD } from '../ui/hud.js';
import { responsive, createPanel, createTitle, createBtn } from '../ui/responsive.js';

const WEAPONS = [
    { type: 'attack_weapon', name: '⚔️ Attack Weapon' },
    { type: 'defense_weapon', name: '🛡️ Defense Weapon' },
    { type: 'spy_tools', name: '🗡️ Spy Tools' },
    { type: 'sentry_tools', name: '🪖 Sentry Tools' },
];

export class ArmoryScene {
    constructor(engine, game) {
        this.engine=engine;this.game=game;
        this.scene=new BABYLON.Scene(engine);
        this.scene.clearColor=new BABYLON.Color4(0.15,0.12,0.1,1);
        this.hud=null;this._setupScene();
    }
    _setupScene(){
        const s=this.scene;
        this.camera=new BABYLON.ArcRotateCamera("aCam",-Math.PI/2,Math.PI/3,15,new BABYLON.Vector3(0,1.5,0),s);
        this.camera.lowerRadiusLimit=6;this.camera.upperRadiusLimit=30;
        this.camera.attachControl(s.getEngine().getRenderingCanvas(),true);
        new BABYLON.HemisphericLight("aL",new BABYLON.Vector3(0,1,0),s).intensity=0.5;
        const f=BABYLON.MeshBuilder.CreateGround("aF",{width:15,height:15},s);
        const fm=new BABYLON.StandardMaterial("aFM",s);fm.diffuseColor=new BABYLON.Color3(0.2,0.18,0.15);f.material=fm;
        for(let i=0;i<5;i++){const sw=BABYLON.MeshBuilder.CreateBox("sw",{width:0.05,height:1.2,depth:0.02},s);sw.position=new BABYLON.Vector3(-3+i*0.5,0.6,4);const sm=new BABYLON.StandardMaterial("sM",s);sm.diffuseColor=new BABYLON.Color3(0.7,0.7,0.75);sw.material=sm;}
    }
    async activate(){if(!this.hud){this.hud=new HUD(this.scene,this.game.player,this.game);this._buildPanel();}this.hud.update(this.game.player);}
    deactivate(){this._disposeUI();}
    _buildPanel(){
        this._disposeUI();
        const r=responsive();this._r=r;
        const ui=BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("aUI",true,this.scene);
        this.panelUI=ui;
        createPanel(ui,r);createTitle(ui,"🔧 Armory","#aaa",r);
        const p=this.game.player;
        const lv={attack_weapon:p.attack_weapon,defense_weapon:p.defense_weapon,spy_tools:p.spy_tools,sentry_tools:p.sentry_tools};
        let top=-24;
        for(const w of WEAPONS){
            const l=lv[w.type]||0, cost=l>=20?'MAX':(500*(l+1)*(l+1));
            const btn=createBtn(ui,w.type,`${w.name} Lv.${l} — 💰${cost}`,r,l>=20?null:()=>this._buy(w.type));
            if(l>=20)btn.background="#333";
            btn.top=`${top}%`;top+=r.gap+2;
        }
        const back=createBtn(ui,"back","🏰 Back",r,()=>this.game.switchScene('kingdom'));
        back.background="#4a3a2a";back.top=`${top+4}%`;
        window.addEventListener('resize',this._rH=()=>{if(this.panelUI)this._buildPanel();});
    }
    async _buy(type){try{const r=await this.game.api.buyWeapon(type);this.game.player=r.player;this.hud.update(r.player);this._buildPanel();}catch(e){alert(e.message);}}
    _disposeUI(){this.panelUI?.dispose();this.panelUI=null;if(this._rH)window.removeEventListener('resize',this._rH);}
    onPlayerUpdated(p){this.hud?.update(p);}
}
