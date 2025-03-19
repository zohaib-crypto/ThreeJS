var scene, camera, renderer, clock, mixer, actions = [], mode, isWireFrame = false;
let loadedModel;

init();

function init() {
    const assetPath = './';
    clock = new THREE.Clock();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x00aaff);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-5, 25, 20);

    // Lighting
    const ambient = new THREE.HemisphereLight(0xffffbb, 0x0808020, 1);
    scene.add(ambient);

    const light = new THREE.DirectionalLight(0xFFFFFF, 2);
    light.position.set(0, 10, 2);
    scene.add(light);

    // Renderer inside the card
    const container = document.getElementById("threeContainer");
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Orbit controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(1, 2, 0);
    controls.update();

    // Button functionality
    mode = 'open';
    const btn = document.getElementById("btn");
    btn.addEventListener('click', function () {
        if (actions.length === 2) {
            if (mode === "open") {
                actions.forEach(action => {
                    action.timeScale = 1;
                    action.reset();
                    action.play();
                });
            }
        }
    });
//Wireframe toggling functionality
    const wireframeBtn= document.getElementById("btnWireframe");
    wireframeBtn.addEventListener('click', function () {
        isWireFrame = !isWireFrame;
        togglerWireframe(isWireFrame)
    })

    // button for rotation
    const rotationBtn = document.getElementById("btnRotate");
    rotationBtn.addEventListener('click', function(){
        if(loadedModel){
            const axis = new THREE.Vector3(0,1,0); 
            const angle = Math.PI / 8;
            loadedModel.rotateOnAxis(axis,angle);
        }
        else {
            console.warn("Model not loaded yet!");
        }
    })

    // GLTF Loader
    const loader = new THREE.GLTFLoader();
    loader.load(assetPath + 'assets/3d_models/ring_open.glb', function (gltf) {
        const model = gltf.scene;
        scene.add(model);

        loadedModel = model;    

        //setup Animations
        mixer = new THREE.AnimationMixer(model);
        const animations = gltf.animations;

        animations.forEach(clip => {
            const action = mixer.clipAction(clip);
            actions.push(action);
        });
    });

    // Handle resizing
    window.addEventListener('resize', resize, false);
    resize();  // Call resize initially

    // Start animation loop
    animate();
}


//Wireframe Animation
function togglerWireframe(enable) {
    scene.traverse(function (object) {
        if (object.isMesh) {
            object.material.wireframe = enable;
        }
    }); 
}
function animate() {
    requestAnimationFrame(animate);

    // Update animations
    if (mixer) {
        mixer.update(clock.getDelta());
    }

    renderer.render(scene, camera);
}

function resize() {
    const container = document.getElementById("threeContainer");
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}
