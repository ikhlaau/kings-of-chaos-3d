/** Lush medieval environment — painterly terrain, forests, clouds, props. */

function mat(scene, rgb, opts = {}) {
    const m = new BABYLON.StandardMaterial("em", scene);
    m.diffuseColor = new BABYLON.Color3(...rgb);
    m.specularColor = BABYLON.Color3.Black();
    if (opts.alpha !== undefined) m.alpha = opts.alpha;
    if (opts.emissive) m.emissiveColor = new BABYLON.Color3(...opts.emissive);
    return m;
}

// ── Painterly grass ground (DynamicTexture with organic patches) ──
export function createGround(scene, size = 100) {
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: size, height: size, subdivisions: 4 }, scene);
    const m = new BABYLON.StandardMaterial("gMat", scene);
    m.specularColor = BABYLON.Color3.Black();

    const tex = new BABYLON.DynamicTexture("gTex", 512, scene, true);
    const ctx = tex.getContext();

    // Base grass
    ctx.fillStyle = "#3f7a26";
    ctx.fillRect(0, 0, 512, 512);

    // Organic patches — lighter meadow + darker moss
    for (let i = 0; i < 260; i++) {
        const x = Math.random() * 512, y = Math.random() * 512;
        const r = 6 + Math.random() * 26;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const light = Math.random() < 0.5;
        g.addColorStop(0, light ? "rgba(110,160,60,0.35)" : "rgba(40,80,25,0.35)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    // Speckles (grass detail)
    for (let i = 0; i < 2500; i++) {
        const x = Math.random() * 512, y = Math.random() * 512;
        ctx.fillStyle = Math.random() < 0.5 ? "rgba(140,190,80,0.25)" : "rgba(30,70,20,0.25)";
        ctx.fillRect(x, y, 2, 2 + Math.random() * 3);
    }
    tex.update();
    tex.hasAlpha = false;
    m.diffuseTexture = tex;
    ground.material = m;
    ground.receiveShadows = true;
    return ground;
}

/** Sandy cobble path strip. */
export function createPath(scene, from, to, width = 1.6) {
    const dx = to.x - from.x, dz = to.z - from.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    const path = BABYLON.MeshBuilder.CreateGround("path", { width, height: len }, scene);
    path.position = new BABYLON.Vector3((from.x + to.x) / 2, 0.04, (from.z + to.z) / 2);
    path.rotation.y = Math.atan2(dx, dz);

    const m = new BABYLON.StandardMaterial("pMat", scene);
    m.specularColor = BABYLON.Color3.Black();
    const tex = new BABYLON.DynamicTexture("pTex", 128, scene, true);
    const ctx = tex.getContext();
    ctx.fillStyle = "#b39b6d";
    ctx.fillRect(0, 0, 128, 128);
    // cobble speckle
    for (let i = 0; i < 300; i++) {
        const x = Math.random() * 128, y = Math.random() * 128;
        ctx.fillStyle = Math.random() < 0.5 ? "rgba(90,75,50,0.5)" : "rgba(200,180,140,0.5)";
        ctx.beginPath(); ctx.arc(x, y, 1.5 + Math.random() * 2.5, 0, Math.PI * 2); ctx.fill();
    }
    tex.update();
    m.diffuseTexture = tex;
    path.material = m;
    return path;
}

/** Circular plaza (cobble). */
export function createPlaza(scene, x, z, radius = 4) {
    const disc = BABYLON.MeshBuilder.CreateDisc("plaza", { radius, tessellation: 40 }, scene);
    disc.rotation.x = Math.PI / 2;
    disc.position = new BABYLON.Vector3(x, 0.045, z);
    const m = new BABYLON.StandardMaterial("plMat", scene);
    m.specularColor = BABYLON.Color3.Black();
    const tex = new BABYLON.DynamicTexture("plTex", 256, scene, true);
    const ctx = tex.getContext();
    ctx.fillStyle = "#a8906a";
    ctx.fillRect(0, 0, 256, 256);
    // concentric cobble rings
    for (let r = 20; r < 130; r += 18) {
        ctx.strokeStyle = "rgba(80,65,45,0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(128, 128, r, 0, Math.PI * 2); ctx.stroke();
    }
    for (let i = 0; i < 400; i++) {
        const x = Math.random() * 256, y = Math.random() * 256;
        ctx.fillStyle = "rgba(200,180,140,0.35)";
        ctx.fillRect(x, y, 2, 2);
    }
    tex.update();
    m.diffuseTexture = tex;
    disc.material = m;
    return disc;
}

// ── Trees ──

/** Pine: trunk + stacked cones (reads well at distance). */
export function createPine(scene, x, z, scale = 1) {
    const root = new BABYLON.TransformNode("pine", scene);
    root.position = new BABYLON.Vector3(x, 0, z);
    const trunkH = 1.0 * scale;
    const trunk = BABYLON.MeshBuilder.CreateCylinder("tr", { height: trunkH, diameter: 0.22 * scale }, scene);
    trunk.position.y = trunkH / 2;
    trunk.material = mat(scene, [0.32, 0.2, 0.1]);
    trunk.parent = root;

    const greens = [[0.08, 0.32, 0.1], [0.1, 0.38, 0.12], [0.12, 0.42, 0.14]];
    for (let i = 0; i < 3; i++) {
        const d = (1.6 - i * 0.4) * scale;
        const cone = BABYLON.MeshBuilder.CreateCylinder("c", { height: 0.9 * scale, diameterTop: 0, diameterBottom: d }, scene);
        cone.position.y = trunkH + (0.4 + i * 0.55) * scale;
        cone.material = mat(scene, greens[i % greens.length]);
        cone.parent = root;
    }
    return root;
}

/** Broadleaf: trunk + foliage blobs. */
export function createBroadleaf(scene, x, z, scale = 1) {
    const root = new BABYLON.TransformNode("leaf", scene);
    root.position = new BABYLON.Vector3(x, 0, z);
    const trunkH = 1.3 * scale;
    const trunk = BABYLON.MeshBuilder.CreateCylinder("tr", { height: trunkH, diameterTop: 0.16 * scale, diameterBottom: 0.24 * scale }, scene);
    trunk.position.y = trunkH / 2;
    trunk.material = mat(scene, [0.35, 0.24, 0.12]);
    trunk.parent = root;

    const blobs = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < blobs; i++) {
        const d = (0.9 + Math.random() * 0.5) * scale;
        const s = BABYLON.MeshBuilder.CreateSphere("b", { diameter: d, segments: 6 }, scene);
        const a = (i / blobs) * Math.PI * 2;
        s.position = new BABYLON.Vector3(
            Math.cos(a) * 0.35 * scale,
            trunkH + 0.4 * scale + Math.random() * 0.3 * scale,
            Math.sin(a) * 0.35 * scale
        );
        const g = 0.35 + Math.random() * 0.25;
        s.material = mat(scene, [0.12 + Math.random() * 0.1, g, 0.08]);
        s.parent = root;
    }
    return root;
}

