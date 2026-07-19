/** Realistic procedural buildings for the kingdom scene. */
const MAT_STONE = (scene) => { const m=new BABYLON.StandardMaterial("stone",scene); m.diffuseColor=new BABYLON.Color3(0.55,0.5,0.42); m.specularColor=new BABYLON.Color3(0.1,0.1,0.1); return m; };
const MAT_WOOD = (scene) => { const m=new BABYLON.StandardMaterial("wood",scene); m.diffuseColor=new BABYLON.Color3(0.35,0.2,0.1); return m; };
const MAT_ROOF = (scene) => { const m=new BABYLON.StandardMaterial("roof",scene); m.diffuseColor=new BABYLON.Color3(0.45,0.15,0.08); return m; };

function makePickable(meshOrNode, scene, onClick) {
    // Make the first big child mesh pickable as the click target
    const children = meshOrNode.getChildMeshes ? meshOrNode.getChildMeshes() : [];
    const target = children[0] || meshOrNode;
    target.isPickable = true;
    target.actionManager = new BABYLON.ActionManager(scene);
    target.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, onClick));
    // Hover on all children
    target.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
        (meshOrNode.getChildMeshes ? meshOrNode.getChildMeshes() : [meshOrNode]).forEach(m => {
            m.renderOutline=true; m.outlineColor=BABYLON.Color3.Yellow(); m.outlineWidth=0.03;
        });
    }));
    target.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
        (meshOrNode.getChildMeshes ? meshOrNode.getChildMeshes() : [meshOrNode]).forEach(m => {
            m.renderOutline=false;
        });
    }));
}

export function createCastle(pos, player, scene, onClick) {
    const goldScale = Math.log10((player?.gold||1000) + 1) * 2;
    const h = 3 + goldScale;
    const root = new BABYLON.TransformNode("castle", scene);
    root.position = new BABYLON.Vector3(pos.x, 0, pos.z);

    // Keep — textured stone blocks
    const keep = BABYLON.MeshBuilder.CreateBox("keep", {width:3.5, height:h, depth:3.5}, scene);
    keep.position.y = h/2; keep.parent = root; keep.material = MAT_STONE(scene);

    // Battlements on top
    for (let i=0; i<4; i++) {
        for (let j=0; j<3; j++) {
            const merlon = BABYLON.MeshBuilder.CreateBox("merlon", {width:0.4, height:0.6, depth:0.4}, scene);
            const side = i%2===0 ? (i===0?1:-1) : 0;
            const fwd = i%2===1 ? (i===1?1:-1) : 0;
            merlon.position = new BABYLON.Vector3(side*(1.75+0.25), h+0.3, fwd*(1.75+0.25));
            merlon.position.x += side===0 ? (j-1)*0.7 : 0;
            merlon.position.z += fwd===0 ? (j-1)*0.7 : 0;
            merlon.parent = root; merlon.material = MAT_STONE(scene);
        }
    }

    // Turrets (4 corners)
    for (let cx of [-1.6,1.6]) for (let cz of [-1.6,1.6]) {
        const turret = BABYLON.MeshBuilder.CreateCylinder("turret", {height:h*0.7, diameterTop:0.4, diameterBottom:0.7}, scene);
        turret.position = new BABYLON.Vector3(cx, h*0.35, cz); turret.parent = root; turret.material = MAT_STONE(scene);
        const roof = BABYLON.MeshBuilder.CreateCylinder("troof", {height:0.5, diameterTop:0, diameterBottom:0.9}, scene);
        roof.position.y = h*0.7+0.25; roof.parent = turret; roof.material = MAT_ROOF(scene);
    }

    // Main roof peak
    const roof = BABYLON.MeshBuilder.CreateCylinder("roof", {height:1.8, diameterTop:0, diameterBottom:4}, scene);
    roof.position.y = h+0.9; roof.parent = root; roof.material = MAT_ROOF(scene);

    // Gate (dark entrance)
    const gate = BABYLON.MeshBuilder.CreateBox("gate", {width:1.2, height:1.8, depth:0.1}, scene);
    gate.position = new BABYLON.Vector3(0, 0.9, 1.8); gate.parent = root;
    const gm = new BABYLON.StandardMaterial("gateM", scene); gm.diffuseColor=new BABYLON.Color3(0.1,0.08,0.05); gate.material=gm;

    // Flag on top
    const flagPole = BABYLON.MeshBuilder.CreateCylinder("fpole", {height:2.5, diameter:0.08}, scene);
    flagPole.position.y = h+1.8+1.25; flagPole.parent = root;
    const fpMat = new BABYLON.StandardMaterial("fpM", scene); fpMat.diffuseColor=new BABYLON.Color3(0.4,0.3,0.2); flagPole.material=fpMat;
    const flag = BABYLON.MeshBuilder.CreatePlane("flag", {width:1.2, height:0.7}, scene);
    flag.position = new BABYLON.Vector3(0.6, h+1.8+2.3, 0); flag.parent = root;
    const fMat = new BABYLON.StandardMaterial("fMat", scene); fMat.diffuseColor=new BABYLON.Color3(0.8,0.2,0.1); fMat.backFaceCulling=false; flag.material=fMat;

    if (onClick) makePickable(root, scene, onClick);
    return root;
}

