var scene, camera, renderer, clock, mixer, actions = [], mode, isWireFrame = false;
let loadedModel;

init();

function init() {
    const assetPath = './';
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = null;

    // === Model Path & Camera Positioning ===
    const modelPath = window.MODEL_PATH || 'assets/3d_models/pepsi_can_open.glb';

    // Default camera values
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

    camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.set(0, cameraY, cameraZ);

   // === Enhanced Lighting Setup ===
const ambientLight = new THREE.AmbientLight(0xffffff, 2); // bright global light
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


    // === Renderer ===
    const container = document.getElementById("threeContainer");
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    resize();
    container.appendChild(renderer.domElement);

    // === Controls ===
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, targetY, 0);
    controls.update();

    // === Buttons ===
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
    });

    document.getElementById("btnWireframe").addEventListener("click", () => {
        isWireFrame = !isWireFrame;
        togglerWireframe(isWireFrame);
    });

    document.getElementById("btnRotate").addEventListener("click", () => {
        if (loadedModel) {
            const axis = new THREE.Vector3(0, 1, 0);
            const angle = Math.PI / 8;
            loadedModel.rotateOnAxis(axis, angle);
        } else {
            console.warn("Model not loaded yet!");
        }
    });

    // === Model Loader ===
    const loader = new THREE.GLTFLoader();
    loader.load(modelPath, function (gltf) {
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

    window.addEventListener("resize", resize, false);
    animate();
}

function togglerWireframe(enable) {
    scene.traverse(object => {
        if (object.isMesh) {
            object.material.wireframe = enable;
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    if (mixer) mixer.update(clock.getDelta());
    renderer.render(scene, camera);
}

function resize() {
    const container = document.getElementById("threeContainer");
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}
