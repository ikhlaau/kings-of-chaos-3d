/** Kingdom scene — epic medieval 3D with working touch. */
import { medievalPanel, medievalTitle, medievalBtn, medievalText, isMobile, GOLD } from '../ui/medieval.js';
import { createSky } from '../entities/environment.js';
import { createCastle, createBarracks, createTrainingGround, createArmory, createSpyHQ } from '../entities/buildings.js';
import { createSoldier, createCitizen } from '../entities/units.js';

export class KingdomScene {
    constructor(engine, game) {
        this.engine = engine; this.game = game;
        this.scene = new BABYLON.Scene(engine);
        this.hud = null; this.buildings = []; this.units = [];
        this._setupScene();
    }

    _setupScene() {
        const s = this.scene;
        s.clearColor = new BABYLON.Color4(0.45, 0.55, 0.75, 1);

        this.camera = new BABYLON.ArcRotateCamera("kCam", -Math.PI/3, Math.PI/3.5, 35, new BABYLON.Vector3(0,2,0), s);
        this.camera.lowerRadiusLimit=12; this.camera.upperRadiusLimit=70;
        this.camera.lowerBetaLimit=0.3; this.camera.upperBetaLimit=Math.PI/2-0.1;
        this.camera.attachControl(true);

        // ── Proper touch + mouse picking via scene observable ──
        s.onPointerObservable.add((evtData) => {
            if (evtData.type === BABYLON.PointerEventTypes.POINTERPICK) {
                const mesh = evtData.pickInfo?.pickedMesh;
                if (mesh && mesh._clickAction) {
                    mesh._clickAction();
                }
            }
        });

        new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0,1,0), s).intensity = 0.5;
        const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-0.6,-0.7,0.4), s);
        sun.intensity = 0.8;

        const ground = BABYLON.MeshBuilder.CreateGround("g", {width:60,height:60,subdivisions:20}, s);
        const gm = new BABYLON.StandardMaterial("gM", s);
        gm.diffuseColor = new BABYLON.Color3(0.22,0.48,0.15); ground.material = gm;

        const path = BABYLON.MeshBuilder.CreateGround("path", {width:2,height:15}, s);
        path.position.y = 0.02;
        const pm = new BABYLON.StandardMaterial("pM", s); pm.diffuseColor = new BABYLON.Color3(0.35,0.25,0.15); path.material = pm;

        this._plantTrees(s);
        s.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
        s.fogColor = new BABYLON.Color3(0.45,0.55,0.75);
        s.fogStart = 40; s.fogEnd = 80;
    }

    _plantTrees(scene) {
        for (let i=0; i<35; i++) {
            const a=Math.random()*Math.PI*2, d=18+Math.random()*12;
            const x=Math.cos(a)*d, z=Math.sin(a)*d;
            if (Math.abs(x)<10&&Math.abs(z)<10) continue;
            const t=new BABYLON.TransformNode("tree",scene); t.position=new BABYLON.Vector3(x,0,z);
            const th=1.5+Math.random()*1.5;
            const tr=BABYLON.MeshBuilder.CreateCylinder("tr",{height:th,diameter:0.25},scene);
            tr.position.y=th/2;tr.parent=t;const tm=new BABYLON.StandardMaterial("tM",scene);tm.diffuseColor=new BABYLON.Color3(0.25,0.15,0.08);tr.material=tm;
            for(let j=0;j<2+Math.floor(Math.random()*2);j++){
                const lf=BABYLON.MeshBuilder.CreateSphere("lf",{diameter:1.3-j*0.3},scene);
                lf.position.y=th+j*0.5;lf.parent=t;const fm=new BABYLON.StandardMaterial("fM",scene);
                fm.diffuseColor=new BABYLON.Color3(0.08+Math.random()*0.15,0.25+Math.random()*0.4,0.04+Math.random()*0.08);lf.material=fm;
            }
        }
    }

    _makePickable(mesh, onClick) {
        mesh.isPickable = true;
        mesh._clickAction = onClick;
        // Hover glow
        const origAction = mesh._clickAction;
        const om = mesh.material;
        mesh.actionManager = new BABYLON.ActionManager(this.scene);
        mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOverTrigger,
            () => { mesh.renderOutline = true; mesh.outlineColor = BABYLON.Color3.Yellow(); mesh.outlineWidth = 0.04; }
        ));
        mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOutTrigger,
            () => { mesh.renderOutline = false; }
        ));
    }

    async activate() {
        if (!this._hudUI) {
            this._buildKingdom(this.game.player);
            this._buildHUD();
        }
    }

    _buildHUD() {
        const s = this.scene;
        const m = isMobile();
        const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("hudUI", true, s);

        // Top bar — gold-framed resource display
        const topBar = new BABYLON.GUI.Rectangle();
        topBar.width = m ? "95%" : "60%";
        topBar.height = m ? "36px" : "44px";
        topBar.background = "#1a1208cc";
        topBar.thickness = 1; topBar.color = GOLD;
        topBar.top = m ? "-47%" : "-46%";
        topBar.cornerRadius = 6;
        ui.addControl(topBar);

        const fs = m ? 11 : 16;
        this.goldText = this._stat(ui, "💰 0", GOLD, m ? "-38%" : "-26%", fs);
        this.turnsText = this._stat(ui, "⚡ 0", "#8af", m ? "-18%" : "-14%", fs);
        this.rankText = this._stat(ui, "🏆 #0", "#fff", m ? "2%" : "0%", fs);
        this.armyText = this._stat(ui, "⚔️0 🛡️0", "#ddd", m ? "22%" : "14%", fs-2);

        // Bottom action bar
        const botBar = new BABYLON.GUI.Rectangle();
        botBar.width = m ? "98%" : "80%";
        botBar.height = m ? "42px" : "50px";
        botBar.background = "#1a1208cc";
        botBar.thickness = 1; botBar.color = GOLD;
        botBar.top = m ? "45%" : "43%";
        botBar.cornerRadius = 6;
        ui.addControl(botBar);

        const bw = m ? "44px" : "90px", bh = m ? "30px" : "38px", bfs = m ? 9 : 13;
        const btns = [
            ["🗺️", "World", () => this.game.switchScene('worldmap')],
            ["⚔️", "Battle", () => this.game.switchScene('battle')],
            ["🎯", "Train", () => this.game.switchScene('training')],
            ["🔧", "Armory", () => this.game.switchScene('armory')],
            ["🕵️", "Spy", () => this.game.switchScene('spyhq')],
        ];
        let l = m ? -42 : -36;
        for (const [icon, label, action] of btns) {
            const btn = BABYLON.GUI.Button.CreateSimpleButton(label, m ? icon : `${icon} ${label}`);
            btn.width = `${bw}`; btn.height = `${bh}`;
            btn.color = GOLD; btn.background = "#2a1a08"; btn.cornerRadius = 6;
            btn.fontSize = bfs; btn.fontFamily = "Georgia, serif";
            btn.left = `${l}%`; btn.thickness = 1;
            btn.onPointerUpObservable.add(action);
            ui.addControl(btn);
            l += m ? 16 : 20;
        }

        // Logout button
        const logout = BABYLON.GUI.Button.CreateSimpleButton("out", "🚪");
        logout.width = "36px"; logout.height = "30px";
        logout.color = "#a44"; logout.background = "#2a1a08";
        logout.cornerRadius = 6; logout.fontSize = 11;
        logout.left = "44%"; logout.thickness = 1;
        logout.onPointerUpObservable.add(() => window.location.href='/logout/');
        ui.addControl(logout);

        this._hudUI = ui;
        this._hudTexts = { gold: this.goldText, turns: this.turnsText, rank: this.rankText, army: this.armyText };
    }

    _stat(ui, text, color, left, fontSize) {
        const t = new BABYLON.GUI.TextBlock();
        t.text = text; t.color = color; t.fontSize = fontSize;
        t.left = left; t.fontFamily = "Georgia, serif";
        ui.addControl(t);
        return t;
    }

    _buildKingdom(player) {
        const s = this.scene;
        const go = (name) => this.game.switchScene(name);

        // Create buildings with pickable main body
        const castle = createCastle({x:0,z:0}, player, s);
        const barracks = createBarracks({x:-8,z:3}, player.attack_soldiers+player.defense_soldiers, s);
        const training = createTrainingGround({x:10,z:3}, s);
        const armory = createArmory({x:14,z:5}, s);
        const spyhq = createSpyHQ({x:-12,z:9}, s);

        // Make main body pickable + hover
        this._makePickable(castle.getChildMeshes()[0], () => {});
        this._makePickable(barracks.getChildMeshes()[0], () => go('battle'));
        this._makePickable(training.getChildMeshes()[0], () => go('training'));
        this._makePickable(armory.getChildMeshes()[0], () => go('armory'));
        this._makePickable(spyhq.getChildMeshes()[0], () => go('spyhq'));

        this.buildings = [castle, barracks, training, armory, spyhq];

        // Building labels
        const labels = [
            {text:"🏰 Castle", pos:new BABYLON.Vector3(0,5.5,0)},
            {text:"⚔️ Barracks", pos:new BABYLON.Vector3(-8,5.5,3)},
            {text:"🎯 Training", pos:new BABYLON.Vector3(10,2.5,3)},
            {text:"🔧 Armory", pos:new BABYLON.Vector3(14,5,5)},
            {text:"🕵️ Spy HQ", pos:new BABYLON.Vector3(-12,5,9)},
        ];
        for (const lb of labels) {
            const p = BABYLON.MeshBuilder.CreatePlane("lb", {width:3,height:0.8}, s);
            p.position=lb.pos; p.billboardMode=BABYLON.Mesh.BILLBOARDMODE_ALL;
            const dt = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(p, 512, 128);
            const tb = new BABYLON.GUI.TextBlock();
            tb.text=lb.text; tb.color="white"; tb.fontSize=36; tb.fontFamily="Georgia, serif";
            tb.outlineColor="black"; tb.outlineWidth=3;
            dt.addControl(tb);
        }

        this._spawnUnits(player);
    }

    _spawnUnits(player) {
        for (const u of this.units) u.dispose();
        this.units = [];
        const s = this.scene;
        for (let i=0;i<Math.min(player.attack_soldiers,25);i++){
            const a=Math.random()*Math.PI*2,d=2+Math.random()*3;
            this.units.push(createSoldier(new BABYLON.Color3(0.85,0.12,0.08),new BABYLON.Vector3(-8+Math.cos(a)*d,0,3+Math.sin(a)*d),s));
        }
        for (let i=0;i<Math.min(player.defense_soldiers,20);i++){
            const a=Math.random()*Math.PI*2,d=3+Math.random()*3;
            this.units.push(createSoldier(new BABYLON.Color3(0.08,0.25,0.85),new BABYLON.Vector3(Math.cos(a)*d,0,Math.sin(a)*d),s));
        }
        for (let i=0;i<Math.min(player.citizens,15);i++){
            this.units.push(createCitizen(new BABYLON.Vector3(-14+Math.random()*28,0,-18+Math.random()*8),s));
        }
        // Gold piles
        for (let i=0;i<Math.min(Math.floor(player.gold/500),12);i++){
            const c=BABYLON.MeshBuilder.CreateCylinder("c",{diameterTop:0,diameterBottom:0.45,height:0.22},s);
            c.position=new BABYLON.Vector3(2+Math.random()*3,0.12,3+Math.random()*4);
            const cm=new BABYLON.StandardMaterial("cM",s);cm.diffuseColor=new BABYLON.Color3(1,0.85,0.1);cm.emissiveColor=new BABYLON.Color3(0.3,0.2,0);c.material=cm;this.units.push(c);
        }
    }

    onPlayerUpdated(player) {
        if (this._hudTexts) {
            const m = isMobile();
            this._hudTexts.gold.text = `💰 ${this._fmt(player.gold)}`;
            this._hudTexts.turns.text = m ? `⚡${player.turns}` : `⚡ ${player.turns}/${player.max_turns}`;
            this._hudTexts.rank.text = m ? `🏆#${player.battle_rank}` : `🏆 Rank #${player.battle_rank}`;
            this._hudTexts.army.text = `⚔️${this._fmt(player.attack_soldiers)} 🛡️${this._fmt(player.defense_soldiers)}`;
        }
        this._spawnUnits(player);
    }

    deactivate() {}

    _fmt(n) { return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':''+n; }
}
