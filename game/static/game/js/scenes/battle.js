/** Battle scene — 3D combat arena. Responsive. */
import { createFormation } from '../entities/units.js';
import { HUD } from '../ui/hud.js';
import { responsive, createPanel, createTitle, createBtn, createText } from '../ui/responsive.js';

export class BattleScene {
    constructor(engine, game) {
        this.engine = engine;
        this.game = game;
        this.scene = new BABYLON.Scene(engine);
        this.scene.clearColor = new BABYLON.Color4(0.12, 0.08, 0.04, 1);
        this.hud = null;
        this._setupScene();
    }

    _setupScene() {
        const scene = this.scene;
        this.camera = new BABYLON.ArcRotateCamera("bCam", -Math.PI/2, Math.PI/3, 25, new BABYLON.Vector3(0,1,0), scene);
        this.camera.lowerRadiusLimit = 10; this.camera.upperRadiusLimit = 50;
        this.camera.attachControl(scene.getEngine().getRenderingCanvas(), true);

        new BABYLON.HemisphericLight("bHemi", new BABYLON.Vector3(0,1,0), scene).intensity = 0.5;
        new BABYLON.DirectionalLight("bDir", new BABYLON.Vector3(-1,-1,0), scene).intensity = 0.6;

        const g = BABYLON.MeshBuilder.CreateGround("bG", {width:40,height:30}, scene);
        const gm = new BABYLON.StandardMaterial("bGM", scene);
        gm.diffuseColor = new BABYLON.Color3(0.2,0.15,0.08); g.material = gm;

        scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
        scene.fogColor = new BABYLON.Color3(0.12,0.08,0.04);
        scene.fogStart = 25; scene.fogEnd = 45;
    }

    async activate({ targetPlayer } = {}) {
        this.scene.setActive?.();
        if (!this.hud) { this.hud = new HUD(this.scene, this.game.player, this.game); this._buildPanel(); }
        this.hud.update(this.game.player);
        if (targetPlayer) await this._runBattle(targetPlayer);
    }

    deactivate() { this._clearBattlefield(); this._disposeUI(); }

    _buildPanel() {
        this._disposeUI();
        const r = responsive();
        this._r = r;
        const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("bUI", true, this.scene);
        this.battleUI = ui;

        createPanel(ui, r);
        createTitle(ui, "⚔️ Battle Arena", "#c9a050", r);

        this.targetInput = new BABYLON.GUI.InputText();
        this.targetInput.width = r.btnW; this.targetInput.height = r.btnH;
        this.targetInput.placeholderText = "Search player...";
        this.targetInput.color = "white"; this.targetInput.background = "#2a2a4a";
        this.targetInput.top = "-5%"; this.targetInput.fontSize = r.bodyFS;
        ui.addControl(this.targetInput);

        createBtn(ui, "search", "🔍 Search", r, () => this._searchTarget());
        this.targetResult = createText(ui, "", r);
        this.targetResult.top = "15%"; this.targetResult.color = "#aaa";

        const back = createBtn(ui, "back", "🏰 Back to Kingdom", r, () => this.game.switchScene('kingdom'));
        back.background = "#5a3a3a"; back.top = "30%";

        window.addEventListener('resize', this._resizeHandler = () => { if (this.battleUI) this._buildPanel(); });
    }

    async _searchTarget() {
        const q = this.targetInput.text.trim();
        if (!q) return;
        try {
            const data = await this.game.api.getWorldPlayers();
            const match = data.players.find(p => p.username.toLowerCase().includes(q.toLowerCase()));
            if (match) { this.targetResult.text = `Found: ${match.username} (#${match.battle_rank})`; await this._runBattle(match); }
            else this.targetResult.text = "Not found.";
        } catch(e) { this.targetResult.text = "Search failed."; }
    }

    async _runBattle(target) {
        try {
            const data = await this.game.api.attack(target.id);
            if (data.error) { alert(data.error); return; }
            await this._animateBattle(data, target);
        } catch(e) { alert(e.message); }
    }

    async _animateBattle(result, target) {
        const scene = this.scene; this._clearBattlefield();
        const atkC = new BABYLON.Color3(0.9,0.15,0.1);
        this.atkUnits = createFormation(Math.min(this.game.player.attack_soldiers,30), atkC, new BABYLON.Vector3(-10,0,0), 1, scene);
        const defC = new BABYLON.Color3(0.1,0.3,0.9);
        this.defUnits = createFormation(Math.min((target.attack_soldiers||0)+(target.defense_soldiers||0),30), defC, new BABYLON.Vector3(10,0,0), 1, scene);
        await this._animateCharge(); await this._animateClash(result);
        this._showResult(result, target);
    }

    _animateCharge() {
        return new Promise(resolve => {
            let f=0; const obs = this.scene.onBeforeRenderObservable.add(() => {
                f++; const t=Math.min(f/80,1), e=t<0.5?2*t*t:-1+(4-2*t)*t;
                for(const u of this.atkUnits||[]) u.position.x=-10+e*8;
                for(const u of this.defUnits||[]) u.position.x=10-e*8;
                if(t>=1){this.scene.onBeforeRenderObservable.remove(obs);resolve();}
            });
        });
    }

    _animateClash(result) {
        return new Promise(resolve => {
            let f=0; const al=result.result.attacker_losses.attack_soldiers||0, dl=result.result.defender_losses.defense_soldiers||0;
            const au=Math.min(al,(this.atkUnits||[]).length), du=Math.min(dl,(this.defUnits||[]).length);
            const obs = this.scene.onBeforeRenderObservable.add(() => {
                f++; const t=Math.min(f/60,1);
                if(t>0.3&&au>0) for(let i=0;i<au&&i<this.atkUnits.length;i++) this.atkUnits[i].scaling.y=Math.max(0,1-(t-0.3)/0.7);
                if(t>0.3&&du>0) for(let i=0;i<du&&i<this.defUnits.length;i++) this.defUnits[i].scaling.y=Math.max(0,1-(t-0.3)/0.7);
                if(t>=1){this.scene.onBeforeRenderObservable.remove(obs);resolve();}
            });
        });
    }

    _showResult(result, target) {
        const r = this._r || responsive();
        const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("rUI", true, this.scene);
        this.resultUI = ui;
        const out = result.result.outcome==='ATK'?'Victory!':'Defeat!';
        const col = result.result.outcome==='ATK'?'#4a4':'#a44';
        createPanel(ui, r); createTitle(ui, out, col, r);
        createText(ui, `Gold: ${result.result.gold_stolen>0?'+':''}${result.result.gold_stolen}\nvs ${target.username}`, r).top = "5%";
        const ok = createBtn(ui, "ok", "🏰 Return to Kingdom", r, () => { this.resultUI?.dispose(); this.resultUI=null; this.game.refreshPlayer(); this.game.switchScene('kingdom'); });
        ok.background = "#2a2a5a"; ok.top = "25%";
    }

    _clearBattlefield() { for(const u of(this.atkUnits||[]))u.dispose(); for(const u of(this.defUnits||[]))u.dispose(); this.atkUnits=[];this.defUnits=[]; }
    _disposeUI() { this.battleUI?.dispose(); this.battleUI=null; if(this._resizeHandler) window.removeEventListener('resize',this._resizeHandler); }
    onPlayerUpdated(p) { this.hud?.update(p); }
}
