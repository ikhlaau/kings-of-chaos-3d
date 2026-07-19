/** World Map — medieval. */
import { medievalPanel, medievalTitle, medievalBtn, medievalText } from '../ui/medieval.js';
export class WorldMapScene {
    constructor(engine,game){this.engine=engine;this.game=game;this.scene=new BABYLON.Scene(engine);this.scene.clearColor=new BABYLON.Color4(0.08,0.12,0.25,1);this.markers=[];this._setupScene();}
    _setupScene(){const s=this.scene;this.camera=new BABYLON.ArcRotateCamera("wC",-Math.PI/2,Math.PI/4,80,new BABYLON.Vector3(0,0,0),s);this.camera.lowerRadiusLimit=30;this.camera.upperRadiusLimit=200;this.camera.attachControl(true);new BABYLON.HemisphericLight("wL",new BABYLON.Vector3(0,1,0),s).intensity=0.7;const g=BABYLON.MeshBuilder.CreateGround("wG",{width:250,height:250},s);const gm=new BABYLON.StandardMaterial("wM",s);gm.diffuseColor=new BABYLON.Color3(0.12,0.28,0.1);g.material=gm;}
    async activate(){try{const d=await this.game.api.getWorldPlayers();this._show(d.players);}catch(e){}}
    deactivate(){for(const m of this.markers)m.dispose();this.markers=[];this._ui?.dispose();this._ui=null;}
    _show(players){
        const s=this.scene;
        this._marker(this.game.player.world_x,this.game.player.world_z,'🏰',new BABYLON.Color3(1,0.85,0.1),3);
        for(const p of players)this._marker(p.world_x,p.world_z,'',new BABYLON.Color3(0.5+Math.random()*0.4,0.1+Math.random()*0.3,0.1+Math.random()*0.3),1.5,p);
    }
    _marker(x,z,label,color,size,data=null){
        const s=this.scene;
        const p=BABYLON.MeshBuilder.CreateCylinder("m",{height:0.3,diameterTop:size,diameterBottom:size+0.3},s);
        p.position=new BABYLON.Vector3(x,0.15,z);const pm=new BABYLON.StandardMaterial("mM",s);pm.diffuseColor=color;p.material=pm;this.markers.push(p);
        if(data){p.isPickable=true;p.actionManager=new BABYLON.ActionManager(s);p.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger,()=>this._info(data)));}
    }
    _info(data){
        this._ui?.dispose();
        const {ui}=medievalPanel(this.scene);this._ui=ui;
        medievalTitle(ui,`👑 ${data.username}`);
        medievalText(ui,`Rank: #${data.battle_rank}\n⚔️ ${data.attack_soldiers} | 🛡️ ${data.defense_soldiers}`,"0%","#ccb890");
        const m=window.innerWidth<768;
        medievalBtn(ui,"atk","⚔️ Attack",()=>{this._ui?.dispose();this.game.switchScene('battle',{targetPlayer:data});},"12%","#3a1a1a");
        medievalBtn(ui,"spy","🕵️ Spy",()=>{this._ui?.dispose();this.game.switchScene('spyhq',{targetPlayer:data});},"22%","#1a1a3a");
    }
    onPlayerUpdated(p){}
}
