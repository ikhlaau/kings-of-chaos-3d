/** Epic medieval procedural buildings — cream stone, blue-purple roofs, timber houses. */

// ── Palette (reference: classic fantasy kingdoms) ──
const CREAM = [0.88, 0.82, 0.68];
const STONE = [0.62, 0.60, 0.55];
const STONE_DARK = [0.45, 0.43, 0.40];
const TIMBER = [0.35, 0.22, 0.10];
const ROOF_BLUE = [0.28, 0.26, 0.55];
const ROOF_TERRA = [0.62, 0.24, 0.12];
const ROOF_SLATE = [0.16, 0.14, 0.22];
const GOLD_TRIM = [0.85, 0.65, 0.25];

function mat(scene, rgb, opts = {}) {
    const m = new BABYLON.StandardMaterial("m", scene);
    m.diffuseColor = new BABYLON.Color3(...rgb);
    m.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
    if (opts.emissive) m.emissiveColor = new BABYLON.Color3(...opts.emissive);
    return m;
}

/** Triangular prism pitched roof via ExtrudeShape. */
function pitchedRoof(scene, w, d, h, rgb) {
    const shape = [
        new BABYLON.Vector3(-w / 2, 0, 0),
        new BABYLON.Vector3(w / 2, 0, 0),
        new BABYLON.Vector3(0, h, 0),
    ];
    const path = [new BABYLON.Vector3(0, 0, -d / 2), new BABYLON.Vector3(0, 0, d / 2)];
    const roof = BABYLON.MeshBuilder.ExtrudeShape("roof", { shape, path, cap: BABYLON.Mesh.CAP_ALL }, scene);
    roof.material = mat(scene, rgb);
    return roof;
}

/** Conical roof. */
function coneRoof(scene, diameter, h, rgb, tess = 8) {
    const r = BABYLON.MeshBuilder.CreateCylinder("croof", { height: h, diameterTop: 0, diameterBottom: diameter, tessellation: tess }, scene);
    r.material = mat(scene, rgb);
    return r;
}

/** Battlements ring on top of a box footprint. */
function battlements(scene, parent, w, d, y, rgb) {
    const step = 0.55, mw = 0.3, mh = 0.35;
    const positions = [];
    for (let x = -w / 2 + mw; x <= w / 2 - mw + 0.01; x += step) {
        positions.push([x, d / 2], [x, -d / 2]);
    }
    for (let z = -d / 2 + mw; z <= d / 2 - mw + 0.01; z += step) {
        positions.push([w / 2, z], [-w / 2, z]);
    }
    const merlons = [];
    for (const [x, z] of positions) {
        const m = BABYLON.MeshBuilder.CreateBox("merlon", { width: mw, height: mh, depth: mw }, scene);
        m.position = new BABYLON.Vector3(x, y + mh / 2, z);
        m.material = mat(scene, rgb);
        m.parent = parent;
        merlons.push(m);
    }
    return merlons;
}

/** Warm glowing window. */
function window_(scene, parent, x, y, z, w = 0.35, h = 0.45) {
    const win = BABYLON.MeshBuilder.CreateBox("win", { width: w, height: h, depth: 0.06 }, scene);
    win.position = new BABYLON.Vector3(x, y, z);
    win.material = mat(scene, [1, 0.8, 0.35], { emissive: [0.45, 0.3, 0.05] });
    win.parent = parent;
    return win;
}

