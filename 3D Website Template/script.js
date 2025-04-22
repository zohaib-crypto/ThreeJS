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

    const ambient = new THREE.HemisphereLight(0xffffbb, 0x080802, 1);
    scene.add(ambient);

    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(0, 10, 2);
    scene.add(light);

    const container = document.getElementById("threeContainer");
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    resize();
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(1, 2, 0);
    controls.update();

   document.getElementById("btn").addEventListener('click', function () {
  if (actions.length > 0) {
    actions.forEach(action => {
      action.reset();
      action.setLoop(THREE.LoopOnce);           // ✅ Play only once
      action.clampWhenFinished = true;          // ✅ Hold the last frame
      action.timeScale = 1;
      action.play();
    });
    console.log("✅ Animation played once and stopped at end");
  } else {
    console.warn("⚠️ No actions found to play.");
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

    const loader = new THREE.GLTFLoader();
    loader.load(assetPath + 'assets/3d_models/ring_open.glb', function (gltf) {
        const model = gltf.scene;
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
