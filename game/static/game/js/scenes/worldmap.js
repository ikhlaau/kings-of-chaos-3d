/** World Map — responsive. */
import { HUD } from '../ui/hud.js';
import { responsive, createPanel, createTitle, createBtn, createText } from '../ui/responsive.js';

export class WorldMapScene {
    constructor(engine, game) {
        this.engine=engine;this.game=game;
        this.scene=new BABYLON.Scene(engine);
        this.scene.clearColor=new BABYLON.Color4(0.1,0.15,0.3,1);
        this.hud=null;this.markers=[];
        this._setupScene();
    }
    _setupScene(){
        const s=this.scene;
        this.camera=new BABYLON.ArcRotateCamera("wCam",-Math.PI/2,Math.PI/4,80,new BABYLON.Vector3(0,0,0),s);
        this.camera.lowerRadiusLimit=30;this.camera.upperRadiusLimit=200;
        this.camera.attachControl(s.getEngine().getRenderingCanvas(),true);
        new BABYLON.HemisphericLight("wL",new BABYLON.Vector3(0,1,0),s).intensity=0.8;
        const g=BABYLON.MeshBuilder.CreateGround("wG",{width:250,height:250},s);
        const gm=new BABYLON.StandardMaterial("wGM",s);gm.diffuseColor=new BABYLON.Color3(0.15,0.35,0.12);g.material=gm;
    }
    async activate(){
        if(!this.hud){this.hud=new HUD(this.scene,this.game.player,this.game);}
        this.hud.update(this.game.player);
        try{const d=await this.game.api.getWorldPlayers();this._showKingdoms(d.players);}catch(e){}
    }
    deactivate(){for(const m of this.markers)m.dispose();this.markers=[];this._disposeUI();}
    _showKingdoms(players){
        const s=this.scene;
        this._createMarker(this.game.player.world_x,this.game.player.world_z,'🏰 You',new BABYLON.Color3(1,0.85,0.1),3);
        for(const p of players){
            const c=new BABYLON.Color3(0.6+Math.random()*0.4,0.1+Math.random()*0.3,0.1+Math.random()*0.3);
            this._createMarker(p.world_x,p.world_z,p.username,c,1.5,p);
        }
    }
    _createMarker(x,z,label,color,size,data=null){
        const s=this.scene;
        const p=BABYLON.MeshBuilder.CreateCylinder("pl",{height:0.3,diameterTop:size,diameterBottom:size+0.3},s);
        p.position=new BABYLON.Vector3(x,0.15,z);const pm=new BABYLON.StandardMaterial("pM",s);pm.diffuseColor=color;p.material=pm;this.markers.push(p);
        if(data){p.isPickable=true;p.actionManager=new BABYLON.ActionManager(s);p.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger,()=>this._showInfo(data)));}
    }
    _showInfo(data){
        this._disposeUI();
        const r=responsive();
        const ui=BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("wI",true,this.scene);
        this.infoUI=ui;
        createPanel(ui,r);createTitle(ui,`👑 ${data.username}`,"#c9a050",r);
        createText(ui,`Rank: #${data.battle_rank}\nAtk: ${data.attack_soldiers} | Def: ${data.defense_soldiers}`,r).top="-10%";

        const atk=createBtn(ui,"atk","⚔️ Attack",r,()=>{this._disposeUI();this.game.switchScene('battle',{targetPlayer:data});});
        atk.background="#5a2a2a";atk.top="10%";atk.left="-22%";
        const spy=createBtn(ui,"spy","🕵️ Spy",r,()=>{this._disposeUI();this.game.switchScene('spyhq',{targetPlayer:data});});
        spy.background="#2a2a5a";spy.top="10%";spy.left="22%";
        createBtn(ui,"cls","✕",r,()=>this._disposeUI()).top="-30%";
    }
    _disposeUI(){this.infoUI?.dispose();this.infoUI=null;}
    onPlayerUpdated(p){this.hud?.update(p);}
}
