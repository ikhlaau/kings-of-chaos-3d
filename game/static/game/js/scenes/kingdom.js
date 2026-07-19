/** Kingdom scene — realistic 3D. */
import { HUD } from '../ui/hud.js';
import { createSky } from '../entities/environment.js';
import { createCastle, createBarracks, createTrainingGround, createArmory, createSpyHQ } from '../entities/buildings.js';
import { createSoldier, createCitizen } from '../entities/units.js';

export class KingdomScene {
    constructor(engine, game) {
        this.engine = engine; this.game = game;
        this.scene = new BABYLON.Scene(engine);
        this.hud = null; this.buildings = {}; this.units = [];
        this._setupScene();
    }

    _setupScene() {
        const s = this.scene;
        s.clearColor = new BABYLON.Color4(0.45, 0.6, 0.85, 1);

        // Camera
        this.camera = new BABYLON.ArcRotateCamera("kCam", -Math.PI/3, Math.PI/3.5, 35, new BABYLON.Vector3(0,2,0), s);
        this.camera.lowerRadiusLimit=12; this.camera.upperRadiusLimit=70;
        this.camera.lowerBetaLimit=0.3; this.camera.upperBetaLimit=Math.PI/2-0.1;
        this.camera.attachControl(s.getEngine().getRenderingCanvas(), true);

        // Lighting with shadows
        const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0,1,0), s);
        hemi.intensity = 0.5; hemi.diffuse = new BABYLON.Color3(0.8,0.85,1);

        const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-0.6,-0.7,0.4), s);
        sun.intensity = 0.8; sun.diffuse = new BABYLON.Color3(1,0.95,0.8);

        // Ground with texture
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width:60,height:60,subdivisions:20}, s);
        const gm = new BABYLON.StandardMaterial("gM", s);
        gm.diffuseColor = new BABYLON.Color3(0.22,0.48,0.15);
        gm.specularColor = new BABYLON.Color3(0.05,0.05,0.05);
        ground.material = gm;
        ground.receiveShadows = true;

        // Dirt path from castle
        const path = BABYLON.MeshBuilder.CreateGround("path", {width:2,height:15}, s);
        path.position = new BABYLON.Vector3(0,0.03,-3);
        const pm = new BABYLON.StandardMaterial("pM", s);
        pm.diffuseColor = new BABYLON.Color3(0.35,0.25,0.15); path.material = pm;

        // Trees with varied sizes
        this._plantTrees(s);

        // Fog for depth
        s.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
        s.fogColor = new BABYLON.Color3(0.45,0.6,0.85);
        s.fogStart = 40; s.fogEnd = 80;
    }

    _plantTrees(scene) {
        const positions = [];
        for (let a=0; a<Math.PI*2; a+=0.25) {
            const d=20+Math.random()*10;
            positions.push({x:Math.cos(a)*d, z:Math.sin(a)*d});
        }
        for (let i=0; i<30; i++) positions.push({x:(Math.random()-0.5)*55, z:(Math.random()-0.5)*55});

        for (const p of positions) {
            if (Math.abs(p.x)<10&&Math.abs(p.z)<10) continue;
            const tree = new BABYLON.TransformNode("tree", scene);
            tree.position = new BABYLON.Vector3(p.x, 0, p.z);
            const th = 1.5+Math.random()*1.5;
            const trunk = BABYLON.MeshBuilder.CreateCylinder("trunk", {height:th, diameter:0.25}, scene);
            trunk.position.y=th/2; trunk.parent=tree;
            const tm = new BABYLON.StandardMaterial("tM", scene); tm.diffuseColor=new BABYLON.Color3(0.25,0.15,0.08); trunk.material=tm;
            for (let j=0; j<2+Math.floor(Math.random()*2); j++) {
                const foliage = BABYLON.MeshBuilder.CreateSphere("leaf", {diameter:1.3-j*0.3}, scene);
                foliage.position.y=th+j*0.5; foliage.parent=tree;
                const fm = new BABYLON.StandardMaterial("fM", scene);
                fm.diffuseColor=new BABYLON.Color3(0.08+Math.random()*0.15, 0.25+Math.random()*0.4, 0.04+Math.random()*0.08);
                foliage.material=fm;
            }
        }
    }

    async activate() {
        if (!this.hud) {
            this.hud = new HUD(this.scene, this.game.player, this.game);
            this._buildKingdom(this.game.player);
        }
        this.hud.update(this.game.player);
    }

    _buildKingdom(player) {
        const s = this.scene;
        const go = (name) => this.game.switchScene(name);

        this.buildings.castle = createCastle({x:0,z:0}, player, s, () => {});
        this.buildings.barracks = createBarracks({x:-8,z:3}, player.attack_soldiers+player.defense_soldiers, s, () => go('battle'));
        this.buildings.training = createTrainingGround({x:10,z:3}, s, () => go('training'));
        this.buildings.armory = createArmory({x:14,z:5}, s, () => go('armory'));
        this.buildings.spyhq = createSpyHQ({x:-12,z:9}, s, () => go('spyhq'));

        // Label signs floating above buildings
        this._addLabel("⚔️ Barracks", new BABYLON.Vector3(-8,4.5,3), s);
        this._addLabel("🎯 Training", new BABYLON.Vector3(10,1.5,3), s);
        this._addLabel("🔧 Armory", new BABYLON.Vector3(14,4,5), s);
        this._addLabel("🕵️ Spy HQ", new BABYLON.Vector3(-12,4,9), s);

        this._spawnUnits(player);
        this._spawnGoldPiles(player);
    }

    _addLabel(text, position, scene) {
        const plane = BABYLON.MeshBuilder.CreatePlane("label", {width:3, height:0.8}, scene);
        plane.position = position; plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        const dt = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(plane, 512, 128);
        const tb = new BABYLON.GUI.TextBlock();
        tb.text = text; tb.color = "white"; tb.fontSize = 36; tb.outlineColor = "black"; tb.outlineWidth = 3;
        dt.addControl(tb);
    }

    _spawnUnits(player) {
        for (const u of this.units) u.dispose();
        this.units = [];
        const s = this.scene;

        const atkCount = Math.min(player.attack_soldiers, 30);
        for (let i=0; i<atkCount; i++) {
            const a=Math.random()*Math.PI*2, d=2+Math.random()*3;
            this.units.push(createSoldier(new BABYLON.Color3(0.9,0.15,0.1), new BABYLON.Vector3(-8+Math.cos(a)*d,0,3+Math.sin(a)*d), s));
        }
        const defCount = Math.min(player.defense_soldiers, 25);
        for (let i=0; i<defCount; i++) {
            const a=Math.random()*Math.PI*2, d=3+Math.random()*3;
            this.units.push(createSoldier(new BABYLON.Color3(0.1,0.3,0.9), new BABYLON.Vector3(Math.cos(a)*d,0,Math.sin(a)*d), s));
        }
        const citCount = Math.min(player.citizens, 20);
        for (let i=0; i<citCount; i++) {
            this.units.push(createCitizen(new BABYLON.Vector3(-14+Math.random()*28,0,-18+Math.random()*8), s));
        }
    }

    _spawnGoldPiles(player) {
        const s = this.scene;
        for (let i=0; i<Math.min(Math.floor(player.gold/500), 15); i++) {
            const coin = BABYLON.MeshBuilder.CreateCylinder("coin", {diameterTop:0,diameterBottom:0.45,height:0.22}, s);
            coin.position = new BABYLON.Vector3(2+Math.random()*3,0.12,3+Math.random()*4);
            const cm = new BABYLON.StandardMaterial("cM", s);
            cm.diffuseColor=new BABYLON.Color3(1,0.85,0.1); cm.emissiveColor=new BABYLON.Color3(0.3,0.2,0); cm.specularColor=new BABYLON.Color3(0.5,0.4,0.1);
            coin.material=cm; this.units.push(coin);
        }
    }

    onPlayerUpdated(player) {
        if (this.hud) this.hud.update(player);
        this._spawnUnits(player);
    }
}
