/** Spy HQ — medieval shadow chamber. */
import { medievalPanel, medievalTitle, medievalBtn, medievalInput, medievalText } from '../ui/medieval.js';
export class SpyHQScene {
    constructor(engine,game){this.engine=engine;this.game=game;this.scene=new BABYLON.Scene(engine);this.scene.clearColor=new BABYLON.Color4(0.04,0.03,0.08,1);this._setupScene();}
    _setupScene(){const s=this.scene;this.camera=new BABYLON.ArcRotateCamera("sC",-Math.PI/2,Math.PI/3,12,new BABYLON.Vector3(0,1,0),s);this.camera.lowerRadiusLimit=5;this.camera.upperRadiusLimit=25;this.camera.attachControl(true);new BABYLON.PointLight("candle",new BABYLON.Vector3(0,1,2),s).intensity=0.5;new BABYLON.HemisphericLight("sL",new BABYLON.Vector3(0,1,0),s).intensity=0.15;const f=BABYLON.MeshBuilder.CreateGround("sF",{width:12,height:12},s);const fm=new BABYLON.StandardMaterial("sM",s);fm.diffuseColor=new BABYLON.Color3(0.06,0.04,0.08);f.material=fm;}
    async activate({targetPlayer}={}){if(!this._built){this._buildPanel();this._built=true;}if(targetPlayer)await this._spy(targetPlayer);}
    deactivate(){this._ui?.dispose();this._rUI?.dispose();this._ui=null;this._rUI=null;this._built=false;}
    _buildPanel(){
        const {ui}=medievalPanel(this.scene);this._ui=ui;
        medievalTitle(ui,"🕵️ Shadow Chamber","#8a6aaa");
        this._input=medievalInput(ui,"Target name...","-8%");
        medievalBtn(ui,"spy","🕵️ Send Shadows",()=>this._search(),"2%","#2a1a3a");
        this._status=medievalText(ui,"","13%","#777");
        medievalBtn(ui,"back","🏰 Back",()=>this.game.switchScene('kingdom'),"26%","#1a1a2a");
    }
    async _search(){const q=this._input.text.trim();if(!q)return;try{const d=await this.game.api.getWorldPlayers();const m=d.players.find(p=>p.username.toLowerCase().includes(q.toLowerCase()));if(m){this._status.text=`Shadows sent to ${m.username}...`;await this._spy(m);}else this._status.text="No target found.";}catch(e){this._status.text="Failed.";}}
    async _spy(t){try{const r=await this.game.api.spy(t.id);this.game.player=r.player;this._showResult(r,t);}catch(e){this._status.text=e.message;}}
    _showResult(r,target){
        this._rUI?.dispose();const {ui}=medievalPanel(this.scene);this._rUI=ui;
        if(r.success&&r.data){medievalTitle(ui,"📜 Spy Report","#5a5");medievalText(ui,`👤 ${target.username}\n💰 ${r.data.gold} gold  🏆 #${r.data.battle_rank}\n⚔️${r.data.attack_soldiers} 🛡️${r.data.defense_soldiers}\n🕵️${r.data.spies} spies`,"5%","#ccb890");}
        else{medievalTitle(ui,"❌ Shadows Captured!","#a44");medievalText(ui,`Lost ${r.captured} spies to sentries!`,"5%","#faa");}
        medievalBtn(ui,"ok","Understood",()=>{this._rUI?.dispose();this._rUI=null;},"28%","#2a2a3a");
    }
    onPlayerUpdated(p){}
}
