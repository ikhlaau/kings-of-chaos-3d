/** Training Grounds — responsive. */
import { createSoldier } from '../entities/units.js';
import { HUD } from '../ui/hud.js';
import { responsive, createPanel, createTitle, createBtn } from '../ui/responsive.js';

const COSTS = [
    { type: 'attack_soldiers', label: '⚔️ Attack', batch: 10, gold: 100 },
    { type: 'defense_soldiers', label: '🛡️ Defense', batch: 10, gold: 100 },
    { type: 'spies', label: '🕵️ Spies', batch: 5, gold: 200 },
    { type: 'sentries', label: '👁️ Sentries', batch: 5, gold: 200 },
];

export class TrainingScene {
    constructor(engine, game) {
        this.engine = engine; this.game = game;
        this.scene = new BABYLON.Scene(engine);
        this.scene.clearColor = new BABYLON.Color4(0.1,0.2,0.1,1);
        this.hud = null;
        this._setupScene();
    }
    _setupScene() {
        const s = this.scene;
        this.camera = new BABYLON.ArcRotateCamera("tCam",-Math.PI/2,Math.PI/4,20,new BABYLON.Vector3(0,1,0),s);
        this.camera.lowerRadiusLimit=8;this.camera.upperRadiusLimit=40;
        this.camera.attachControl(s.getEngine().getRenderingCanvas(),true);
        new BABYLON.HemisphericLight("tL",new BABYLON.Vector3(0,1,0),s).intensity=0.7;
        const g=BABYLON.MeshBuilder.CreateGround("tG",{width:20,height:20},s);
        const gm=new BABYLON.StandardMaterial("tGM",s);gm.diffuseColor=new BABYLON.Color3(0.25,0.18,0.1);g.material=gm;
        for(let i=0;i<4;i++){const d=BABYLON.MeshBuilder.CreateCylinder("d",{height:2,diameter:0.2},s);d.position=new BABYLON.Vector3(-3+i*2,1,2);const dm=new BABYLON.StandardMaterial("dM",s);dm.diffuseColor=new BABYLON.Color3(0.5,0.4,0.3);d.material=dm;}
    }
    async activate() {
        if(!this.hud){this.hud=new HUD(this.scene,this.game.player,this.game);this._buildPanel();}
        this.hud.update(this.game.player);
    }
    deactivate(){this._disposeUI();}
    _buildPanel(){
        this._disposeUI();
        const r=responsive();this._r=r;
        const ui=BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("tUI",true,this.scene);
        this.panelUI=ui;
        createPanel(ui,r);createTitle(ui,"🎯 Training","#5a8a5a",r);
        let top=-22;
        for(const c of COSTS){
            const btn=createBtn(ui,c.type,`${c.label} (+${c.batch}) — 💰${c.gold}`,r,()=>this._train(c.type));
            btn.top=`${top}%`;top+=r.gap+2;
        }
        const back=createBtn(ui,"back","🏰 Back",r,()=>this.game.switchScene('kingdom'));
        back.background="#4a3a2a";back.top=`${top+4}%`;
        window.addEventListener('resize',this._rH=()=>{if(this.panelUI)this._buildPanel();});
    }
    async _train(type){
        try{
            const res=await this.game.api.train(type);this.game.player=res.player;this.hud.update(res.player);
            const cm={attack_soldiers:new BABYLON.Color3(0.9,0.15,0.1),defense_soldiers:new BABYLON.Color3(0.1,0.3,0.9),spies:new BABYLON.Color3(0.2,0.1,0.3),sentries:new BABYLON.Color3(0.3,0.3,0.5)};
            for(let i=0;i<Math.min(res.trained[type],10);i++){
                const u=createSoldier(cm[type],new BABYLON.Vector3(-2+Math.random()*4,0,5+Math.random()*3),this.scene);
                u.scaling=new BABYLON.Vector3(0,0,0);let f=0;
                const o=this.scene.onBeforeRenderObservable.add(()=>{f++;const t=Math.min(f/40,1);u.scaling=new BABYLON.Vector3(t,t,t);u.position.y=t*1.2;if(t>=1)this.scene.onBeforeRenderObservable.remove(o);});
            }
        }catch(e){alert(e.message);}
    }
    _disposeUI(){this.panelUI?.dispose();this.panelUI=null;if(this._rH)window.removeEventListener('resize',this._rH);}
    onPlayerUpdated(p){this.hud?.update(p);}
}
