let scene, camera, renderer, clock, mixer;

init();

function init() {
  clock = new THREE.Clock();
  scene = new THREE.Scene();
  scene.background = null;

  // === Camera Setup ===
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 3, 5);

  // === Lighting ===
scene.add(new THREE.AmbientLight(0xffffff, 2.5));
const light1 = new THREE.DirectionalLight(0xffffff, 3);
light1.position.set(5, 10, 7);
scene.add(light1);

  // === Renderer ===
  const container = document.getElementById("threeContainer");
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // === Orbit Controls ===
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2, 0);
  controls.update();

  // === Load Model ===
  const loader = new THREE.GLTFLoader();
  loader.load('assets/3d_models/pepsi_ani_2.glb', function (gltf) {
    const model = gltf.scene;
    model.scale.set(2, 2, 2);
    scene.add(model);

    mixer = new THREE.AnimationMixer(model);
    gltf.animations.forEach(clip => {
      mixer.clipAction(clip).play();
    });
  });

  window.addEventListener('resize', resize);
  resize();
  animate();
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
