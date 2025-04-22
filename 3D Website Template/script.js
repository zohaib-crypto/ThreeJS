var scene, camera, renderer, clock, mixer, actions = [], mode, isWireFrame = false;
let loadedModel;

init();

function init() {
    const assetPath = './';
    clock = new THREE.Clock();

    scene = new THREE.Scene();
    scene.background = null;

    camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.set(-5, 25, 20);

    // === Lights ===
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLightFront = new THREE.DirectionalLight(0xffffff, 1);
    dirLightFront.position.set(0, 10, 10);
    scene.add(dirLightFront);

    const dirLightBack = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLightBack.position.set(0, 5, -10);
    scene.add(dirLightBack);

    const dirLightTop = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLightTop.position.set(0, 20, 0);
    scene.add(dirLightTop);

    const dirLightLeft = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLightLeft.position.set(-10, 5, 0);
    scene.add(dirLightLeft);

    // === Renderer ===
    const container = document.getElementById("threeContainer");
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    resize();
    container.appendChild(renderer.domElement);

    // === Controls ===
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(1, 2, 0);
    controls.update();

    // === Button Events ===
    document.getElementById("btn").addEventListener('click', function () {
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

    document.getElementById("btnWireframe").addEventListener('click', function () {
        isWireFrame = !isWireFrame;
        togglerWireframe(isWireFrame);
    });

    document.getElementById("btnRotate").addEventListener('click', function () {
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
    const modelPath = window.MODEL_PATH || 'assets/3d_models/pepsi_can_open.glb'; // default fallback
    loader.load(modelPath, function (gltf) {
        const model = gltf.scene;
        model.scale.set(2, 2, 2); // consistent size across models
        scene.add(model);

        loadedModel = model;
        mixer = new THREE.AnimationMixer(model);

        gltf.animations.forEach(clip => {
            const action = mixer.clipAction(clip);
            actions.push(action);
        });
    });

    window.addEventListener('resize', resize, false);
    animate();
}

function togglerWireframe(enable) {
    scene.traverse(function (object) {
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
