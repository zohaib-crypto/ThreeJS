var scene, camera, renderer, box, clock, mixer, actions = [], mode;

init();
function init() {


    const assetPath =  './';

    clock = new THREE.Clock();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x00aaff);

    camera = new THREE.PerspectiveCamera(60 , window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-5, 25, 20);


    //Lighting
    const ambient = new THREE.HemisphereLight(0xffffbb, 0x0808020, 1);
    scene.add(ambient);

    const light = new THREE.DirectionalLight(0xFFFFFFFF, 2);
    light.position.set(0, 10, 2);
    scene.add(light);

    //Renderer  
        renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);


    //Orbit control
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(1,2,0);
    controls.update();

    mode = 'open';
    const btn = document.getElementById("btn");
    btn.addEventListener('click', function() {
        if (actions.length === 2) {
            if(mode==="open"){
                actions.forEach(action =>{
                    action.timeScale = 1;
                    action.reset();
                    action.play();
                })
            }
        }
    })

   


    //GLTF loader
    const loader = new THREE.GLTFLoader();
    loader.load(assetPath + 'assets/3d_models/ring_open.glb', function(gltf){
        const model = gltf.scene;
        scene.add(model);
    

    mixer = new THREE.AnimationMixer(model);
    const animations = gltf.animations;

    animations.forEach(clip=> {
        const action = mixer.clipAction(clip);
        actions.push(action);
    })
});
        //Handle resizing
    window.addEventListener('resize', resize, false);

    //start the animation loop
    animate();

    }
    function animate(){
        requestAnimationFrame(animate);

        //update animations
        if(mixer){
            mixer.update(clock.getDelta());
        }
   
        
renderer.render(scene,camera);

}
function resize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}