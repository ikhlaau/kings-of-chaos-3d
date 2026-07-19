/** Terrain, sky, trees, weather. */

export function createTerrain(scene) {
    // Ground plane
    const ground = BABYLON.MeshBuilder.CreateGround("ground",
        { width: 60, height: 60 }, scene);
    const gMat = new BABYLON.StandardMaterial("groundMat", scene);
    gMat.diffuseColor = new BABYLON.Color3(0.18, 0.45, 0.12);
    ground.material = gMat;
    ground.receiveShadows = true;

    // Path from castle center outward
    const path = BABYLON.MeshBuilder.CreateGround("path",
        { width: 1.5, height: 20 }, scene);
    path.position = new BABYLON.Vector3(0, 0.02, -5);
    const pMat = new BABYLON.StandardMaterial("pathMat", scene);
    pMat.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2);
    path.material = pMat;

    return ground;
}

export function createTrees(scene) {
    const treePositions = [];
    // Generate trees around the perimeter
    for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
        const dist = 20 + Math.random() * 8;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
        treePositions.push({ x, z });
    }
    for (let i = 0; i < 20; i++) {
        treePositions.push({
            x: (Math.random() - 0.5) * 50,
            z: (Math.random() - 0.5) * 50,
        });
    }

    const trees = [];
    for (const pos of treePositions) {
        const tree = createTree(new BABYLON.Vector3(pos.x, 0, pos.z), scene);
        trees.push(tree);
    }
    return trees;
}

function createTree(position, scene) {
    const root = new BABYLON.TransformNode("tree", scene);
    root.position = position;

    const trunkH = 1.5 + Math.random() * 1;
    const trunk = BABYLON.MeshBuilder.CreateCylinder("trunk",
        { height: trunkH, diameter: 0.2 }, scene);
    trunk.position.y = trunkH / 2;
    trunk.parent = root;
    const tMat = new BABYLON.StandardMaterial("trunkMat", scene);
    tMat.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.1);
    trunk.material = tMat;

    // Foliage (2-3 spheres)
    const levels = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < levels; i++) {
        const size = 1.2 - i * 0.3;
        const foliage = BABYLON.MeshBuilder.CreateSphere("leaf",
            { diameter: size }, scene);
        foliage.position.y = trunkH + i * 0.6;
        foliage.parent = root;
        const fMat = new BABYLON.StandardMaterial("leafMat", scene);
        fMat.diffuseColor = new BABYLON.Color3(
            0.1 + Math.random() * 0.2,
            0.3 + Math.random() * 0.4,
            0.05 + Math.random() * 0.1
        );
        foliage.material = fMat;
    }

    return root;
}

export function createSky(scene) {
    scene.clearColor = new BABYLON.Color4(0.35, 0.55, 0.85, 1);
    scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
    scene.fogColor = new BABYLON.Color3(0.35, 0.55, 0.85);
    scene.fogStart = 30;
    scene.fogEnd = 70;
}