/** Scatter a mixed forest ring + clusters, avoiding a central clear zone. */
export function createForest(scene, opts = {}) {
    const {
        count = 90,
        innerR = 18,        // keep clear inside the kingdom walls
        outerR = 46,
        clearings = [],     // [{x,z,r}] extra clear zones
    } = opts;
    const trees = [];
    let placed = 0, guard = 0;
    while (placed < count && guard++ < count * 20) {
        const a = Math.random() * Math.PI * 2;
        const d = innerR + Math.random() * (outerR - innerR);
        const x = Math.cos(a) * d, z = Math.sin(a) * d;
        if (clearings.some(c => Math.hypot(x - c.x, z - c.z) < c.r)) continue;
        const scale = 0.8 + Math.random() * 0.7;
        const t = Math.random() < 0.55
            ? createPine(scene, x, z, scale)
            : createBroadleaf(scene, x, z, scale);
        trees.push(t);
        placed++;
    }
    return trees;
}

// ── Props ──

export function createRocks(scene, count = 14, innerR = 19, outerR = 42) {
    const rocks = [];
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = innerR + Math.random() * (outerR - innerR);
        const r = BABYLON.MeshBuilder.CreateSphere("rock", { diameter: 0.4 + Math.random() * 0.8, segments: 5 }, scene);
        r.position = new BABYLON.Vector3(Math.cos(a) * d, 0.15, Math.sin(a) * d);
        r.scaling.y = 0.6;
        const g = 0.5 + Math.random() * 0.15;
        r.material = mat(scene, [g, g * 0.97, g * 0.92]);
        rocks.push(r);
    }
    return rocks;
}

export function createFlowers(scene, count = 40, innerR = 17, outerR = 30) {
    const colors = [[0.9, 0.3, 0.3], [0.95, 0.85, 0.3], [0.85, 0.5, 0.85], [0.95, 0.95, 0.9]];
    const flowers = [];
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = innerR + Math.random() * (outerR - innerR);
        const f = BABYLON.MeshBuilder.CreateSphere("fl", { diameter: 0.16, segments: 4 }, scene);
        f.position = new BABYLON.Vector3(Math.cos(a) * d, 0.1, Math.sin(a) * d);
        f.material = mat(scene, colors[i % colors.length], { emissive: [0.08, 0.06, 0.06] });
        flowers.push(f);
    }
    return flowers;
}

// ── Sky & clouds ──

export function createSky(scene) {
    scene.clearColor = new BABYLON.Color4(0.52, 0.68, 0.92, 1);
    scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
    scene.fogColor = new BABYLON.Color3(0.62, 0.74, 0.9);
    scene.fogStart = 75;
    scene.fogEnd = 150;
}

/** Puffy drifting clouds — kept high above the camera's view cone. */
export function createClouds(scene, count = 7) {
    const clouds = [];
    for (let i = 0; i < count; i++) {
        const root = new BABYLON.TransformNode("cloud", scene);
        const a = Math.random() * Math.PI * 2;
        const d = 35 + Math.random() * 40;
        root.position = new BABYLON.Vector3(Math.cos(a) * d, 38 + Math.random() * 12, Math.sin(a) * d);

        const puffN = 2 + Math.floor(Math.random() * 3);
        for (let p = 0; p < puffN; p++) {
            const puff = BABYLON.MeshBuilder.CreateSphere("puff", { diameter: 2.5 + Math.random() * 2.5, segments: 6 }, scene);
            puff.position = new BABYLON.Vector3((p - puffN / 2) * 2.2, Math.random() * 0.7, Math.random() * 1.4);
            puff.scaling.y = 0.5;
            puff.material = mat(scene, [0.98, 0.98, 1.0], { alpha: 0.55 });
            puff.parent = root;
        }
        clouds.push(root);
    }
    // Slow drift
    scene.onBeforeRenderObservable.add(() => {
        const dt = scene.getEngine().getDeltaTime() / 1000;
        for (const c of clouds) {
            c.position.x += dt * 0.6;
            if (c.position.x > 85) c.position.x = -85;
        }
    });
    return clouds;
}

// ── Lighting ──
export function createLights(scene) {
    const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 0.55;
    hemi.groundColor = new BABYLON.Color3(0.4, 0.45, 0.3);

    const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-0.5, -0.8, 0.35), scene);
    sun.intensity = 0.95;
    sun.diffuse = new BABYLON.Color3(1, 0.96, 0.88);
    sun.position = new BABYLON.Vector3(40, 60, -30);
    return { hemi, sun };
}
