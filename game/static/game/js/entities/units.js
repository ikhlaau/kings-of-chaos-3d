/** Procedural unit meshes — soldiers, citizens. */

/**
 * Create a simple soldier mesh (box body + sphere head + cylinder limbs).
 */
export function createSoldier(color, position, scene) {
    const root = new BABYLON.TransformNode("soldier", scene);
    root.position = position.clone();

    const mat = new BABYLON.StandardMaterial("solMat", scene);
    mat.diffuseColor = color;

    // Body
    const body = BABYLON.MeshBuilder.CreateBox("body",
        { width: 0.35, height: 0.7, depth: 0.25 }, scene);
    body.position.y = 0.75;
    body.parent = root;
    body.material = mat;

    // Head
    const head = BABYLON.MeshBuilder.CreateSphere("head",
        { diameter: 0.3 }, scene);
    head.position.y = 1.25;
    head.parent = root;
    const hMat = new BABYLON.StandardMaterial("headMat", scene);
    hMat.diffuseColor = new BABYLON.Color3(0.9, 0.75, 0.6);
    head.material = hMat;

    // Arms
    for (let side of [-1, 1]) {
        const arm = BABYLON.MeshBuilder.CreateCylinder("arm",
            { height: 0.5, diameter: 0.1 }, scene);
        arm.position = new BABYLON.Vector3(side * 0.25, 0.95, 0);
        arm.parent = root;
        arm.material = mat;
    }

    // Legs
    for (let side of [-1, 1]) {
        const leg = BABYLON.MeshBuilder.CreateCylinder("leg",
            { height: 0.5, diameter: 0.12 }, scene);
        leg.position = new BABYLON.Vector3(side * 0.1, 0.25, 0);
        leg.parent = root;
        leg.material = mat;
    }

    return root;
}

/**
 * Create a simple citizen mesh (robe-like).
 */
export function createCitizen(position, scene) {
    const root = new BABYLON.TransformNode("citizen", scene);
    root.position = position.clone();

    const mat = new BABYLON.StandardMaterial("citMat", scene);
    mat.diffuseColor = new BABYLON.Color3(0.3, 0.5, 0.3);

    const body = BABYLON.MeshBuilder.CreateCylinder("cBody",
        { height: 0.8, diameterTop: 0.2, diameterBottom: 0.35 }, scene);
    body.position.y = 0.4;
    body.parent = root;
    body.material = mat;

    const head = BABYLON.MeshBuilder.CreateSphere("cHead",
        { diameter: 0.25 }, scene);
    head.position.y = 0.95;
    head.parent = root;
    const hMat = new BABYLON.StandardMaterial("cHeadMat", scene);
    hMat.diffuseColor = new BABYLON.Color3(0.9, 0.75, 0.6);
    head.material = hMat;

    return root;
}

/**
 * Create a formation of soldiers at a start position.
 */
export function createFormation(count, color, startPos, spacing, scene) {
    const units = [];
    const cols = Math.ceil(Math.sqrt(count));
    for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const pos = new BABYLON.Vector3(
            startPos.x + (col - cols / 2) * spacing,
            0,
            startPos.z + row * spacing
        );
        units.push(createSoldier(color, pos, scene));
    }
    return units;
}
