/** Procedural building meshes for the kingdom scene. */

/**
 * Create a castle keep with turrets. Height scales with gold.
 */
export function createCastle(position, player, scene) {
    const goldScale = Math.log10(player.gold + 1) * 2;
    const height = 3 + goldScale;
    const root = new BABYLON.TransformNode("castle", scene);
    root.position = new BABYLON.Vector3(position.x, 0, position.z);

    // Keep
    const keep = BABYLON.MeshBuilder.CreateBox("keep",
        { width: 3, height, depth: 3 }, scene);
    keep.position.y = height / 2;
    keep.parent = root;
    const keepMat = new BABYLON.StandardMaterial("keepMat", scene);
    keepMat.diffuseColor = new BABYLON.Color3(0.65, 0.55, 0.42);
    keep.material = keepMat;

    // Turrets
    for (let cx of [-1.3, 1.3]) {
        for (let cz of [-1.3, 1.3]) {
            const turret = BABYLON.MeshBuilder.CreateCylinder("turret",
                { height: height * 0.65, diameterTop: 0.3, diameterBottom: 0.6 }, scene);
            turret.position = new BABYLON.Vector3(cx, height * 0.35, cz);
            turret.parent = root;
            const tMat = new BABYLON.StandardMaterial("turretMat", scene);
            tMat.diffuseColor = new BABYLON.Color3(0.55, 0.45, 0.35);
            turret.material = tMat;
        }
    }

    // Roof
    const roof = BABYLON.MeshBuilder.CreateCylinder("roof",
        { height: 1.5, diameterTop: 0, diameterBottom: 3.5 }, scene);
    roof.position.y = height + 0.75;
    roof.parent = root;
    const roofMat = new BABYLON.StandardMaterial("roofMat", scene);
    roofMat.diffuseColor = new BABYLON.Color3(0.4, 0.15, 0.15);
    roof.material = roofMat;

    root.isPickable = true;
    return root;
}

/**
 * Barracks — long red building. Width scales with army count.
 */
export function createBarracks(position, armyCount, scene) {
    const scale = Math.log10(armyCount + 1) * 1.5;
    const w = 4 + scale;
    const h = 2.5;
    const d = 3;

    const root = new BABYLON.TransformNode("barracks", scene);
    root.position = new BABYLON.Vector3(position.x, 0, position.z);

    const body = BABYLON.MeshBuilder.CreateBox("bBody",
        { width: w, height: h, depth: d }, scene);
    body.position.y = h / 2;
    body.parent = root;
    const mat = new BABYLON.StandardMaterial("bMat", scene);
    mat.diffuseColor = new BABYLON.Color3(0.7, 0.15, 0.1);
    body.material = mat;

    // Roof
    const roof = BABYLON.MeshBuilder.CreateCylinder("bRoof",
        { height: 1, diameterTop: 0, diameterBottom: w + 0.5 }, scene);
    roof.rotation.z = Math.PI / 2;
    roof.position.y = h + 0.5;
    roof.parent = root;
    const rMat = new BABYLON.StandardMaterial("bRoofMat", scene);
    rMat.diffuseColor = new BABYLON.Color3(0.5, 0.1, 0.05);
    roof.material = rMat;

    root.isPickable = true;
    return root;
}

/**
 * Training ground — open area with training dummies.
 */
export function createTrainingGround(position, scene) {
    const root = new BABYLON.TransformNode("training", scene);
    root.position = new BABYLON.Vector3(position.x, 0, position.z);

    // Ground marker (flat platform)
    const floor = BABYLON.MeshBuilder.CreateBox("tgFloor",
        { width: 6, height: 0.1, depth: 6 }, scene);
    floor.position.y = 0.05;
    floor.parent = root;
    const fMat = new BABYLON.StandardMaterial("tgMat", scene);
    fMat.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.1);
    floor.material = fMat;

    // Fence posts
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const post = BABYLON.MeshBuilder.CreateCylinder("fence",
            { height: 1.5, diameter: 0.1 }, scene);
        post.position = new BABYLON.Vector3(
            Math.cos(angle) * 3, 0.75, Math.sin(angle) * 3
        );
        post.parent = root;
        const pMat = new BABYLON.StandardMaterial("postMat", scene);
        pMat.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2);
        post.material = pMat;
    }

    // Training dummies
    for (let i = 0; i < 4; i++) {
        const dummy = BABYLON.MeshBuilder.CreateCylinder("dummy",
            { height: 2, diameter: 0.2 }, scene);
        dummy.position = new BABYLON.Vector3(-1.5 + i, 1, 0);
        dummy.parent = root;
        const dMat = new BABYLON.StandardMaterial("dMat", scene);
        dMat.diffuseColor = new BABYLON.Color3(0.5, 0.4, 0.3);
        dummy.material = dMat;

        const dHead = BABYLON.MeshBuilder.CreateSphere("dHead",
            { diameter: 0.4 }, scene);
        dHead.position = new BABYLON.Vector3(-1.5 + i, 2.2, 0);
        dHead.parent = root;
        dHead.material = dMat;
    }

    root.isPickable = true;
    return root;
}

/**
 * Armory — stone forge building.
 */
export function createArmory(position, scene) {
    const root = new BABYLON.TransformNode("armory", scene);
    root.position = new BABYLON.Vector3(position.x, 0, position.z);

    const body = BABYLON.MeshBuilder.CreateBox("aBody",
        { width: 3.5, height: 2.5, depth: 3 }, scene);
    body.position.y = 1.25;
    body.parent = root;
    const mat = new BABYLON.StandardMaterial("aMat", scene);
    mat.diffuseColor = new BABYLON.Color3(0.45, 0.45, 0.5);
    body.material = mat;

    // Chimney
    const chimney = BABYLON.MeshBuilder.CreateBox("chimney",
        { width: 0.4, height: 1.5, depth: 0.4 }, scene);
    chimney.position = new BABYLON.Vector3(1, 3.25, 1);
    chimney.parent = root;
    chimney.material = mat;

    root.isPickable = true;
    return root;
}

/**
 * Spy HQ — dark, small building.
 */
export function createSpyHQ(position, scene) {
    const root = new BABYLON.TransformNode("spyhq", scene);
    root.position = new BABYLON.Vector3(position.x, 0, position.z);

    const body = BABYLON.MeshBuilder.CreateBox("sBody",
        { width: 2.5, height: 2, depth: 2.5 }, scene);
    body.position.y = 1;
    body.parent = root;
    const mat = new BABYLON.StandardMaterial("sMat", scene);
    mat.diffuseColor = new BABYLON.Color3(0.15, 0.12, 0.2);
    body.material = mat;

    const roof = BABYLON.MeshBuilder.CreateCylinder("sRoof",
        { height: 1, diameterTop: 0, diameterBottom: 3 }, scene);
    roof.position.y = 2.5;
    roof.parent = root;
    const rMat = new BABYLON.StandardMaterial("sRoofMat", scene);
    rMat.diffuseColor = new BABYLON.Color3(0.1, 0.08, 0.15);
    roof.material = rMat;

    root.isPickable = true;
    return root;
}