/** Waving banner flag. */
function banner(scene, parent, x, y, z, rgb = [0.75, 0.15, 0.1], poleH = 1.6) {
    const pole = BABYLON.MeshBuilder.CreateCylinder("pole", { height: poleH, diameter: 0.06 }, scene);
    pole.position = new BABYLON.Vector3(x, y + poleH / 2, z);
    pole.material = mat(scene, TIMBER);
    pole.parent = parent;
    const flag = BABYLON.MeshBuilder.CreatePlane("flag", { width: 0.8, height: 0.5, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
    flag.position = new BABYLON.Vector3(x + 0.42, y + poleH - 0.3, z);
    flag.material = mat(scene, rgb, { emissive: [rgb[0] * 0.25, rgb[1] * 0.25, rgb[2] * 0.25] });
    flag.parent = parent;
    return flag;
}

// ══════════════════════ CASTLE ══════════════════════
export function createCastle(pos, player, scene, onClick) {
    const root = new BABYLON.TransformNode("castle", scene);
    root.position = new BABYLON.Vector3(pos.x, 0, pos.z);

    // ── Central keep: wide, cream stone ──
    const keepW = 4.6, keepH = 5.2, keepD = 4.6;
    const keep = BABYLON.MeshBuilder.CreateBox("keep", { width: keepW, height: keepH, depth: keepD }, scene);
    keep.position.y = keepH / 2;
    keep.material = mat(scene, CREAM);
    keep.parent = root;

    // Stone base skirt
    const skirt = BABYLON.MeshBuilder.CreateBox("skirt", { width: keepW + 0.5, height: 0.8, depth: keepD + 0.5 }, scene);
    skirt.position.y = 0.4;
    skirt.material = mat(scene, STONE_DARK);
    skirt.parent = root;

    battlements(scene, root, keepW + 0.2, keepD + 0.2, keepH, CREAM);

    // Keep pyramid roof (blue-purple, like the reference)
    const keepRoof = coneRoof(scene, keepW * 1.15, 2.2, ROOF_BLUE, 4);
    keepRoof.position.y = keepH + 1.1 + 0.35;
    keepRoof.rotation.y = Math.PI / 4;
    keepRoof.parent = root;

    // Gold finial + banner on keep
    const fin = BABYLON.MeshBuilder.CreateSphere("fin", { diameter: 0.25 }, scene);
    fin.position.y = keepH + 2.35;
    fin.material = mat(scene, GOLD_TRIM, { emissive: [0.3, 0.22, 0.05] });
    fin.parent = root;
    banner(scene, root, 0, keepH + 2.3, 0, [0.75, 0.15, 0.1], 1.8);

    // ── Corner turrets with conical blue roofs ──
    for (const [cx, cz] of [[-2.9, -2.9], [2.9, -2.9], [-2.9, 2.9], [2.9, 2.9]]) {
        const t = BABYLON.MeshBuilder.CreateCylinder("turret", { height: 6.2, diameterTop: 1.3, diameterBottom: 1.6, tessellation: 10 }, scene);
        t.position = new BABYLON.Vector3(cx, 3.1, cz);
        t.material = mat(scene, CREAM);
        t.parent = root;

        const tr = coneRoof(scene, 2.0, 1.6, ROOF_BLUE, 10);
        tr.position = new BABYLON.Vector3(cx, 6.2 + 0.8, cz);
        tr.parent = root;

        const tf = BABYLON.MeshBuilder.CreateSphere("tf", { diameter: 0.18 }, scene);
        tf.position = new BABYLON.Vector3(cx, 7.9, cz);
        tf.material = mat(scene, GOLD_TRIM, { emissive: [0.3, 0.22, 0.05] });
        tf.parent = root;
    }

    // ── Windows on keep ──
    window_(scene, root, -1.2, 3.4, keepD / 2 + 0.03);
    window_(scene, root, 1.2, 3.4, keepD / 2 + 0.03);
    window_(scene, root, 0, 4.4, keepD / 2 + 0.03);

    // ── Gatehouse ──
    const gate = BABYLON.MeshBuilder.CreateBox("gate", { width: 1.6, height: 2.4, depth: 0.9 }, scene);
    gate.position = new BABYLON.Vector3(0, 1.2, keepD / 2 + 0.45);
    gate.material = mat(scene, STONE_DARK);
    gate.parent = root;
    const arch = coneRoof(scene, 1.9, 0.8, ROOF_BLUE, 4);
    arch.rotation.y = Math.PI / 4;
    arch.position = new BABYLON.Vector3(0, 2.8, keepD / 2 + 0.45);
    arch.parent = root;

    if (onClick) makePickable(root, scene, onClick);
    return root;
}

// ══════════════════════ CITY WALL RING ══════════════════════
export function createWallRing(center, radius, scene, gateAngle = Math.PI / 2) {
    const root = new BABYLON.TransformNode("walls", scene);
    root.position = new BABYLON.Vector3(center.x, 0, center.z);

    const segs = 26;
    const wallH = 1.8, wallT = 0.7;
    for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        // Leave a gate opening
        let da = Math.abs(a - gateAngle);
        if (da > Math.PI) da = Math.PI * 2 - da;
        if (da < 0.28) continue;

        const x = Math.cos(a) * radius, z = Math.sin(a) * radius;
        const segLen = (Math.PI * 2 * radius) / segs + 0.15;
        const wall = BABYLON.MeshBuilder.CreateBox("wall", { width: segLen, height: wallH, depth: wallT }, scene);
        wall.position = new BABYLON.Vector3(x, wallH / 2, z);
        wall.rotation.y = -a + Math.PI / 2;
        wall.material = mat(scene, STONE);
        wall.parent = root;

        // Wall top trim
        const trim = BABYLON.MeshBuilder.CreateBox("wtrim", { width: segLen, height: 0.18, depth: wallT + 0.25 }, scene);
        trim.position = new BABYLON.Vector3(x, wallH + 0.09, z);
        trim.rotation.y = -a + Math.PI / 2;
        trim.material = mat(scene, STONE_DARK);
        trim.parent = root;

        // Towers every ~5 segments
        if (i % 5 === 0) {
            const tw = BABYLON.MeshBuilder.CreateCylinder("wtower", { height: 3.0, diameter: 1.4, tessellation: 8 }, scene);
            tw.position = new BABYLON.Vector3(x, 1.5, z);
            tw.material = mat(scene, CREAM);
            tw.parent = root;
            const twr = coneRoof(scene, 1.8, 1.1, ROOF_BLUE, 8);
            twr.position = new BABYLON.Vector3(x, 3.55, z);
            twr.parent = root;
        }
    }

    // Gate posts
    for (const side of [-1, 1]) {
        const gx = Math.cos(gateAngle) * radius - Math.sin(gateAngle) * side * 1.6;
        const gz = Math.sin(gateAngle) * radius + Math.cos(gateAngle) * side * 1.6;
        const post = BABYLON.MeshBuilder.CreateCylinder("gpost", { height: 3.2, diameter: 1.1, tessellation: 8 }, scene);
        post.position = new BABYLON.Vector3(gx, 1.6, gz);
        post.material = mat(scene, CREAM);
        post.parent = root;
        const pr = coneRoof(scene, 1.5, 1.0, ROOF_BLUE, 8);
        pr.position = new BABYLON.Vector3(gx, 3.7, gz);
        pr.parent = root;
        banner(scene, root, gx, 4.1, gz, [0.28, 0.26, 0.55], 1.2);
    }
    return root;
}

// ══════════════════════ MEDIEVAL HOUSE (decorative) ══════════════════════
export function createHouse(pos, scene, opts = {}) {
    const w = opts.w || 2.2 + Math.random() * 0.8;
    const d = opts.d || 2.0 + Math.random() * 0.6;
    const h = opts.h || 1.8 + Math.random() * 0.5;
    const rot = opts.rot ?? Math.random() * Math.PI * 2;
    const roofColor = opts.roof || (Math.random() < 0.7 ? ROOF_TERRA : ROOF_BLUE);

    const root = new BABYLON.TransformNode("house", scene);
    root.position = new BABYLON.Vector3(pos.x, 0, pos.z);
    root.rotation.y = rot;

    const body = BABYLON.MeshBuilder.CreateBox("hBody", { width: w, height: h, depth: d }, scene);
    body.position.y = h / 2;
    body.material = mat(scene, CREAM);
    body.parent = root;

    // Timber frame strips
    for (const fx of [-w / 2 + 0.1, w / 2 - 0.1]) {
        const beam = BABYLON.MeshBuilder.CreateBox("beam", { width: 0.14, height: h, depth: d + 0.05 }, scene);
        beam.position = new BABYLON.Vector3(fx, h / 2, 0);
        beam.material = mat(scene, TIMBER);
        beam.parent = root;
    }
    const beamTop = BABYLON.MeshBuilder.CreateBox("beamT", { width: w + 0.05, height: 0.14, depth: d + 0.05 }, scene);
    beamTop.position.y = h - 0.07;
    beamTop.material = mat(scene, TIMBER);
    beamTop.parent = root;

    // Pitched roof
    const roof = pitchedRoof(scene, d + 0.5, w + 0.5, 1.1, roofColor);
    roof.rotation.y = Math.PI / 2;
    roof.position.y = h;
    roof.parent = root;

    // Chimney
    if (Math.random() < 0.6) {
        const ch = BABYLON.MeshBuilder.CreateBox("chim", { width: 0.3, height: 0.9, depth: 0.3 }, scene);
        ch.position = new BABYLON.Vector3(w * 0.25, h + 0.7, 0);
        ch.material = mat(scene, STONE_DARK);
        ch.parent = root;
    }

    // Door + windows
    const door = BABYLON.MeshBuilder.CreateBox("door", { width: 0.5, height: 0.9, depth: 0.06 }, scene);
    door.position = new BABYLON.Vector3(0, 0.45, d / 2 + 0.03);
    door.material = mat(scene, TIMBER);
    door.parent = root;
    window_(scene, root, -w / 4, h * 0.55, d / 2 + 0.03, 0.3, 0.35);
    window_(scene, root, w / 4, h * 0.55, d / 2 + 0.03, 0.3, 0.35);

    return root;
}

// ══════════════════════ BARRACKS ══════════════════════
export function createBarracks(pos, armyCount, scene, onClick) {
    const root = new BABYLON.TransformNode("barracks", scene);
    root.position = new BABYLON.Vector3(pos.x, 0, pos.z);

    const w = 5.2, h = 2.6, d = 3.2;
    const body = BABYLON.MeshBuilder.CreateBox("bBody", { width: w, height: h, depth: d }, scene);
    body.position.y = h / 2;
    body.material = mat(scene, CREAM);
    body.parent = root;

    // Timber beams
    for (let i = 0; i <= 4; i++) {
        const beam = BABYLON.MeshBuilder.CreateBox("bbeam", { width: 0.14, height: h, depth: d + 0.06 }, scene);
        beam.position = new BABYLON.Vector3(-w / 2 + (i * w) / 4, h / 2, 0);
        beam.material = mat(scene, TIMBER);
        beam.parent = root;
    }

    const roof = pitchedRoof(scene, d + 0.6, w + 0.7, 1.4, ROOF_TERRA);
    roof.rotation.y = Math.PI / 2;
    roof.position.y = h;
    roof.parent = root;

    // Windows
    for (let i = 0; i < 3; i++) window_(scene, root, -w / 2 + 1.2 + i * 1.4, h * 0.6, d / 2 + 0.03);

    // Door
    const door = BABYLON.MeshBuilder.CreateBox("bdoor", { width: 0.7, height: 1.2, depth: 0.06 }, scene);
    door.position = new BABYLON.Vector3(0, 0.6, d / 2 + 0.03);
    door.material = mat(scene, TIMBER);
    door.parent = root;

    // Weapon rack beside the door
    const rack = BABYLON.MeshBuilder.CreateBox("rack", { width: 1.0, height: 1.1, depth: 0.15 }, scene);
    rack.position = new BABYLON.Vector3(w / 2 + 0.6, 0.55, d / 2 - 0.4);
    rack.material = mat(scene, TIMBER);
    rack.parent = root;
    for (let i = 0; i < 3; i++) {
        const spear = BABYLON.MeshBuilder.CreateCylinder("spear", { height: 1.6, diameterTop: 0.02, diameterBottom: 0.04 }, scene);
        spear.position = new BABYLON.Vector3(w / 2 + 0.35 + i * 0.25, 0.9, d / 2 - 0.4);
        spear.material = mat(scene, STONE_DARK);
        spear.parent = root;
    }

    // Red banner
    banner(scene, root, -w / 2 - 0.4, 0, d / 2 - 0.5, [0.7, 0.12, 0.1], 2.6);

    if (onClick) makePickable(root, scene, onClick);
    return root;
}

// ══════════════════════ TRAINING GROUND ══════════════════════
export function createTrainingGround(pos, scene, onClick) {
    const root = new BABYLON.TransformNode("training", scene);
    root.position = new BABYLON.Vector3(pos.x, 0, pos.z);

    // Sandy arena disc
    const arena = BABYLON.MeshBuilder.CreateDisc("arena", { radius: 3.6, tessellation: 32 }, scene);
    arena.rotation.x = Math.PI / 2;
    arena.position.y = 0.03;
    arena.material = mat(scene, [0.72, 0.6, 0.4]);
    arena.parent = root;

    // Wooden fence ring
    const posts = 14;
    for (let i = 0; i < posts; i++) {
        const a = (i / posts) * Math.PI * 2;
        const post = BABYLON.MeshBuilder.CreateCylinder("post", { height: 1.1, diameter: 0.12 }, scene);
        post.position = new BABYLON.Vector3(Math.cos(a) * 3.6, 0.55, Math.sin(a) * 3.6);
        post.material = mat(scene, TIMBER);
        post.parent = root;
    }
    // Rails (two heights)
    for (const ry of [0.5, 0.9]) {
        const ring = BABYLON.MeshBuilder.CreateTorus("rail", { diameter: 7.2, thickness: 0.06, tessellation: 48 }, scene);
        ring.position.y = ry;
        ring.material = mat(scene, TIMBER);
        ring.parent = root;
    }

    // Training dummies
    for (let i = 0; i < 3; i++) {
        const a = -0.6 + i * 0.6;
        const dx = Math.cos(a) * 1.6, dz = Math.sin(a) * 1.6;
        const dummy = BABYLON.MeshBuilder.CreateCylinder("dummy", { height: 1.5, diameterTop: 0.14, diameterBottom: 0.2 }, scene);
        dummy.position = new BABYLON.Vector3(dx, 0.75, dz);
        dummy.material = mat(scene, TIMBER);
        dummy.parent = root;
        const arms = BABYLON.MeshBuilder.CreateBox("darms", { width: 1.1, height: 0.1, depth: 0.1 }, scene);
        arms.position = new BABYLON.Vector3(dx, 1.15, dz);
        arms.material = mat(scene, TIMBER);
        arms.parent = root;
        const head = BABYLON.MeshBuilder.CreateSphere("dhead", { diameter: 0.4 }, scene);
        head.position = new BABYLON.Vector3(dx, 1.7, dz);
        head.material = mat(scene, [0.8, 0.68, 0.45]);
        head.parent = root;
    }

    // Target with colored rings
    const target = BABYLON.MeshBuilder.CreateDisc("target", { radius: 0.55, tessellation: 24 }, scene);
    target.position = new BABYLON.Vector3(0, 1.3, -2.8);
    target.material = mat(scene, [0.9, 0.85, 0.75]);
    target.parent = root;
    const bull = BABYLON.MeshBuilder.CreateDisc("bull", { radius: 0.22, tessellation: 20 }, scene);
    bull.position = new BABYLON.Vector3(0, 1.3, -2.79);
    bull.material = mat(scene, [0.75, 0.12, 0.1], { emissive: [0.2, 0.02, 0.02] });
    bull.parent = root;
    const tstand = BABYLON.MeshBuilder.CreateCylinder("tstand", { height: 1.3, diameter: 0.1 }, scene);
    tstand.position = new BABYLON.Vector3(0, 0.65, -2.85);
    tstand.material = mat(scene, TIMBER);
    tstand.parent = root;

    if (onClick) makePickable(root, scene, onClick);
    return root;
}

// ══════════════════════ ARMORY (forge) ══════════════════════
export function createArmory(pos, scene, onClick) {
    const root = new BABYLON.TransformNode("armory", scene);
    root.position = new BABYLON.Vector3(pos.x, 0, pos.z);

    const w = 3.6, h = 2.8, d = 3.2;
    const body = BABYLON.MeshBuilder.CreateBox("aBody", { width: w, height: h, depth: d }, scene);
    body.position.y = h / 2;
    body.material = mat(scene, STONE);
    body.parent = root;

    const roof = pitchedRoof(scene, d + 0.5, w + 0.6, 1.2, ROOF_SLATE);
    roof.rotation.y = Math.PI / 2;
    roof.position.y = h;
    roof.parent = root;

    // Big forge chimney
    const chimney = BABYLON.MeshBuilder.CreateCylinder("chimney", { height: 2.6, diameterTop: 0.5, diameterBottom: 0.7 }, scene);
    chimney.position = new BABYLON.Vector3(w / 2 - 0.5, h + 1.0, -d / 4);
    chimney.material = mat(scene, STONE_DARK);
    chimney.parent = root;

    // Forge glow
    const forgeLight = new BABYLON.PointLight("forgeL", new BABYLON.Vector3(0, 0.9, d / 2 + 0.3), scene);
    forgeLight.diffuse = new BABYLON.Color3(1, 0.5, 0.15);
    forgeLight.intensity = 0.7;
    forgeLight.parent = root;

    // Anvil in front
    const anvil = BABYLON.MeshBuilder.CreateBox("anvil", { width: 0.8, height: 0.4, depth: 0.35 }, scene);
    anvil.position = new BABYLON.Vector3(-1.0, 0.45, d / 2 + 0.8);
    anvil.material = mat(scene, [0.2, 0.2, 0.22]);
    anvil.parent = root;
    const abase = BABYLON.MeshBuilder.CreateCylinder("abase", { height: 0.3, diameter: 0.35 }, scene);
    abase.position = new BABYLON.Vector3(-1.0, 0.15, d / 2 + 0.8);
    abase.material = mat(scene, TIMBER);
    abase.parent = root;

    // Smoke particles
    if (BABYLON.ParticleSystem) {
        const smoke = new BABYLON.ParticleSystem("smoke", 40, scene);
        smoke.particleTexture = new BABYLON.DynamicTexture("smokeTex", 32, scene);
        const ctx = smoke.particleTexture.getContext();
        ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(16, 16, 14, 0, Math.PI * 2); ctx.fill();
        smoke.particleTexture.update();
        smoke.emitter = new BABYLON.Vector3(pos.x + w / 2 - 0.5, h + 2.2, pos.z - d / 4);
        smoke.minEmitBox = new BABYLON.Vector3(-0.1, 0, -0.1);
        smoke.maxEmitBox = new BABYLON.Vector3(0.1, 0, 0.1);
        smoke.color1 = new BABYLON.Color4(0.65, 0.65, 0.65, 0.4);
        smoke.color2 = new BABYLON.Color4(0.4, 0.4, 0.4, 0.15);
        smoke.colorDead = new BABYLON.Color4(0.3, 0.3, 0.3, 0);
        smoke.minSize = 0.4; smoke.maxSize = 1.0;
        smoke.minLifeTime = 0.8; smoke.maxLifeTime = 2.0;
        smoke.emitRate = 12;
        smoke.direction1 = new BABYLON.Vector3(0.3, 1, 0.1);
        smoke.direction2 = new BABYLON.Vector3(-0.2, 1.4, -0.1);
        smoke.start();
    }

    window_(scene, root, -w / 4, h * 0.55, d / 2 + 0.03);

    if (onClick) makePickable(root, scene, onClick);
    return root;
}

// ══════════════════════ SPY HQ (dark tower) ══════════════════════
export function createSpyHQ(pos, scene, onClick) {
    const root = new BABYLON.TransformNode("spyhq", scene);
    root.position = new BABYLON.Vector3(pos.x, 0, pos.z);

    // Slim dark tower
    const tower = BABYLON.MeshBuilder.CreateCylinder("sBody", { height: 4.2, diameterTop: 2.0, diameterBottom: 2.5, tessellation: 8 }, scene);
    tower.position.y = 2.1;
    tower.material = mat(scene, [0.16, 0.13, 0.2]);
    tower.parent = root;

    const roof = coneRoof(scene, 2.9, 1.8, ROOF_SLATE, 8);
    roof.position.y = 4.2 + 0.9;
    roof.parent = root;

    // Purple banner
    banner(scene, root, 0, 5.9, 0, [0.35, 0.15, 0.5], 1.4);

    // Single hooded-lit window
    window_(scene, root, 0, 2.8, 1.16, 0.4, 0.5);
    // Door
    const door = BABYLON.MeshBuilder.CreateBox("sdoor", { width: 0.6, height: 1.1, depth: 0.08 }, scene);
    door.position = new BABYLON.Vector3(0, 0.55, 1.24);
    door.material = mat(scene, [0.08, 0.06, 0.1]);
    door.parent = root;

    if (onClick) makePickable(root, scene, onClick);
    return root;
}

// ── shared pick helper ──
function makePickable(meshOrNode, scene, onClick) {
    const children = meshOrNode.getChildMeshes ? meshOrNode.getChildMeshes() : [];
    const target = children[0] || meshOrNode;
    target.isPickable = true;
    target.actionManager = new BABYLON.ActionManager(scene);
    target.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, onClick));
    target.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
        (meshOrNode.getChildMeshes ? meshOrNode.getChildMeshes() : [meshOrNode]).forEach(m => {
            m.renderOutline = true; m.outlineColor = BABYLON.Color3.Yellow(); m.outlineWidth = 0.03;
        });
    }));
    target.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
        (meshOrNode.getChildMeshes ? meshOrNode.getChildMeshes() : [meshOrNode]).forEach(m => {
            m.renderOutline = false;
        });
    }));
}
