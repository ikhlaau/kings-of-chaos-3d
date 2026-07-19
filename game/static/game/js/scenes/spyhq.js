/** SpyHQ — responsive. */
import { HUD } from '../ui/hud.js';
import { responsive, createPanel, createTitle, createBtn, createText } from '../ui/responsive.js';

export class SpyHQScene {
    constructor(engine, game) {
        this.engine=engine;this.game=game;
        this.scene=new BABYLON.Scene(engine);
        this.scene.clearColor=new BABYLON.Color4(0.06,0.04,0.1,1);
        this.hud=null;this._setupScene();
    }
    _setupScene(){
        const s=this.scene;
        this.camera=new BABYLON.ArcRotateCamera("sCam",-Math.PI/2,Math.PI/3,12,new BABYLON.Vector3(0,1,0),s);
        this.camera.lowerRadiusLimit=5;this.camera.upperRadiusLimit=25;
        this.camera.attachControl(s.getEngine().getRenderingCanvas(),true);
        new BABYLON.PointLight("candle",new BABYLON.Vector3(0,1,2),s).intensity=0.6;
        new BABYLON.HemisphericLight("sL",new BABYLON.Vector3(0,1,0),s).intensity=0.2;
        const f=BABYLON.MeshBuilder.CreateGround("sF",{width:12,height:12},s);
        const fm=new BABYLON.StandardMaterial("sFM",s);fm.diffuseColor=new BABYLON.Color3(0.08,0.06,0.1);f.material=fm;
    }
    async activate({targetPlayer}={}){
        if(!this.hud){this.hud=new HUD(this.scene,this.game.player,this.game);this._buildPanel();}
        this.hud.update(this.game.player);
        if(targetPlayer)await this._spy(targetPlayer);
    }
    deactivate(){this._disposeUI();}
    _buildPanel(){
        this._disposeUI();
        const r=responsive();this._r=r;
        const ui=BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("sUI",true,this.scene);
        this.panelUI=ui;
        createPanel(ui,r);createTitle(ui,"🕵️ Spy HQ","#8a6aaa",r);

        this.spyInput=new BABYLON.GUI.InputText();
        this.spyInput.width=r.btnW;this.spyInput.height=r.btnH;
        this.spyInput.placeholderText="Target player...";this.spyInput.color="white";
        this.spyInput.background="#2a2a4a";this.spyInput.top="-8%";this.spyInput.fontSize=r.bodyFS;
        ui.addControl(this.spyInput);

        const spyBtn=createBtn(ui,"spy","🕵️ Send Spies",r,()=>this._searchAndSpy());
        spyBtn.background="#4a2a6a";spyBtn.top="2%";

        this.spyStatus=createText(ui,"",r);this.spyStatus.top="13%";this.spyStatus.color="#aaa";

        const back=createBtn(ui,"back","🏰 Back",r,()=>this.game.switchScene('kingdom'));
        back.background="#4a3a2a";back.top="26%";
        window.addEventListener('resize',this._rH=()=>{if(this.panelUI)this._buildPanel();});
    }
    async _searchAndSpy(){
        const q=this.spyInput.text.trim();if(!q)return;
        try{
            const data=await this.game.api.getWorldPlayers();
            const m=data.players.find(p=>p.username.toLowerCase().includes(q.toLowerCase()));
            if(m){this.spyStatus.text=`Found: ${m.username} — sending...`;await this._spy(m);}
            else this.spyStatus.text="Not found.";
        }catch(e){this.spyStatus.text="Search failed.";}
    }
    async _spy(target){
        try{
            const res=await this.game.api.spy(target.id);this.game.player=res.player;this.hud.update(res.player);
            this._showResult(res,target);
        }catch(e){this.spyStatus.text=e.message;}
    }
    _showResult(result,target){
        this.resultUI?.dispose();
        const r=this._r||responsive();
        const ui=BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("sR",true,this.scene);
        this.resultUI=ui;
        createPanel(ui,r);
        if(result.success&&result.data){
            createTitle(ui,"🕵️ Spy Report","#4a4",r);
            createText(ui,`👤 ${target.username}\n💰 Gold: ${result.data.gold}\n⚔️ Atk: ${result.data.attack_soldiers} 🛡️ Def: ${result.data.defense_soldiers}\n🕵️ Spies: ${result.data.spies} 🏆 #${result.data.battle_rank}`,r).top="8%";
        }else{
            createTitle(ui,"❌ Captured!","#a44",r);
            createText(ui,`Lost ${result.captured} spies!`,r).top="5%";
        }
        createBtn(ui,"ok","OK",r,()=>{this.resultUI?.dispose();this.resultUI=null;}).top="28%";
    }
    _disposeUI(){this.panelUI?.dispose();this.panelUI=null;this.resultUI?.dispose();this.resultUI=null;if(this._rH)window.removeEventListener('resize',this._rH);}
    onPlayerUpdated(p){this.hud?.update(p);}
}
