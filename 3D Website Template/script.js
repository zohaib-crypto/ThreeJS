// === Global Variables ===
var scene, camera, renderer, clock;
var mixer, recycleMixer;                  
var actions = [], recycleActions = [];    
var loadedModel, recycleModel;           
let soundOpen, soundCrush;  
let params, lights, gui;              

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

    // === Lighting Setup - Keep original lights ===
    let ambientIntensity = 2;
    let dirIntensity = 1.5;

    if (modelPath.includes("lays")) {
        ambientIntensity = 0.5;  // softer ambient light
        dirIntensity = 0.36;      // tone down directional brightness
    }

    // Storing the ambient light for GUI control
    lights = {};
    lights.ambient = new THREE.AmbientLight(0xffffff, ambientIntensity);
    scene.add(lights.ambient);

    // Store the directional lights for GUI control
    lights.dirLights = [
        new THREE.DirectionalLight(0xffffff, dirIntensity),
        new THREE.DirectionalLight(0xffffff, dirIntensity * 0.8),
        new THREE.DirectionalLight(0xffffff, dirIntensity * 0.6),
        new THREE.DirectionalLight(0xffffff, dirIntensity * 0.6)
    ];

    lights.dirLights[0].position.set(5, 10, 7);
    lights.dirLights[1].position.set(-5, 10, -7);
    lights.dirLights[2].position.set(0, 20, 0);
    lights.dirLights[3].position.set(0, 5, 15);
    lights.dirLights.forEach(light => scene.add(light));

    // Add a spot light for additional control (initially off)
    lights.spot = new THREE.SpotLight(0xffffff, 1);
    lights.spot.visible = false;
    lights.spot.position.set(0, 10, 5);
    lights.spot.castShadow = true;
    lights.spotHelper = new THREE.SpotLightHelper(lights.spot);
    lights.spotHelper.visible = false;
    scene.add(lights.spotHelper);
    scene.add(lights.spot);

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
        console.log("Main model loaded successfully:", modelPath);
        loadedModel = gltf.scene;
        loadedModel.scale.set(2, 2, 2);
        scene.add(loadedModel);

        mixer = new THREE.AnimationMixer(loadedModel);
        gltf.animations.forEach(clip => {
            console.log("Animation clip found:", clip.name);
            const action = mixer.clipAction(clip);
            actions.push(action);
        });
    }, 
    // Add progress and error handlers
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
        console.error('Error loading model:', error);
    });

    // === Button Listeners ===
    document.getElementById("btn").addEventListener("click", () => {
        console.log("Button clicked");
        
        // Check if we're in Lays page (button text is "Pack")
        const buttonText = document.getElementById("btn").textContent.trim();
        console.log("Button text:", buttonText);
        
        // If we're on the Lays page and have a PACK_MODEL_PATH defined
        if (buttonText === "Pack" && window.PACK_MODEL_PATH) {
            console.log("Loading pack model:", window.PACK_MODEL_PATH);
            
            if (loadedModel) scene.remove(loadedModel);  // Remove existing
            if (recycleModel) scene.remove(recycleModel); // Just in case
        
            const loader = new THREE.GLTFLoader();
            loader.load(window.PACK_MODEL_PATH, function (gltf) {
                console.log("Pack model loaded successfully");
                loadedModel = gltf.scene;
                loadedModel.scale.set(2, 2, 2);
                scene.add(loadedModel);
        
                mixer = new THREE.AnimationMixer(loadedModel);
                actions = [];
        
                gltf.animations.forEach(clip => {
                    console.log("Pack animation clip found:", clip.name);
                    const action = mixer.clipAction(clip);
                    action.reset();
                    action.setLoop(THREE.LoopOnce);
                    action.clampWhenFinished = true;
                    action.timeScale = 1;
                    action.play();
                    actions.push(action);
                });
                
                if (actions.length === 0) {
                    console.log("No animations found in pack model");
                }
            }, 
            // Add progress and error handlers
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('Error loading pack model:', error);
            });
            
            return; // Exit early since we're handling the Pack button case
        }
        
        // Original Pepsi can behavior (Play button)
        console.log("Play button functionality");
        if (recycleModel) {
            scene.remove(recycleModel);
            recycleModel = null;
            recycleMixer = null;
        }

        if (!scene.children.includes(loadedModel) && loadedModel) {
            console.log("Adding loadedModel back to scene");
            scene.add(loadedModel);
        }

        if (actions.length > 0) {
            console.log("Playing animations:", actions.length);
            actions.forEach(action => {
                action.reset();
                action.setLoop(THREE.LoopOnce);
                action.clampWhenFinished = true;
                action.timeScale = 1;
                action.play();
            });
        } else {
            console.log("No animations to play");
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
                
                // Update GUI wireframe control if it exists
                if (params && params.model && params.model.wireframe !== undefined) {
                    params.model.wireframe = object.material.wireframe;
                    updateGUIDisplay();
                }
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
    
    // Add a slight delay before initializing GUI to ensure all elements are loaded
    setTimeout(setupGUI, 500);
}

// === Setup GUI ===
function setupGUI() {
    // Create GUI container if it doesn't exist
    let guiContainer = document.getElementById('gui-container');
    if (!guiContainer) {
        guiContainer = document.createElement('div');
        guiContainer.id = 'gui-container';
        guiContainer.style.position = 'fixed';
        guiContainer.style.top = '100px';
        guiContainer.style.left = '10px';
        guiContainer.style.zIndex = '9999';
        document.body.appendChild(guiContainer);
    }
    
    // Create toggle button if it doesn't exist
    let guiToggle = document.getElementById('gui-toggle');
    if (!guiToggle) {
        guiToggle = document.createElement('button');
        guiToggle.id = 'gui-toggle';
        guiToggle.title = 'Toggle Controls';
        guiToggle.innerHTML = '<i class="fas fa-cog"></i>';
        guiToggle.style.position = 'fixed';
        guiToggle.style.bottom = '20px';
        guiToggle.style.left = '20px';
        guiToggle.style.width = '40px';
        guiToggle.style.height = '40px';
        guiToggle.style.backgroundColor = '#e7223a';
        guiToggle.style.color = 'white';
        guiToggle.style.border = 'none';
        guiToggle.style.borderRadius = '50%';
        guiToggle.style.display = 'flex';
        guiToggle.style.justifyContent = 'center';
        guiToggle.style.alignItems = 'center';
        guiToggle.style.cursor = 'pointer';
        guiToggle.style.fontSize = '16px';
        guiToggle.style.zIndex = '9999';
        guiToggle.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        document.body.appendChild(guiToggle);
    }
    
    // Initialize GUI parameters
    params = {
        ambient: {
            intensity: lights.ambient.intensity,
            visible: true
        },
        directional: {
            intensity: lights.dirLights[0].intensity,
            visible: true
        },
        spot: {
            enable: false,
            color: 0xffffff,
            intensity: 1,
            distance: 20,
            angle: Math.PI/4,
            penumbra: 0.2,
            helper: false,
            moving: false
        },
        model: {
            wireframe: false,
            autoRotate: false,
            rotationSpeed: 0.01
        }
    };

    // Setup the GUI
    try {
        gui = new dat.GUI({ autoPlace: false });
        guiContainer.appendChild(gui.domElement);
        
        // Add the CSS to style the GUI
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .dg.main {
                font-family: 'Segoe UI', Arial, sans-serif !important;
                text-shadow: none !important;
                border-radius: 5px;
                overflow: hidden;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
            }
            .dg.main .close-button {
                background-color: #e7223a !important;
                border-radius: 0 0 5px 5px;
            }
            .dg.main .close-button:hover {
                background-color: #c41e33 !important;
            }
            .dg .title {
                background: #e7223a !important;
                text-shadow: none !important;
                font-weight: bold !important;
                color: white !important;
            }
            .dg .cr.function .property-name {
                background: #fcfcfc !important;
            }
            .dg .c input[type=text] {
                background: #fcfcfc !important;
            }
            .dg .c select {
                background: #fcfcfc !important;
            }
            .dg .cr.boolean .property-name {
                color: #333 !important;
            }
            .dg .cr.number .property-name {
                color: #333 !important;
            }
            .dg .cr.string .property-name {
                color: #333 !important;
            }
            .dg .cr.function .property-name {
                color: #333 !important;
            }
            .dg li:not(.folder) {
                background: #f6f6f6 !important;
                border-bottom: 1px solid #ddd !important;
            }
            .dg li.save-row select {
                background: #f6f6f6 !important;
            }
            .dg li.save-row .button {
                background: #e7223a !important;
                text-shadow: none !important;
            }
            .dg li.save-row .button:hover {
                background: #c41e33 !important;
            }
            .dg .c .slider {
                background: #e7223a !important;
            }
            .dg .c .slider:hover {
                background: #c41e33 !important;
            }
            .dg .c .slider-fg {
                background: #e7223a !important;
            }
            .dg .c .slider:hover .slider-fg {
                background: #c41e33 !important;
            }
        `;
        document.head.appendChild(styleElement);
        
        // Toggle button functionality
        let guiVisible = true;
        guiToggle.addEventListener('click', function() {
            guiVisible = !guiVisible;
            guiContainer.style.display = guiVisible ? 'block' : 'none';
            guiToggle.innerHTML = guiVisible ? '<i class="fas fa-times"></i>' : '<i class="fas fa-cog"></i>';
        });

        // Ambient Light Controls
        const ambientFolder = gui.addFolder('Ambient Light');
        ambientFolder.add(params.ambient, 'intensity', 0, 5).onChange(value => {
            lights.ambient.intensity = value;
        });
        ambientFolder.add(params.ambient, 'visible').onChange(value => {
            lights.ambient.visible = value;
        });
        ambientFolder.open();

        // Directional Light Controls
        const dirFolder = gui.addFolder('Directional Lights');
        dirFolder.add(params.directional, 'intensity', 0, 5).onChange(value => {
            lights.dirLights.forEach(light => {
                // Maintain relative intensity ratios
                if (light === lights.dirLights[0]) {
                    light.intensity = value;
                } else if (light === lights.dirLights[1]) {
                    light.intensity = value * 0.8;
                } else {
                    light.intensity = value * 0.6;
                }
            });
        });
        dirFolder.add(params.directional, 'visible').onChange(value => {
            lights.dirLights.forEach(light => {
                light.visible = value;
            });
        });
        dirFolder.open();

        // Spot Light Controls
        const spotFolder = gui.addFolder('Spot Light');
        spotFolder.add(params.spot, 'enable').onChange(value => { 
            lights.spot.visible = value;
        });
        spotFolder.addColor(params.spot, 'color').onChange(value => {
            lights.spot.color = new THREE.Color(value);
        });
        spotFolder.add(params.spot, 'intensity', 0, 5).onChange(value => {
            lights.spot.intensity = value;
        });
        spotFolder.add(params.spot, 'distance', 0, 50).onChange(value => {
            lights.spot.distance = value;
        });
        spotFolder.add(params.spot, 'angle', 0.1, Math.PI/2).onChange(value => {
            lights.spot.angle = value;
        });
        spotFolder.add(params.spot, 'penumbra', 0, 1).onChange(value => {
            lights.spot.penumbra = value;
        });
        spotFolder.add(params.spot, 'helper').onChange(value => {
            lights.spotHelper.visible = value;
        });
        spotFolder.add(params.spot, 'moving');
        spotFolder.open();

        // Model Controls
        const modelFolder = gui.addFolder('Model');
        modelFolder.add(params.model, 'wireframe').onChange(value => {
            scene.traverse(object => {
                if (object.isMesh) {
                    object.material.wireframe = value;
                }
            });
        });
        modelFolder.add(params.model, 'autoRotate');
        modelFolder.add(params.model, 'rotationSpeed', 0.001, 0.1);
        modelFolder.open();
        
        console.log("GUI setup complete");
    } catch (error) {
        console.error("Error setting up GUI:", error);
    }
}

// Function to update GUI display (useful when controls are changed by buttons)
function updateGUIDisplay() {
    if (gui) {
        for (const folder of Object.values(gui.__folders)) {
            for (const controller of folder.__controllers) {
                if (typeof controller.updateDisplay === 'function') {
                    controller.updateDisplay();
                }
            }
        }
    }
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
    
    // Update mixers
    if (mixer) mixer.update(delta);
    if (recycleMixer) recycleMixer.update(delta);
    
    // Handle spot light movement if enabled
    if (params && params.spot && params.spot.moving) {
        const time = clock.getElapsedTime();
        const posX = Math.sin(time) * 5;
        lights.spot.position.x = posX;
        if (lights.spotHelper.visible) {
            lights.spotHelper.update();
        }
    }
    
    // Auto-rotate model if enabled
    if (params && params.model && params.model.autoRotate && loadedModel) {
        loadedModel.rotation.y += params.model.rotationSpeed;
    }
    
    renderer.render(scene, camera);
}