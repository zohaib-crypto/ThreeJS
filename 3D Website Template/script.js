// === Global Variables ===
var scene, camera, renderer, clock;
var mixer, recycleMixer;                  
var actions = [], recycleActions = [];    
var loadedModel, recycleModel;           
let soundOpen, soundCrush;                

// === Start the setup ===
init();

function init() {
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = null;

    // === Load dynamic model and audio paths from HTML (set using <script>) ===
    const modelPath = window.MODEL_PATH || 'assets/3d_models/pepsi_can_open.glb';
    const recycleModelPath = window.RECYCLE_MODEL_PATH || 'assets/3d_models/pepsi_recycle.glb';
    const openSoundPath = window.SOUND_OPEN_PATH || 'assets/sounds/pepsi_open.wav';
    const crushSoundPath = window.SOUND_CRUSH_PATH || 'assets/sounds/pepsi_crush.wav';

    // === Camera Setup (based on model type) ===
    let cameraY = 6, cameraZ = 10, targetY = 2;
    if (modelPath.includes("coke")) {
        cameraY = 35; cameraZ = 45; targetY = 20;
    } else if (modelPath.includes("pepsi")) {
        cameraY = 3; cameraZ = 4.5; targetY = 1.7;
    } else if (modelPath.includes("lays")) {
        cameraY = 5; cameraZ = 6; targetY = 2.5;
    }

    const container = document.getElementById("threeContainer");
    const aspectRatio = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(60, aspectRatio, 0.1, 1000);
    camera.position.set(0, cameraY, cameraZ);

// === Lighting Setup ===
let ambientIntensity = 2;
let dirIntensity = 1.5;

if (modelPath.includes("lays")) {
    ambientIntensity = 0.5;  // softer ambient light
    dirIntensity = 0.36;      // tone down directional brightness
}

scene.add(new THREE.AmbientLight(0xffffff, ambientIntensity));

const lights = [
    new THREE.DirectionalLight(0xffffff, dirIntensity),
    new THREE.DirectionalLight(0xffffff, dirIntensity * 0.8),
    new THREE.DirectionalLight(0xffffff, dirIntensity * 0.6),
    new THREE.DirectionalLight(0xffffff, dirIntensity * 0.6)
];

lights[0].position.set(5, 10, 7);
lights[1].position.set(-5, 10, -7);
lights[2].position.set(0, 20, 0);
lights[3].position.set(0, 5, 15);
lights.forEach(light => scene.add(light));


    // === Renderer Setup ===
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // === Orbit Controls ===
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, targetY, 0);
    controls.update();

    // === Audio Setup ===
    const listener = new THREE.AudioListener();
    camera.add(listener);
    const audioLoader = new THREE.AudioLoader();

    audioLoader.load(openSoundPath, (buffer) => {
        soundOpen = new THREE.Audio(listener);
        soundOpen.setBuffer(buffer);
        soundOpen.setLoop(false);
        soundOpen.setVolume(1.0);
    });

    audioLoader.load(crushSoundPath, (buffer) => {
        soundCrush = new THREE.Audio(listener);
        soundCrush.setBuffer(buffer);
        soundCrush.setLoop(false);
        soundCrush.setVolume(1.0);
    });

    // === Load Main Model ===
    const loader = new THREE.GLTFLoader();
    loader.load(modelPath, (gltf) => {
        loadedModel = gltf.scene;
        loadedModel.scale.set(2, 2, 2);
        scene.add(loadedModel);

        mixer = new THREE.AnimationMixer(loadedModel);
        gltf.animations.forEach(clip => {
            const action = mixer.clipAction(clip);
            actions.push(action);
        });
    });

    // === Button Listeners ===
    document.getElementById("btn").addEventListener("click", () => {
        if (recycleModel) {
            scene.remove(recycleModel);
            recycleModel = null;
            recycleMixer = null;
        }

        if (!scene.children.includes(loadedModel)) {
            scene.add(loadedModel);
        }

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

    document.getElementById("btnWireframe").addEventListener("click", () => {
        scene.traverse(object => {
            if (object.isMesh) {
                object.material.wireframe = !object.material.wireframe;
            }
        });
    });

    document.getElementById("btnRotate").addEventListener("click", () => {
        if (loadedModel) {
            const axis = new THREE.Vector3(0, 1, 0);
            const angle = Math.PI / 8;
            loadedModel.rotateOnAxis(axis, angle);
        }
    });
// === Pack Button: Load Pack Model Animation ===
document.getElementById("btn").addEventListener("click", () => {
    if (loadedModel) scene.remove(loadedModel);  // Remove existing
    if (recycleModel) scene.remove(recycleModel); // Just in case

    const loader = new THREE.GLTFLoader();
    loader.load(window.PACK_MODEL_PATH, function (gltf) {
        loadedModel = gltf.scene;
        loadedModel.scale.set(2, 2, 2);
        scene.add(loadedModel);

        mixer = new THREE.AnimationMixer(loadedModel);
        actions = [];

        gltf.animations.forEach(clip => {
            const action = mixer.clipAction(clip);
            action.reset();
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            action.timeScale = 1;
            action.play();
            actions.push(action);
        });
    });
});

    // === Recycle Button ===
    const recycleBtn = document.getElementById("btnRecycle");
    if (recycleBtn) {
        recycleBtn.addEventListener("click", () => {
            if (loadedModel) scene.remove(loadedModel);
            if (recycleModel) scene.remove(recycleModel);

            const loaderRecycle = new THREE.GLTFLoader();
            loaderRecycle.load(recycleModelPath, (gltf) => {
                recycleModel = gltf.scene;
                recycleModel.scale.set(2, 2, 2);
                scene.add(recycleModel);

                recycleMixer = new THREE.AnimationMixer(recycleModel);
                recycleActions = [];

                gltf.animations.forEach(clip => {
                    const action = recycleMixer.clipAction(clip);
                    recycleActions.push(action);
                });

                if (recycleActions.length > 0) {
                    recycleActions.forEach(action => {
                        action.reset();
                        action.setLoop(THREE.LoopOnce);
                        action.clampWhenFinished = true;
                        action.timeScale = 1;
                        action.play();
                    });
                }

                setTimeout(() => {
                    if (soundCrush) {
                        if (soundCrush.isPlaying) soundCrush.stop();
                        soundCrush.play();
                    }
                }, 100);
            });
        });
    }

    window.addEventListener("resize", resize, false);
    resize();
    animate();
}

// === Resize Renderer ===
function resize() {
    const container = document.getElementById("threeContainer");
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// === Render Loop ===
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    if (recycleMixer) recycleMixer.update(delta);
    renderer.render(scene, camera);
}
