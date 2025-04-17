let currentModelIndex = 0;

const models = [
  'assets/3d_models/pepsi_ani_2.glb',
  'assets/3d_models/pepsi_animation.glb',
  'assets/3d_models/ring_open.glb'
];

// Populate cards dynamically
const slider = document.getElementById('cardSlider');
models.forEach((modelPath, index) => {
  const card = document.createElement('div');
  card.className = 'model-card';
  card.innerHTML = `<p class="pt-3">Drink ${index + 1}</p>`;
  slider.appendChild(card);
});

// Set up Three.js scene
let scene, camera, renderer, mixer;
initModel(models[currentModelIndex]);

document.getElementById('prevBtn').addEventListener('click', () => {
  if (currentModelIndex > 0) {
    currentModelIndex--;
    initModel(models[currentModelIndex]);
  }
});

document.getElementById('nextBtn').addEventListener('click', () => {
  if (currentModelIndex < models.length - 1) {
    currentModelIndex++;
    initModel(models[currentModelIndex]);
  }
});

function initModel(path) {
  const container = document.getElementById("threeContainer");
  container.innerHTML = '';

  scene = new THREE.Scene();
  scene.background = null;

  // Adding Camera
  camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 3, 5);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambient);
  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(5, 10, 7);
  scene.add(light);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2, 0);
  controls.update();

  //Loading model
  const loader = new THREE.GLTFLoader();
  loader.load(path, function (gltf) {
    const model = gltf.scene;
    model.scale.set(2, 2, 2);
    scene.add(model);
    // if (index === 2) {
    //   model.scale.set(1.2, 1.2, 1.2);         // smaller scale
    //   camera.position.set(0, 2.5, 6);         // further back
    // } else {
    //   model.scale.set(2, 2, 2);
    //   camera.position.set(0, 3, 5);
    // }

    //Animation
    mixer = new THREE.AnimationMixer(model);
    gltf.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.timeScale = 0.4;
      action.play();
    });

    animate();
  });

  // Animation
  function animate() {
    requestAnimationFrame(animate);
    if (mixer) mixer.update(0.01);
    renderer.render(scene, camera);
  }
}