export function createBarracks(pos, armyCount, scene, onClick) {
    const scale = Math.log10((armyCount||0)+1)*1.5;
    const w = 5+scale, h=3, d=3.5;
    const root = new BABYLON.TransformNode("barracks", scene);
    root.position = new BABYLON.Vector3(pos.x, 0, pos.z);

    const body = BABYLON.MeshBuilder.CreateBox("bBody", {width:w, height:h, depth:d}, scene);
    body.position.y = h/2; body.parent = root;
    const bm = new BABYLON.StandardMaterial("bM", scene); bm.diffuseColor=new BABYLON.Color3(0.55,0.12,0.08); body.material=bm;

    // Windows
    for (let i=0; i<Math.floor(w/2); i++) {
        const win = BABYLON.MeshBuilder.CreateBox("win", {width:0.4, height:0.5, depth:0.05}, scene);
        win.position = new BABYLON.Vector3(-w/2+1+i*2, h*0.6, d/2+0.05); win.parent = root;
        const wm = new BABYLON.StandardMaterial("wM", scene); wm.diffuseColor=new BABYLON.Color3(1,0.85,0.3); wm.emissiveColor=new BABYLON.Color3(0.3,0.2,0); win.material=wm;
    }

    // Roof
    const roof = BABYLON.MeshBuilder.CreateCylinder("bRoof", {height:1.2, diameterTop:0, diameterBottom:w+0.8}, scene);
    roof.rotation.z = Math.PI/2; roof.position.y = h+0.6; roof.parent = root; roof.material = MAT_ROOF(scene);

    if (onClick) makePickable(root, scene, onClick);
    return root;
}

export function createTrainingGround(pos, scene, onClick) {
    const root = new BABYLON.TransformNode("training", scene);
    root.position = new BABYLON.Vector3(pos.x, 0, pos.z);

    // Sand arena
    const arena = BABYLON.MeshBuilder.CreateGround("arena", {width:7, height:7}, scene);
    arena.position.y = 0.02; arena.parent = root;
    const am = new BABYLON.StandardMaterial("aM", scene); am.diffuseColor=new BABYLON.Color3(0.45,0.35,0.2); arena.material=am;

    // Fence
    for (let i=0; i<12; i++) {
        const angle = (i/12)*Math.PI*2;
        const post = BABYLON.MeshBuilder.CreateCylinder("post", {height:1.8, diameter:0.08}, scene);
        post.position = new BABYLON.Vector3(Math.cos(angle)*3.5, 0.9, Math.sin(angle)*3.5); post.parent = root;
        post.material = MAT_WOOD(scene);
    }
    // Railing
    for (let i=0; i<12; i++) {
        const a1=(i/12)*Math.PI*2, a2=((i+1)/12)*Math.PI*2;
        const mid = new BABYLON.Vector3((Math.cos(a1)+Math.cos(a2))/2*3.5, 1.4, (Math.sin(a1)+Math.sin(a2))/2*3.5);
        const rail = BABYLON.MeshBuilder.CreateBox("rail", {width:1.8, height:0.1, depth:0.1}, scene);
        rail.position = mid; rail.parent = root; rail.material = MAT_WOOD(scene);
        rail.rotation.y = -a1;
    }

    // Training dummies
    for (let i=0; i<4; i++) {
        const dummy = BABYLON.MeshBuilder.CreateCylinder("dummy", {height:2, diameterTop:0.15, diameterBottom:0.25}, scene);
        dummy.position = new BABYLON.Vector3(-2+i*1.3, 1, 0); dummy.parent = root; dummy.material = MAT_WOOD(scene);
        const dhead = BABYLON.MeshBuilder.CreateSphere("dH", {diameter:0.35}, scene);
        dhead.position.y = 2.2; dhead.parent = dummy;
        const hm = new BABYLON.StandardMaterial("hM", scene); hm.diffuseColor=new BABYLON.Color3(0.7,0.5,0.3); dhead.material=hm;
    }

    if (onClick) makePickable(root, scene, onClick);
    return root;
}

