// === Global Variables ===
var scene, camera, renderer, clock, mixer, actions = [], mode, isWireFrame = false;
let loadedModel, soundOpen, soundCrush;

init();

function init() {
    const assetPath = './';
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = null;

    // === Dynamic Paths ===
    const modelPath = window.MODEL_PATH || 'assets/3d_models/pepsi_can_open.glb';
    const openSoundPath = window.SOUND_OPEN_PATH || 'assets/sounds/pepsi_open.mp3';
    const crushSoundPath = window.SOUND_CRUSH_PATH || 'assets/sounds/pepsi_crush.mp3';

    // === Default Camera Settings ===
    let cameraY = 6;
    let cameraZ = 10;
    let targetY = 2;

    if (modelPath.includes("coke")) {
        cameraY = 35;
        cameraZ = 45;
        targetY = 20;
    } else if (modelPath.includes("pepsi")) {
        cameraY = 3;
        cameraZ = 4.5;
        targetY = 1.7;
    }

    // === Camera Setup ===
    camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.set(0, cameraY, cameraZ);

    // === Lighting Setup ===
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight1.position.set(5, 10, 7);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight2.position.set(-5, 10, -7);
    scene.add(directionalLight2);

    const directionalLightTop = new THREE.DirectionalLight(0xffffff, 1);
    directionalLightTop.position.set(0, 20, 0);
    scene.add(directionalLightTop);

    const directionalLightFront = new THREE.DirectionalLight(0xffffff, 1);
    directionalLightFront.position.set(0, 5, 15);
    scene.add(directionalLightFront);

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

    // Load Opening Sound
    audioLoader.load(openSoundPath, function(buffer) {
        soundOpen = new THREE.Audio(listener);
        soundOpen.setBuffer(buffer);
        soundOpen.setLoop(false);
        soundOpen.setVolume(1.0);
    });

    // Load Crushing Sound
    audioLoader.load(crushSoundPath, function(buffer) {
        soundCrush = new THREE.Audio(listener);
        soundCrush.setBuffer(buffer);
        soundCrush.setLoop(false);
        soundCrush.setVolume(1.0);
    });

    // === Button Event Listeners ===

    // Play Button: Play Animation + Open Sound
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

        // Play opening sound safely
        if (soundOpen) {
            if (soundOpen.isPlaying) soundOpen.stop();
            soundOpen.play();
        }
    });

    // Wireframe Toggle Button
    document.getElementById("btnWireframe").addEventListener("click", () => {
        isWireFrame = !isWireFrame;
        togglerWireframe(isWireFrame);
    });

    // Rotate Button
    document.getElementById("btnRotate").addEventListener("click", () => {
        if (loadedModel) {
            const axis = new THREE.Vector3(0, 1, 0);
            const angle = Math.PI / 8;
            loadedModel.rotateOnAxis(axis, angle);
        } else {
            console.warn("Model not loaded yet!");
        }
    });

    // Recycle Button: Play Animation + Crush Sound
    document.getElementById("btnRecycle").addEventListener("click", () => {
        if (actions.length > 0) {
            actions.forEach(action => {
                action.reset();
                action.setLoop(THREE.LoopOnce);
                action.clampWhenFinished = true;
                action.timeScale = 1;
                action.play();
            });
        }

        // Play crushing sound safely
        if (soundCrush) {
            if (soundCrush.isPlaying) soundCrush.stop();
            soundCrush.play();
        }
    });

    // === Model Loader ===
    const loader = new THREE.GLTFLoader();
    loader.load(modelPath, function(gltf) {
        const model = gltf.scene;
        model.scale.set(2, 2, 2);
        scene.add(model);

        loadedModel = model;
        mixer = new THREE.AnimationMixer(model);

        gltf.animations.forEach(clip => {
            const action = mixer.clipAction(clip);
            actions.push(action);
        });
    });

    // === Window Resize Listener ===
    window.addEventListener("resize", resize, false);

    // === Start Animation Loop ===
    animate();
}

// === Wireframe Toggle Function ===
function togglerWireframe(enable) {
    scene.traverse(object => {
        if (object.isMesh) {
            object.material.wireframe = enable;
        }
    });
}

// === Animation Loop ===
function animate() {
    requestAnimationFrame(animate);
    if (mixer) mixer.update(clock.getDelta());
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
