// === Global Variables ===
var scene, camera, renderer, clock;
var mixer, recycleMixer, plasticMixer, plasticRecycleMixer;                  
var actions = [], recycleActions = [], plasticActions = [], plasticRecycleActions = [];    
var loadedModel, recycleModel, plasticModel, plasticRecycleModel;           
let soundOpen, soundCrush, soundPlasticCap, soundPlasticCrush;  
let params, lights, gui;
let currentModelType = 'can'; // Track which model is currently displayed: 'can', 'recycle', 'plastic', or 'plasticRecycle'

// === Start the setup ===
init();

function init() {
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = null;

    // === Load dynamic model and audio paths from HTML (set using <script>) ===
    const modelPath = window.MODEL_PATH || 'assets/3d_models/pepsi_can_open.glb';
    const recycleModelPath = window.RECYCLE_MODEL_PATH || 'assets/3d_models/pepsi_recycle.glb';
    const plasticModelPath = window.PLASTIC_MODEL_PATH;
    const plasticRecycleModelPath = window.PLASTIC_RECYCLE_MODEL_PATH || 'assets/3d_models/coke_plastic_recycle_animation.glb';
    const openSoundPath = window.SOUND_OPEN_PATH || 'assets/sounds/can_open.wav';
    const crushSoundPath = window.SOUND_CRUSH_PATH || 'assets/sounds/can_crush.wav';
    const plasticCapSoundPath = window.PLASTIC_CAP_SOUND_PATH || 'assets/sounds/plastic_cap_open.wav';
    const plasticCrushSoundPath = window.PLASTIC_CRUSH_SOUND_PATH || 'assets/sounds/plastic_crush.wav';

    console.log("Model paths:", {
        can: modelPath,
        recycle: recycleModelPath,
        plastic: plasticModelPath || 'Not defined',
        plasticRecycle: plasticRecycleModelPath || 'Not defined',
        openSound: openSoundPath,
        crushSound: crushSoundPath,
        plasticCapSound: plasticCapSoundPath,
        plasticCrushSound: plasticCrushSoundPath
    });

    // === Camera Setup (based on model type) ===
    let cameraY = 6, cameraZ = 10, targetY = 2;
    if (modelPath.includes("pepsi")) {
        cameraY = 3; cameraZ = 4.5; targetY = 1.7;
    } else if (modelPath.includes("coke")) {
        cameraY = 35; cameraZ = 45; targetY = 20;
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
    
    // Load plastic cap sound
    if (plasticCapSoundPath) {
        audioLoader.load(plasticCapSoundPath, (buffer) => {
            soundPlasticCap = new THREE.Audio(listener);
            soundPlasticCap.setBuffer(buffer);
            soundPlasticCap.setLoop(false);
            soundPlasticCap.setVolume(1.0);
            console.log("Plastic cap sound loaded successfully");
        }, 
        // Add progress and error handlers
        (xhr) => {
            console.log("Plastic cap sound: " + (xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('Error loading plastic cap sound:', error);
        });
    }
    
    // Load plastic crush sound
    if (plasticCrushSoundPath) {
        audioLoader.load(plasticCrushSoundPath, (buffer) => {
            soundPlasticCrush = new THREE.Audio(listener);
            soundPlasticCrush.setBuffer(buffer);
            soundPlasticCrush.setLoop(false);
            soundPlasticCrush.setVolume(1.0);
            console.log("Plastic crush sound loaded successfully");
        }, 
        // Add progress and error handlers
        (xhr) => {
            console.log("Plastic crush sound: " + (xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('Error loading plastic crush sound:', error);
        });
    }

    // === Load Main Model (Can) ===
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
        console.log("Can model: " + (xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
        console.error('Error loading model:', error);
    });
    
    // === Load the Plastic Model if path is defined (but don't add to scene yet) ===
    if (plasticModelPath) {
        loader.load(plasticModelPath, (gltf) => {
            console.log("Plastic model loaded successfully:", plasticModelPath);
            plasticModel = gltf.scene;
            plasticModel.scale.set(2, 2, 2);
            // Don't add to scene yet

            plasticMixer = new THREE.AnimationMixer(plasticModel);
            gltf.animations.forEach(clip => {
                console.log("Plastic animation clip found:", clip.name);
                const action = plasticMixer.clipAction(clip);
                plasticActions.push(action);
            });
        }, 
        // Add progress and error handlers
        (xhr) => {
            console.log("Plastic model: " + (xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('Error loading plastic model:', error);
        });
    }
    
    // === Load the Plastic Recycle Model (but don't add to scene yet) ===
    if (plasticRecycleModelPath) {
        loader.load(plasticRecycleModelPath, (gltf) => {
            console.log("Plastic recycle model loaded successfully:", plasticRecycleModelPath);
            plasticRecycleModel = gltf.scene;
            plasticRecycleModel.scale.set(2, 2, 2);
            // Don't add to scene yet

            plasticRecycleMixer = new THREE.AnimationMixer(plasticRecycleModel);
            gltf.animations.forEach(clip => {
                console.log("Plastic recycle animation clip found:", clip.name);
                const action = plasticRecycleMixer.clipAction(clip);
                plasticRecycleActions.push(action);
            });
        }, 
        // Add progress and error handlers
        (xhr) => {
            console.log("Plastic recycle model: " + (xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('Error loading plastic recycle model:', error);
        });
    }

    // === Button Listeners ===
    document.getElementById("btn").addEventListener("click", () => {
        console.log("Play button clicked");
        
        // Check if we're in Lays page (button text is "Pack")
        const buttonText = document.getElementById("btn").textContent.trim();
        console.log("Button text:", buttonText);
        
        // If we're on the Lays page and have a PACK_MODEL_PATH defined
        if (buttonText === "Pack" && window.PACK_MODEL_PATH) {
            console.log("Loading pack model:", window.PACK_MODEL_PATH);
            
            if (loadedModel) scene.remove(loadedModel);  // Remove existing
            if (recycleModel) scene.remove(recycleModel); // Just in case
            if (plasticModel) scene.remove(plasticModel); // Remove plastic if visible
            if (plasticRecycleModel) scene.remove(plasticRecycleModel); // Remove plastic recycle if visible
        
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
        
        // Original Play button functionality - depends on current model type
        console.log("Play button functionality for model type: " + currentModelType);
        
        // Remove other models from scene
        if (recycleModel) {
            scene.remove(recycleModel);
            recycleModel = null;
            recycleMixer = null;
        }
        
        if (plasticRecycleModel && scene.children.includes(plasticRecycleModel)) {
            scene.remove(plasticRecycleModel);
        }
        
        if (currentModelType === 'plastic' || currentModelType === 'plasticRecycle') {
            // If we're showing plastic model
            if (!scene.children.includes(plasticModel) && plasticModel) {
                scene.add(plasticModel);
                console.log("Added plastic model to scene");
                currentModelType = 'plastic';
            }
            
            if (loadedModel && scene.children.includes(loadedModel)) {
                scene.remove(loadedModel);
            }
            
            if (plasticActions.length > 0) {
                console.log("Playing plastic animations:", plasticActions.length);
                plasticActions.forEach(action => {
                    action.reset();
                    action.setLoop(THREE.LoopOnce);
                    action.clampWhenFinished = true;
                    action.timeScale = 1;
                    action.play();
                });
            } else {
                console.log("No plastic animations to play");
            }
            
            // Play plastic cap sound instead of can opening sound for plastic model
            if (soundPlasticCap) {
                if (soundPlasticCap.isPlaying) soundPlasticCap.stop();
                soundPlasticCap.play();
                console.log("Playing plastic cap sound");
            } else {
                console.log("Plastic cap sound not loaded yet");
            }
        } else {
            // Default - can model
            if (!scene.children.includes(loadedModel) && loadedModel) {
                console.log("Adding loadedModel back to scene");
                scene.add(loadedModel);
            }
            
            if (plasticModel && scene.children.includes(plasticModel)) {
                scene.remove(plasticModel);
            }

            if (actions.length > 0) {
                console.log("Playing can animations:", actions.length);
                actions.forEach(action => {
                    action.reset();
                    action.setLoop(THREE.LoopOnce);
                    action.clampWhenFinished = true;
                    action.timeScale = 1;
                    action.play();
                });
            } else {
                console.log("No can animations to play");
            }
            
            // Play regular can opening sound for can model
            if (soundOpen) {
                if (soundOpen.isPlaying) soundOpen.stop();
                soundOpen.play();
            }
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
        let currentModel;
        
        if (currentModelType === 'plastic') {
            currentModel = plasticModel;
        } else if (currentModelType === 'plasticRecycle') {
            currentModel = plasticRecycleModel;
        } else if (currentModelType === 'recycle') {
            currentModel = recycleModel;
        } else {
            currentModel = loadedModel;
        }
        
        if (currentModel) {
            const axis = new THREE.Vector3(0, 1, 0);
            const angle = Math.PI / 8;
            currentModel.rotateOnAxis(axis, angle);
        }
    });

    // === Plastic Bottle Button ===
    const plasticBtn = document.getElementById("btnPlastic");
    if (plasticBtn && plasticModelPath) {
        plasticBtn.addEventListener("click", () => {
            console.log("Plastic button clicked");
            
            // Determine if we're in Coca-Cola page
            const isCokePage = window.location.pathname.includes('coke') || 
                            document.title.includes('Coca-Cola') ||
                            document.querySelector('.navbar-brand')?.textContent.includes('Coca-Cola');
                            
            // Determine bottle branding text
            const brandName = isCokePage ? "Coca-Cola" : "Pepsi";
            
            // Remove other models
            if (loadedModel) scene.remove(loadedModel);
            if (recycleModel) scene.remove(recycleModel);
            if (plasticRecycleModel) scene.remove(plasticRecycleModel);
            
            if (plasticModel) {
                if (!scene.children.includes(plasticModel)) {
                    // Show plastic model
                    scene.add(plasticModel);
                    currentModelType = 'plastic';
                    console.log("Added plastic model to scene");
                    
                    // Update UI
                    const header = document.getElementById("modelTitle");
                    if (header) header.textContent = `3D ${brandName} Plastic Bottle`;
                    
                    const description = document.getElementById("modelDescription");
                    if (description) {
                        description.textContent = `Experience our ${brandName} plastic bottle in interactive 3D. Watch the animations, rotate it, or explore its structure!`;
                    }
                    
                    // Update button text
                    plasticBtn.textContent = "Show Can";
                    
                    // Play animations automatically
                    if (plasticActions.length > 0) {
                        console.log("Playing plastic animations:", plasticActions.length);
                        plasticActions.forEach(action => {
                            action.reset();
                            action.setLoop(THREE.LoopOnce);
                            action.clampWhenFinished = true;
                            action.timeScale = 1;
                            action.play();
                        });
                        
                        // Also play the plastic cap sound when switching to plastic model
                        if (soundPlasticCap) {
                            if (soundPlasticCap.isPlaying) soundPlasticCap.stop();
                            soundPlasticCap.play();
                            console.log("Playing plastic cap sound on model switch");
                        }
                    }
                } else {
                    // Switch back to can model
                    scene.remove(plasticModel);
                    
                    if (loadedModel) {
                        scene.add(loadedModel);
                        currentModelType = 'can';
                        console.log("Switched back to can model");
                        
                        // Update UI
                        const header = document.getElementById("modelTitle");
                        if (header) header.textContent = `3D ${brandName} Can`;
                        
                        const description = document.getElementById("modelDescription");
                        if (description) {
                            description.textContent = `Explore the iconic ${brandName} can in 3D. Open it, spin it, check its structure, or recycle it digitally with one click!`;
                        }
                        
                        // Update button text
                        plasticBtn.textContent = "Show Plastic Bottle";
                    }
                }
            } else {
                console.error("Plastic model not loaded yet or path not defined");
            }
            
            // Update GUI if necessary
            if (params && params.model && params.model.currentType) {
                params.model.currentType = currentModelType;
                updateGUIDisplay();
            }
        });
    }

    // === Recycle Button ===
    const recycleBtn = document.getElementById("btnRecycle");
    if (recycleBtn) {
        recycleBtn.addEventListener("click", () => {
            console.log("Recycle button clicked");
            
            // Check current model type to determine which recycle model to show
            if (currentModelType === 'plastic') {
                console.log("Recycling plastic bottle model");
                
                // Remove all models from scene
                if (loadedModel) scene.remove(loadedModel);
                if (plasticModel) scene.remove(plasticModel);
                if (recycleModel) scene.remove(recycleModel);
                if (plasticRecycleModel) scene.remove(plasticRecycleModel);
                
                // Check if plastic recycle model is loaded
                if (plasticRecycleModel) {
                    scene.add(plasticRecycleModel);
                    currentModelType = 'plasticRecycle';
                    console.log("Added plastic recycle model to scene");
                    
                    // Update UI
                    const header = document.getElementById("modelTitle");
                    const isCokePage = window.location.pathname.includes('coke') || 
                                    document.title.includes('Coca-Cola');
                    const brandName = isCokePage ? "Coca-Cola" : "Pepsi";
                    
                    if (header) header.textContent = `Recycling ${brandName} Plastic Bottle`;
                    
                    // Play animations
                    if (plasticRecycleActions.length > 0) {
                        console.log("Playing plastic recycle animations:", plasticRecycleActions.length);
                        plasticRecycleActions.forEach(action => {
                            action.reset();
                            action.setLoop(THREE.LoopOnce);
                            action.clampWhenFinished = true;
                            action.timeScale = 1;
                            action.play();
                        });
                        
                        // Play plastic crush sound
                        setTimeout(() => {
                            if (soundPlasticCrush) {
                                if (soundPlasticCrush.isPlaying) soundPlasticCrush.stop();
                                soundPlasticCrush.play();
                                console.log("Playing plastic crush sound");
                            } else {
                                console.log("Plastic crush sound not loaded yet");
                            }
                        }, 100);
                    }
                } else {
                    console.log("Plastic recycle model not loaded yet, loading now...");
                    
                    const loader = new THREE.GLTFLoader();
                    const plasticRecycleModelPath = window.PLASTIC_RECYCLE_MODEL_PATH || 'assets/3d_models/coke_plastic_recycle_animation.glb';
                    
                    loader.load(plasticRecycleModelPath, (gltf) => {
                        plasticRecycleModel = gltf.scene;
                        plasticRecycleModel.scale.set(2, 2, 2);
                        scene.add(plasticRecycleModel);
                        currentModelType = 'plasticRecycle';
                        console.log("Loaded and added plastic recycle model to scene");
                        
                        // Update UI
                        const header = document.getElementById("modelTitle");
                        const isCokePage = window.location.pathname.includes('coke') || 
                                        document.title.includes('Coca-Cola');
                        const brandName = isCokePage ? "Coca-Cola" : "Pepsi";
                        
                       if (header) header.textContent = `Recycling ${brandName} Plastic Bottle`;
                        
                        plasticRecycleMixer = new THREE.AnimationMixer(plasticRecycleModel);
                        plasticRecycleActions = [];
                        
                        gltf.animations.forEach(clip => {
                            const action = plasticRecycleMixer.clipAction(clip);
                            plasticRecycleActions.push(action);
                        });
                        
                        if (plasticRecycleActions.length > 0) {
                            plasticRecycleActions.forEach(action => {
                                action.reset();
                                action.setLoop(THREE.LoopOnce);
                                action.clampWhenFinished = true;
                                action.timeScale = 1;
                                action.play();
                            });
                        }
                        
                        // Play plastic crush sound
                        setTimeout(() => {
                            if (soundPlasticCrush) {
                                if (soundPlasticCrush.isPlaying) soundPlasticCrush.stop();
                                soundPlasticCrush.play();
                                console.log("Playing plastic crush sound");
                            } else {
                                console.log("Plastic crush sound not loaded yet");
                            }
                        }, 100);
                    });
                }
            } else {
                // Regular can recycling - original behavior
                console.log("Recycling regular can model");
                
                // Remove all models from scene
                if (loadedModel) scene.remove(loadedModel);
                if (plasticModel) scene.remove(plasticModel);
                if (recycleModel) scene.remove(recycleModel);
                if (plasticRecycleModel) scene.remove(plasticRecycleModel);

                const loaderRecycle = new THREE.GLTFLoader();
                loaderRecycle.load(recycleModelPath, (gltf) => {
                    recycleModel = gltf.scene;
                    recycleModel.scale.set(2, 2, 2);
                    scene.add(recycleModel);
                    currentModelType = 'recycle';
                    console.log("Added can recycle model to scene");

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
            }
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
        
        // Determine brand styling for the GUI toggle button
        let brandColor = '#0066cc'; // Default Pepsi blue
        if (window.location.pathname.includes('coke') || document.title.includes('Coca-Cola')) {
            brandColor = '#e7223a'; // Coke red
        } else if (window.location.pathname.includes('lays') || document.title.includes('Lays')) {
            brandColor = '#ffc220'; // Lays yellow
        }
        
        guiToggle.style.backgroundColor = brandColor;
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
            rotationSpeed: 0.01,
            currentType: currentModelType
        }
    };

    // Setup the GUI
    try {
        gui = new dat.GUI({ autoPlace: false });
        guiContainer.appendChild(gui.domElement);
        
        // Determine brand styling for GUI
        let brandMainColor, brandHoverColor;
        if (window.location.pathname.includes('coke') || document.title.includes('Coca-Cola')) {
            brandMainColor = '#e7223a'; // Coke red
            brandHoverColor = '#c41e33'; // Darker red
        } else if (window.location.pathname.includes('lays') || document.title.includes('Lays')) {
            brandMainColor = '#ffc220'; // Lays yellow
            brandHoverColor = '#e5a800'; // Darker yellow
        } else {
            brandMainColor = '#0066cc'; // Pepsi blue
            brandHoverColor = '#004c99'; // Darker blue
        }
        
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
                background-color: ${brandMainColor} !important;
                border-radius: 0 0 5px 5px;
            }
            .dg.main .close-button:hover {
                background-color: ${brandHoverColor} !important;
            }
            .dg .title {
                background: ${brandMainColor} !important;
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
                background:rgb(218, 208, 208) !important;
                border-bottom: 1px solid #ddd !important;
            }
            .dg li.save-row select {
                background: #f6f6f6 !important;
            }
            .dg li.save-row .button {
                background: ${brandMainColor} !important;
                text-shadow: none !important;
            }
            .dg li.save-row .button:hover {
                background: ${brandHoverColor} !important;
            }
            .dg .c .slider {
                background: ${brandMainColor} !important;
            }
            .dg .c .slider:hover {
                background: ${brandHoverColor} !important;
            }
            .dg .c .slider-fg {
                background: ${brandMainColor} !important;
            }
            .dg .c .slider:hover .slider-fg {
                background: ${brandHoverColor} !important;
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
        
        // Add model type selector to GUI only if plastic model path is defined
        if (window.PLASTIC_MODEL_PATH) {
            const modelTypes = { 'Can': 'can', 'Plastic Bottle': 'plastic', 'Recycle Can': 'recycle', 'Recycle Plastic': 'plasticRecycle' };
            modelFolder.add(params.model, 'currentType', modelTypes).name('Current Model').onChange(value => {
                // Reset scene first
                if (loadedModel) scene.remove(loadedModel);
                if (plasticModel) scene.remove(plasticModel);
                if (recycleModel) scene.remove(recycleModel);
                if (plasticRecycleModel) scene.remove(plasticRecycleModel);
                
                // Get brand info
                const isCokePage = window.location.pathname.includes('coke') || 
                                document.title.includes('Coca-Cola');
                const brandName = isCokePage ? "Coca-Cola" : "Pepsi";
                
                // Update header and button text
                const header = document.getElementById("modelTitle");
                const description = document.getElementById("modelDescription");
                const plasticBtn = document.getElementById("btnPlastic");
                
                // Handle model change based on selection
                if (value === 'can') {
                    // Show can model
                    if (loadedModel) {
                        scene.add(loadedModel);
                        currentModelType = 'can';
                        
                        if (header) header.textContent = `3D ${brandName} Can`;
                        if (description) {
                            description.textContent = `Explore the iconic ${brandName} can in 3D. Open it, spin it, check its structure, or recycle it digitally with one click!`;
                        }
                        
                        if (plasticBtn) plasticBtn.textContent = "Show Plastic Bottle";
                    }
                } else if (value === 'plastic') {
                    // Show plastic model
                    if (plasticModel) {
                        scene.add(plasticModel);
                        currentModelType = 'plastic';
                        
                        if (header) header.textContent = `3D ${brandName} Plastic Bottle`;
                        if (description) {
                            description.textContent = `Experience our ${brandName} plastic bottle in interactive 3D. Watch the animations, rotate it, or explore its structure!`;
                        }
                        
                        if (plasticBtn) plasticBtn.textContent = "Show Can";
                        
                        // Auto-play animations
                        if (plasticActions.length > 0) {
                            plasticActions.forEach(action => {
                                action.reset();
                                action.setLoop(THREE.LoopOnce);
                                action.clampWhenFinished = true;
                                action.timeScale = 1;
                                action.play();
                            });
                            
                            // Play plastic cap sound when switching to plastic model via GUI
                            if (soundPlasticCap) {
                                if (soundPlasticCap.isPlaying) soundPlasticCap.stop();
                                soundPlasticCap.play();
                                console.log("Playing plastic cap sound via GUI model change");
                            }
                        }
                    }
                } else if (value === 'recycle') {
                    // Show recycle model
                    const loaderRecycle = new THREE.GLTFLoader();
                    const recycleModelPath = window.RECYCLE_MODEL_PATH || 'assets/3d_models/pepsi_recycle.glb';
                    
                    loaderRecycle.load(recycleModelPath, (gltf) => {
                        recycleModel = gltf.scene;
                        recycleModel.scale.set(2, 2, 2);
                        scene.add(recycleModel);
                        currentModelType = 'recycle';
                        
                        if (header) header.textContent = `Recycling ${brandName} Can`;
                        
                        recycleMixer = new THREE.AnimationMixer(recycleModel);
                        recycleActions = [];
                        
                        gltf.animations.forEach(clip => {
                            const action = recycleMixer.clipAction(clip);
                            recycleActions.push(action);
                            
                            action.reset();
                            action.setLoop(THREE.LoopOnce);
                            action.clampWhenFinished = true;
                            action.timeScale = 1;
                            action.play();
                        });
                        
                        if (soundCrush && !soundCrush.isPlaying) {
                            soundCrush.play();
                        }
                    });
                } else if (value === 'plasticRecycle') {
                    // Show plastic recycle model
                    const loaderPlasticRecycle = new THREE.GLTFLoader();
                    const plasticRecycleModelPath = window.PLASTIC_RECYCLE_MODEL_PATH || 'assets/3d_models/coke_plastic_recycle_animation.glb';
                    
                    loaderPlasticRecycle.load(plasticRecycleModelPath, (gltf) => {
                        plasticRecycleModel = gltf.scene;
                        plasticRecycleModel.scale.set(2, 2, 2);
                        scene.add(plasticRecycleModel);
                        currentModelType = 'plasticRecycle';
                        
                        if (header) header.textContent = `Recycling ${brandName} Plastic Bottle`;
                        
                        plasticRecycleMixer = new THREE.AnimationMixer(plasticRecycleModel);
                        plasticRecycleActions = [];
                        
                        gltf.animations.forEach(clip => {
                            const action = plasticRecycleMixer.clipAction(clip);
                            plasticRecycleActions.push(action);
                            
                            action.reset();
                            action.setLoop(THREE.LoopOnce);
                            action.clampWhenFinished = true;
                            action.timeScale = 1;
                            action.play();
                        });
                        
                        if (soundPlasticCrush && !soundPlasticCrush.isPlaying) {
                            soundPlasticCrush.play();
                        }
                    });
                }
            });
        }
        
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
    if (plasticMixer) plasticMixer.update(delta);
    if (plasticRecycleMixer) plasticRecycleMixer.update(delta);
    
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
    if (params && params.model && params.model.autoRotate) {
        let modelToRotate = null;
        
        // Determine which model to rotate based on current type
        if (currentModelType === 'can' && loadedModel) {
            modelToRotate = loadedModel;
        } else if (currentModelType === 'plastic' && plasticModel) {
            modelToRotate = plasticModel;
        } else if (currentModelType === 'recycle' && recycleModel) {
            modelToRotate = recycleModel;
        } else if (currentModelType === 'plasticRecycle' && plasticRecycleModel) {
            modelToRotate = plasticRecycleModel;
        }
        
        if (modelToRotate) {
            modelToRotate.rotation.y += params.model.rotationSpeed;
        }
    }
    
    renderer.render(scene, camera);
}

// Sound Testing Helper Function (Press Ctrl+Shift+S to show)
document.addEventListener('keydown', function(event) {
    // Check if Ctrl+Shift+S is pressed
    if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        testSounds();
    }
});

function testSounds() {
    console.log("Testing sounds...");
    
    // Create a testing UI
    const soundTestDiv = document.createElement('div');
    soundTestDiv.style.position = 'fixed';
    soundTestDiv.style.top = '10px';
    soundTestDiv.style.right = '10px';
    soundTestDiv.style.zIndex = '9999';
    soundTestDiv.style.backgroundColor = 'rgba(255,255,255,0.9)';
    soundTestDiv.style.padding = '10px';
    soundTestDiv.style.borderRadius = '5px';
    soundTestDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    soundTestDiv.style.maxWidth = '250px';
    
    soundTestDiv.innerHTML = `
        <h4 style="margin:0 0 10px 0;font-size:16px;color:#333;">Sound Test Panel</h4>
        <div id="soundStatus" style="font-size:12px;margin-bottom:10px;color:#666;">Checking sounds...</div>
        <button id="testCanSound" style="display:block;width:100%;margin-bottom:5px;padding:5px;background:#0066cc;color:white;border:none;border-radius:3px;cursor:pointer;">Test Can Sound</button>
        <button id="testCrushSound" style="display:block;width:100%;margin-bottom:5px;padding:5px;background:#e7223a;color:white;border:none;border-radius:3px;cursor:pointer;">Test Crush Sound</button>
        <button id="testPlasticSound" style="display:block;width:100%;margin-bottom:5px;padding:5px;background:#4CAF50;color:white;border:none;border-radius:3px;cursor:pointer;">Test Plastic Cap Sound</button>
        <button id="testPlasticCrushSound" style="display:block;width:100%;margin-bottom:10px;padding:5px;background:#9C27B0;color:white;border:none;border-radius:3px;cursor:pointer;">Test Plastic Crush Sound</button>
        <div style="font-size:10px;color:#666;">Click to test individual sounds. Check the console for detailed logs.</div>
    `;
    
    document.body.appendChild(soundTestDiv);
    
    // Update the sound status
    function updateStatus() {
        const statusDiv = document.getElementById('soundStatus');
        if (!statusDiv) return;
        
        let status = '';
        status += `Can Sound: ${soundOpen ? "✅ Loaded" : "❌ Not Loaded"}<br>`;
        status += `Crush Sound: ${soundCrush ? "✅ Loaded" : "❌ Not Loaded"}<br>`;
        status += `Plastic Cap: ${soundPlasticCap ? "✅ Loaded" : "❌ Not Loaded"}<br>`;
        status += `Plastic Crush: ${soundPlasticCrush ? "✅ Loaded" : "❌ Not Loaded"}<br>`;
        
        statusDiv.innerHTML = status;
    }
    
    // Check sounds every second
    const intervalId = setInterval(updateStatus, 1000);
    updateStatus();
    
    // Add event listeners to test buttons
    document.getElementById('testCanSound').addEventListener('click', () => {
        console.log("Testing can open sound");
        if (soundOpen) {
            if (soundOpen.isPlaying) soundOpen.stop();
            soundOpen.play();
            console.log("Can open sound played");
        } else {
            console.log("Can open sound not loaded yet");
            alert("Can open sound not loaded yet!");
        }
    });
    
    document.getElementById('testCrushSound').addEventListener('click', () => {
        console.log("Testing crush sound");
        if (soundCrush) {
            if (soundCrush.isPlaying) soundCrush.stop();
            soundCrush.play();
            console.log("Crush sound played");
        } else {
            console.log("Crush sound not loaded yet");
            alert("Crush sound not loaded yet!");
        }
    });
    
    document.getElementById('testPlasticSound').addEventListener('click', () => {
        console.log("Testing plastic cap sound");
        if (soundPlasticCap) {
            if (soundPlasticCap.isPlaying) soundPlasticCap.stop();
            soundPlasticCap.play();
            console.log("Plastic cap sound played");
        } else {
            console.log("Plastic cap sound not loaded yet");
            alert("Plastic cap sound not loaded yet! Check if the file exists at the path specified in your HTML.");
        }
    });
    
    document.getElementById('testPlasticCrushSound').addEventListener('click', () => {
        console.log("Testing plastic crush sound");
        if (soundPlasticCrush) {
            if (soundPlasticCrush.isPlaying) soundPlasticCrush.stop();
            soundPlasticCrush.play();
            console.log("Plastic crush sound played");
        } else {
            console.log("Plastic crush sound not loaded yet");
            alert("Plastic crush sound not loaded yet! Check if the file exists at the path specified in your HTML.");
        }
    });
    
    // Add a close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '5px';
    closeButton.style.right = '5px';
    closeButton.style.backgroundColor = '#ccc';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '3px';
    closeButton.style.padding = '2px 5px';
    closeButton.style.fontSize = '10px';
    closeButton.style.cursor = 'pointer';
    
    closeButton.addEventListener('click', () => {
        document.body.removeChild(soundTestDiv);
        clearInterval(intervalId);
    });
    
    soundTestDiv.appendChild(closeButton);
}

// Console message about sound test
console.log("Sound test available: Press Ctrl+Shift+S to show the sound test panel");