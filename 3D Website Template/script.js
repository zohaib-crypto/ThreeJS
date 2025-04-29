// === Global Variables ===
var scene, camera, renderer, clock;
var mixer, recycleMixer;                  // Two separate mixers for original and recycled models
var actions = [], recycleActions = [];    // Two separate action arrays
var loadedModel, recycleModel;             // Two separate loaded models
let soundOpen, soundCrush;                // Sounds for open and crush animations

// Initialize everything
init();

function init() {
    const assetPath = './';
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = null;

    // === Dynamic Paths ===
    const modelPath = window.MODEL_PATH || 'assets/3d_models/pepsi_can_open.glb';
    const openSoundPath = window.SOUND_OPEN_PATH || 'assets/sounds/pepsi_open.wav';
    const crushSoundPath = window.SOUND_CRUSH_PATH || 'assets/sounds/pepsi_crush.wav';

    // === Camera Setup ===
    let cameraY = 6, cameraZ = 10, targetY = 2;
    if (modelPath.includes("coke")) {
        cameraY = 35; cameraZ = 45; targetY = 20;
    } else if (modelPath.includes("pepsi")) {
        cameraY = 3; cameraZ = 4.5; targetY = 1.7;
    }

    camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.set(0, cameraY, cameraZ);

    // === Lighting Setup ===
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);

    const lights = [
        new THREE.DirectionalLight(0xffffff, 1.5),
        new THREE.DirectionalLight(0xffffff, 1.2),
        new THREE.DirectionalLight(0xffffff, 1),
        new THREE.DirectionalLight(0xffffff, 1)
    ];
    lights[0].position.set(5, 10, 7);
    lights[1].position.set(-5, 10, -7);
    lights[2].position.set(0, 20, 0);
    lights[3].position.set(0, 5, 15);
    lights.forEach(light => scene.add(light));

    // === Renderer Setup ===
    const container = document.getElementById("threeContainer");
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    resize();
    container.appendChild(renderer.domElement);

    // === Orbit Controls ===
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, targetY, 0);
    controls.update();

    // === Audio Setup ===
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(openSoundPath, function(buffer) {
        soundOpen = new THREE.Audio(listener);
        soundOpen.setBuffer(buffer);
        soundOpen.setLoop(false);
        soundOpen.setVolume(1.0);
    });

    audioLoader.load(crushSoundPath, function(buffer) {
        soundCrush = new THREE.Audio(listener);
        soundCrush.setBuffer(buffer);
        soundCrush.setLoop(false);
        soundCrush.setVolume(1.0);
    });

    // === Load Initial Model (Pepsi Can Open) ===
    const loader = new THREE.GLTFLoader();
    loader.load(modelPath, function(gltf) {
        loadedModel = gltf.scene;
        loadedModel.scale.set(2, 2, 2);
        scene.add(loadedModel);

        mixer = new THREE.AnimationMixer(loadedModel);
        gltf.animations.forEach(clip => {
            const action = mixer.clipAction(clip);
            actions.push(action);
        });
    });

    // === Button Event Listeners ===

    // Play Button: Play Open Animation
    document.getElementById("btn").addEventListener("click", () => {
        if (actions.length > 0) {
            actions.forEach(action => {
                action.reset();
                action.setLoop(THREE.LoopOnce);
                action.clampWhenFinished = true;
                action.timeScale = 1;
                action.play();
            });
        }
        if (soundOpen) {
            if (soundOpen.isPlaying) soundOpen.stop();
            soundOpen.play();
        }
    });

    // Wireframe Toggle Button
    document.getElementById("btnWireframe").addEventListener("click", () => {
        togglerWireframe();
    });

    // Rotate Button
    document.getElementById("btnRotate").addEventListener("click", () => {
        if (loadedModel) {
            const axis = new THREE.Vector3(0, 1, 0);
            const angle = Math.PI / 8;
            loadedModel.rotateOnAxis(axis, angle);
        }
    });

    // Recycle Button: Load Recycle Model and Play Animation
   // Recycle Button: Load Recycle Model and Play Crush Sound
document.getElementById("btnRecycle").addEventListener("click", () => {
    if (loadedModel) scene.remove(loadedModel); // Remove the original model
    if (recycleModel) scene.remove(recycleModel); // Remove old recycle model if exists

    const loaderRecycle = new THREE.GLTFLoader();
    loaderRecycle.load('assets/3d_models/pepsi_recycle.glb', function (gltf) {
        recycleModel = gltf.scene;
        recycleModel.scale.set(2, 2, 2);
        scene.add(recycleModel);

        recycleMixer = new THREE.AnimationMixer(recycleModel);
        recycleActions = [];

        gltf.animations.forEach(clip => {
            const action = recycleMixer.clipAction(clip);
            recycleActions.push(action);
        });

        // 💥 After model is fully loaded, THEN play animation + sound
        if (recycleActions.length > 0) {
            recycleActions.forEach(action => {
                action.reset();
                action.setLoop(THREE.LoopOnce);
                action.clampWhenFinished = true;
                action.timeScale = 1;
                action.play();
            });
        }

        // ✅ Play crushing sound AFTER model and animation are ready
        setTimeout(() => {
            if (soundCrush) {
                if (soundCrush.isPlaying) soundCrush.stop();
                soundCrush.play();
            }
        }, 100); // small delay to sync nicely
    });
});


    window.addEventListener("resize", resize, false);
    animate();
}

// === Toggle Wireframe Mode for All Meshes ===
function togglerWireframe() {
    scene.traverse(object => {
        if (object.isMesh) {
            object.material.wireframe = !object.material.wireframe;
        }
    });
}

// === Animation Loop ===
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (mixer) mixer.update(delta);           // Update initial model animations
    if (recycleMixer) recycleMixer.update(delta); // Update recycle model animations

    renderer.render(scene, camera);
}

// === Handle Window Resize ===
function resize() {
    const container = document.getElementById("threeContainer");
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}