export function createArmory(pos, scene, onClick) {
    const root = new BABYLON.TransformNode("armory", scene);
    root.position = new BABYLON.Vector3(pos.x, 0, pos.z);

    const body = BABYLON.MeshBuilder.CreateBox("aBody", {width:4, height:3, depth:3.5}, scene);
    body.position.y = 1.5; body.parent = root;
    const bm = new BABYLON.StandardMaterial("aBM", scene); bm.diffuseColor=new BABYLON.Color3(0.35,0.33,0.35); body.material=bm;

    // Chimney with smoke
    const chimney = BABYLON.MeshBuilder.CreateCylinder("chimney", {height:2, diameter:0.4}, scene);
    chimney.position = new BABYLON.Vector3(1.5, 4, 1.2); chimney.parent = root; chimney.material = bm;

    // Forge glow
    const forgeLight = new BABYLON.PointLight("forgeL", new BABYLON.Vector3(1.5, 0.8, 1.2), scene);
    forgeLight.diffuse = new BABYLON.Color3(1, 0.5, 0.15); forgeLight.intensity = 0.6; forgeLight.parent = root;

    // Smoke particles
    if (BABYLON.ParticleSystem) {
        const smoke = new BABYLON.ParticleSystem("smoke", 50, scene);
        smoke.particleTexture = new BABYLON.DynamicTexture("smokeTex", 32, scene);
        const ctx = smoke.particleTexture.getContext();
        ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(16,16,14,0,Math.PI*2); ctx.fill();
        smoke.particleTexture.update();
        smoke.emitter = new BABYLON.Vector3(1.5, 5, 1.2);
        smoke.minEmitBox = new BABYLON.Vector3(-0.1, 0, -0.1);
        smoke.maxEmitBox = new BABYLON.Vector3(0.1, 0, 0.1);
        smoke.color1 = new BABYLON.Color4(0.6, 0.6, 0.6, 0.5);
        smoke.color2 = new BABYLON.Color4(0.3, 0.3, 0.3, 0);
        smoke.colorDead = new BABYLON.Color4(0.1, 0.1, 0.1, 0);
        smoke.minSize = 0.3; smoke.maxSize = 0.8;
        smoke.minLifeTime = 0.5; smoke.maxLifeTime = 1.5;
        smoke.emitRate = 20;
        smoke.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
        smoke.start();
    }

    // Weapon sign
    const sign = BABYLON.MeshBuilder.CreatePlane("sign", {width:1.5, height:0.8}, scene);
    sign.position = new BABYLON.Vector3(0, 2.8, 1.8); sign.parent = root;
    const sm = new BABYLON.StandardMaterial("sM", scene);
    sm.diffuseColor=new BABYLON.Color3(0.5,0.4,0.3); sm.backFaceCulling=false; sign.material=sm;

    if (onClick) makePickable(root, scene, onClick);
    return root;
}

export function createSpyHQ(pos, scene, onClick) {
    const root = new BABYLON.TransformNode("spyhq", scene);
    root.position = new BABYLON.Vector3(pos.x, 0, pos.z);

    const body = BABYLON.MeshBuilder.CreateBox("sBody", {width:3, height:2.5, depth:3}, scene);
    body.position.y = 1.25; body.parent = root;
    const bm = new BABYLON.StandardMaterial("sBM", scene); bm.diffuseColor=new BABYLON.Color3(0.12,0.09,0.15); body.material=bm;

    const roof = BABYLON.MeshBuilder.CreateCylinder("sRoof", {height:1.2, diameterTop:0, diameterBottom:3.5}, scene);
    roof.position.y = 3.1; roof.parent = root;
    const rm = new BABYLON.StandardMaterial("sRM", scene); rm.diffuseColor=new BABYLON.Color3(0.08,0.06,0.12); roof.material=rm;

    // Single lit window
    const win = BABYLON.MeshBuilder.CreateBox("sWin", {width:0.5, height:0.4, depth:0.05}, scene);
    win.position = new BABYLON.Vector3(0, 1.8, 1.53); win.parent = root;
    const wm = new BABYLON.StandardMaterial("swM", scene); wm.diffuseColor=new BABYLON.Color3(1,0.8,0.3); wm.emissiveColor=new BABYLON.Color3(0.4,0.2,0); win.material=wm;

    if (onClick) makePickable(root, scene, onClick);
    return root;
}
