let currentModelIndex = 0;

const models = [
  'assets/3d_models/pepsi_ani_2.glb',        // Pepsi
  'assets/3d_models/coke_plastic.glb',     // Coke
  'assets/3d_models/lays.glb'           // Lays
];

let scene, camera, renderer, mixer;
let isAnimating = false;

initModel(models[currentModelIndex]);

// Navigation Buttons
document.getElementById('prevBtn').addEventListener('click', function(e) {
  e.preventDefault();
  if (isAnimating) return;
  isAnimating = true;
  
  currentModelIndex = (currentModelIndex - 1 + models.length) % models.length;
  updateCards(currentModelIndex);
  initModel(models[currentModelIndex]);
  
  setTimeout(() => {
    isAnimating = false;
  }, 500);
});

document.getElementById('nextBtn').addEventListener('click', function(e) {
  e.preventDefault();
  if (isAnimating) return;
  isAnimating = true;
  
  currentModelIndex = (currentModelIndex + 1) % models.length;
  updateCards(currentModelIndex);
  initModel(models[currentModelIndex]);
  
  setTimeout(() => {
    isAnimating = false;
  }, 500);
});

// Card Click Events
const drinkCards = document.querySelectorAll('.drink-card');
drinkCards.forEach((card, index) => {
  card.addEventListener('click', () => {
    if (isAnimating) return;
    if (currentModelIndex === index) return;
    
    isAnimating = true;
    currentModelIndex = index;
    updateCards(index);
    initModel(models[index]);

    const targetPage = card.dataset.page;
    if (targetPage) {
      setTimeout(() => {
        window.location.href = targetPage;
      }, 800);
    }
    
    setTimeout(() => {
      isAnimating = false;
    }, 500);
  });
});

// Highlight Active Card
function updateCards(activeIndex) {
  drinkCards.forEach((card, i) => {
    if (i === activeIndex) {
      card.style.transform = 'translateY(-10px)';
      card.style.boxShadow = '0 10px 20px rgba(0,0,0,0.15)';
      card.style.border = '2px solid #e7223a';
    } else {
      card.style.transform = '';
      card.style.boxShadow = '';
      card.style.border = '';
    }
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
  scene.traverse(obj => {
    if (obj.isLight) scene.remove(obj);
  });

  // === Smart Lighting Based on Model Type ===
  let ambientIntensity = 1.2;
  let dirIntensity = 1.8;

  if (path.includes("lays")) {
    ambientIntensity = 0.5;
    dirIntensity = 0.7;
  }

  const ambient = new THREE.AmbientLight(0xffffff, ambientIntensity);
  scene.add(ambient);

  const light = new THREE.DirectionalLight(0xffffff, dirIntensity);
  light.position.set(5, 10, 7);
  scene.add(light);
 
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  if (path.includes("pepsi")) {
    camera.position.set(0, 3, 5);
    controls.target.set(0, 2, 0);
  } else if (path.includes("coke")) {
    camera.position.set(2, 9, 16);             
    controls.target.set(0, 2, 0);          
  } else {
    camera.position.set(0, 3, 5);
    controls.target.set(0, 2, 0);
  }

  controls.update();

  // Loading indicator
  const loadingDiv = document.createElement('div');
  loadingDiv.style.position = 'absolute';
  loadingDiv.style.top = '50%';
  loadingDiv.style.left = '50%';
  loadingDiv.style.transform = 'translate(-50%, -50%)';
  loadingDiv.style.color = '#e7223a';
  loadingDiv.style.fontSize = '18px';
  loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading model...';
  container.appendChild(loadingDiv);

  // Model Loader
  const loader = new THREE.GLTFLoader();
  loader.load(path, function (gltf) {
    // Remove loading indicator
    container.removeChild(loadingDiv);
    
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
  }, 
  // Progress callback
  function(xhr) {
    if (xhr.lengthComputable) {
      const percentComplete = xhr.loaded / xhr.total * 100;
      loadingDiv.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading model... ${Math.round(percentComplete)}%`;
    }
  },
  // Error callback
  function(error) {
    console.error('Error loading model:', error);
    loadingDiv.innerHTML = 'Error loading model';
    loadingDiv.style.color = 'red';
  });

  function animate() {
    requestAnimationFrame(animate);
    if (mixer) mixer.update(0.01);
    renderer.render(scene, camera);
  }
}

// Set initial active card
updateCards(currentModelIndex);

// Handle window resize
window.addEventListener('resize', function() {
  if (renderer && camera) {
    const container = document.getElementById("threeContainer");
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
});