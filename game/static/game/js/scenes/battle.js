/** Battle scene — medieval themed. */
import { createFormation } from '../entities/units.js';
import { medievalPanel, medievalTitle, medievalBtn, medievalInput, medievalText, GOLD } from '../ui/medieval.js';

export class BattleScene {
    constructor(engine, game) {
        this.engine=engine;this.game=game;
        this.scene=new BABYLON.Scene(engine);
        this.scene.clearColor=new BABYLON.Color4(0.08,0.05,0.02,1);
        this._setupScene();
    }
    _setupScene(){
        const s=this.scene;
        this.camera=new BABYLON.ArcRotateCamera("bC",-Math.PI/2,Math.PI/3,25,new BABYLON.Vector3(0,1,0),s);
        this.camera.lowerRadiusLimit=10;this.camera.upperRadiusLimit=50;
        this.camera.attachControl(true);
        new BABYLON.HemisphericLight("bL",new BABYLON.Vector3(0,1,0),s).intensity=0.4;
        new BABYLON.DirectionalLight("bD",new BABYLON.Vector3(-1,-1,0),s).intensity=0.6;
        const g=BABYLON.MeshBuilder.CreateGround("bG",{width:40,height:30},s);
        const gm=new BABYLON.StandardMaterial("bGM",s);gm.diffuseColor=new BABYLON.Color3(0.15,0.1,0.05);g.material=gm;
        s.fogMode=BABYLON.Scene.FOGMODE_LINEAR;s.fogColor=new BABYLON.Color3(0.08,0.05,0.02);s.fogStart=25;s.fogEnd=45;
    }
    async activate({targetPlayer}={}){
        if(!this._built){this._buildPanel();this._built=true;}
        if(targetPlayer)await this._runBattle(targetPlayer);
    }
    deactivate(){this._clearBattlefield();}
    _buildPanel(){
        const {ui,scroll}=medievalPanel(this.scene);
        this._ui=ui;this._scroll=scroll;
        medievalTitle(ui,"⚔️ Battle Arena");

        this._input=medievalInput(ui,"Search player name...","-8%");
        medievalBtn(ui,"search","🔍 Seek Foe",()=>this._searchTarget(),"2%","#3a1a0a");

        this._status=medievalText(ui,"","14%","#999");
        medievalBtn(ui,"back","🏰 Return to Kingdom",()=>this.game.switchScene('kingdom'),"28%","#2a0a0a");
    }
    async _searchTarget(){
        const q=this._input.text.trim();if(!q)return;
        try{
            const d=await this.game.api.getWorldPlayers();
            const m=d.players.find(p=>p.username.toLowerCase().includes(q.toLowerCase()));
            if(m){this._status.text=`Found: ${m.username} — To Battle!`;await this._runBattle(m);}
            else this._status.text="No foe found by that name.";
        }catch(e){this._status.text="Search failed.";}
    }
    async _runBattle(target){
        try{
            const d=await this.game.api.attack(target.id);
            if(d.error){alert(d.error);return}
            await this._animateBattle(d,target);
        }catch(e){alert(e.message);}
    }
    async _animateBattle(r,target){
        const s=this.scene;this._clearBattlefield();
        this.au=createFormation(Math.min(this.game.player.attack_soldiers,30),new BABYLON.Color3(0.9,0.15,0.1),new BABYLON.Vector3(-10,0,0),1,s);
        this.du=createFormation(Math.min((target.attack_soldiers||0)+(target.defense_soldiers||0),30),new BABYLON.Color3(0.1,0.3,0.9),new BABYLON.Vector3(10,0,0),1,s);
        await this._charge();await this._clash(r);this._showResult(r,target);
    }
    _charge(){return new Promise(res=>{let f=0;const o=this.scene.onBeforeRenderObservable.add(()=>{f++;const t=Math.min(f/80,1),e=t<0.5?2*t*t:-1+(4-2*t)*t;for(const u of this.au||[])u.position.x=-10+e*8;for(const u of this.du||[])u.position.x=10-e*8;if(t>=1){this.scene.onBeforeRenderObservable.remove(o);res();}});});}
    _clash(r){return new Promise(res=>{let f=0;const al=r.result.attacker_losses.attack_soldiers||0,dl=r.result.defender_losses.defense_soldiers||0;const au=Math.min(al,(this.au||[]).length),du=Math.min(dl,(this.du||[]).length);const o=this.scene.onBeforeRenderObservable.add(()=>{f++;const t=Math.min(f/60,1);if(t>0.3&&au>0)for(let i=0;i<au&&i<this.au.length;i++)this.au[i].scaling.y=Math.max(0,1-(t-0.3)/0.7);if(t>0.3&&du>0)for(let i=0;i<du&&i<this.du.length;i++)this.du[i].scaling.y=Math.max(0,1-(t-0.3)/0.7);if(t>=1){this.scene.onBeforeRenderObservable.remove(o);res();}});});}
    _showResult(r,target){
        this._ui?.dispose();
        const {ui}=medievalPanel(this.scene);this._ui=ui;
        const out=r.result.outcome==='ATK'?'⚔️ Victory!':'💀 Defeat';
        medievalTitle(ui,out,r.result.outcome==='ATK'?'#5a5':'#a44');
        medievalText(ui,`Gold: ${r.result.gold_stolen>0?'+':''}${r.result.gold_stolen}\nFoe: ${target.username}`,"5%","#ccb890");
        medievalBtn(ui,"ok","🏰 Return to Kingdom",()=>{this.game.refreshPlayer();this.game.switchScene('kingdom');this._ui?.dispose();this._built=false;},"25%","#2a2a4a");
    }
    _clearBattlefield(){for(const u of(this.au||[]))u.dispose();for(const u of(this.du||[]))u.dispose();this.au=[];this.du=[];}
    onPlayerUpdated(p){}
}
