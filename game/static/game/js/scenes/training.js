/** Training Grounds — medieval. */
import { createSoldier } from '../entities/units.js';
import { medievalPanel, medievalTitle, medievalBtn, GOLD } from '../ui/medieval.js';

const COSTS=[['attack_soldiers','⚔️ Attack Soldiers',10,100],['defense_soldiers','🛡️ Defense Soldiers',10,100],['spies','🕵️ Spies',5,200],['sentries','👁️ Sentries',5,200]];

export class TrainingScene {
    constructor(engine,game){this.engine=engine;this.game=game;this.scene=new BABYLON.Scene(engine);this.scene.clearColor=new BABYLON.Color4(0.08,0.18,0.08,1);this._setupScene();}
    _setupScene(){const s=this.scene;this.camera=new BABYLON.ArcRotateCamera("tC",-Math.PI/2,Math.PI/4,20,new BABYLON.Vector3(0,1,0),s);this.camera.lowerRadiusLimit=8;this.camera.upperRadiusLimit=40;this.camera.attachControl(true);new BABYLON.HemisphericLight("tL",new BABYLON.Vector3(0,1,0),s).intensity=0.5;const g=BABYLON.MeshBuilder.CreateGround("tG",{width:20,height:20},s);const gm=new BABYLON.StandardMaterial("tM",s);gm.diffuseColor=new BABYLON.Color3(0.2,0.14,0.08);g.material=gm;for(let i=0;i<4;i++){const d=BABYLON.MeshBuilder.CreateCylinder("d",{height:2,diameter:0.2},s);d.position=new BABYLON.Vector3(-3+i*2,1,2);d.material=gm;}}
    async activate(){if(!this._built){this._buildPanel();this._built=true;}}
    deactivate(){this._ui?.dispose();this._ui=null;this._built=false;}
    _buildPanel(){
        const {ui}=medievalPanel(this.scene);this._ui=ui;
        medievalTitle(ui,"🎯 Training Grounds","#5a8a5a");
        let top=-22;
        for(const [type,label,batch,gold] of COSTS){
            medievalBtn(ui,type,`${label} (+${batch})  💰${gold}`,()=>this._train(type),`${top}%`,"#1a2a0a");
            top+=13;
        }
        medievalBtn(ui,"back","🏰 Back",()=>this.game.switchScene('kingdom'),`${top+5}%`,"#2a1a0a");
    }
    async _train(type){
        try{const r=await this.game.api.train(type);this.game.player=r.player;
        const cm={attack_soldiers:new BABYLON.Color3(0.9,0.15,0.1),defense_soldiers:new BABYLON.Color3(0.1,0.3,0.9),spies:new BABYLON.Color3(0.2,0.1,0.3),sentries:new BABYLON.Color3(0.3,0.3,0.5)};
        for(let i=0;i<Math.min(r.trained[type],10);i++){const u=createSoldier(cm[type],new BABYLON.Vector3(-2+Math.random()*4,0,5+Math.random()*3),this.scene);u.scaling=new BABYLON.Vector3(0,0,0);let f=0;const o=this.scene.onBeforeRenderObservable.add(()=>{f++;const t=Math.min(f/40,1);u.scaling=new BABYLON.Vector3(t,t,t);u.position.y=t*1.2;if(t>=1)this.scene.onBeforeRenderObservable.remove(o);});}
        }catch(e){alert(e.message);}
    }
    onPlayerUpdated(p){}
}
