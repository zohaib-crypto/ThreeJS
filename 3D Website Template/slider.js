let currentModelIndex = 0;

const models = [
  'assets/3d_models/pepsi_ani_2.glb',        // Pepsi
  'assets/3d_models/can coke lab 4.glb',     // Coke
  'assets/3d_models/ring_open.glb'           // Fanta
];

let scene, camera, renderer, mixer;

initModel(models[currentModelIndex]);

// Navigation Buttons
document.getElementById('prevBtn').addEventListener('click', () => {
  currentModelIndex = (currentModelIndex - 1 + models.length) % models.length;
  updateCards(currentModelIndex);
  initModel(models[currentModelIndex]);
});

document.getElementById('nextBtn').addEventListener('click', () => {
  currentModelIndex = (currentModelIndex + 1) % models.length;
  updateCards(currentModelIndex);
  initModel(models[currentModelIndex]);
});

// Card Click Events
const drinkCards = document.querySelectorAll('.drink-card');
drinkCards.forEach((card, index) => {
  card.addEventListener('click', () => {
    currentModelIndex = index;
    updateCards(index);
    initModel(models[index]);

    const targetPage = card.dataset.page;
    if (targetPage) {
      setTimeout(() => {
        window.location.href = targetPage;
      }, 800);
    }
  });
});

// Highlight Active Card
function updateCards(activeIndex) {
  drinkCards.forEach((card, i) => {
    card.classList.toggle('active', i === activeIndex);
  });

  const selectedCard = drinkCards[activeIndex];
  const targetPage = selectedCard.dataset.page;
  const playButton = document.getElementById("playButton");
  if (targetPage && playButton) {
    playButton.href = targetPage;
  }
}

// Loading models
function initModel(path) {
  const container = document.getElementById("threeContainer");
  container.innerHTML = '';

  scene = new THREE.Scene();
  scene.background = null;

  camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambient);

  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(5, 10, 7);
  scene.add(light);

 
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  if (path.includes("pepsi")) {
    camera.position.set(0, 3, 5);
    controls.target.set(0, 2, 0);
  } else if (path.includes("coke")) {
    camera.position.set(0, 0, -1);             
    controls.target.set(0, 2.2, 0);          
  } else {
    camera.position.set(0, 3, 5);
    controls.target.set(0, 2, 0);
  }

  controls.update();

  // Model Loader
  const loader = new THREE.GLTFLoader();
  loader.load(path, function (gltf) {
    const model = gltf.scene;
    model.scale.set(2, 2, 2); 
    scene.add(model);

    mixer = new THREE.AnimationMixer(model);
    gltf.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.timeScale = 0.4;
      action.play();
    });

    animate();
  });

  function animate() {
    requestAnimationFrame(animate);
    if (mixer) mixer.update(0.01);
    renderer.render(scene, camera);
  }
}

updateCards(0);
