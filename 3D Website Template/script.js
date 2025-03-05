var scene, camera, renderer, box, clock, mixer, action = [], mode;

init();
function init() {


    const assetPath =  './';

    clock = new THRRE.clock();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFAF9F6);

    camera = new THREE.PerspectiveCamera(60 , window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-5, 25, 20);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //Lighting
    const ambient = new THREE.HemisphereLight(0xffffbb, 0x0808020, 1);
    scene.add(ambient);

    const light = new THREE.DirectionalLight();
    light.position.set(0, 10, 2);
    scene.add(light);

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
                    actions.timeScale = 1.;
                    actions.reset();
                    actions.play();
                })
            }
        }
    })

   


    //GLFT loader
    const loader = new THREE.GLFTLoader();
    loader.load(assetPath + 'assets/3d models/ring open.glb', function(gltf){
        const model = gltf.scene;
        scene.add(model);
    

    mixer = new THREE.AnimationMixer(model);
    const animations = gltf.animations;

    animations.forEach(clip=> {
        const action = mixer.clipAction(clip);
        actions.push(action);
    })
});
        
    window.addEventListener('resize', onResize, false);

    animate();

    }
    function animate(){
        requestAnimationFrame(animate);
        if(mixer){
            mixer.update(clock.getDelta());
        }
   
        
renderer.render(scene,camera);

}
function onResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}