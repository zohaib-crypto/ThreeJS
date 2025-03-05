

var scene, camera, rendered, box;

init();
function init() {
    scene = new THREE.Scene();
    scene.background = new
        THREE.Color(0xaaaaaa);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 3;
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new Three.DirectionalLight();
    light.position.set(0, 1, 2);
    scene.add(light);

    const material = new THREE.MeshStandardMaterial(({ color: new THREE.Color('skyblue') }));

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    box = new THREE.Mesh(geometry, material);
    box.position.x = 0;
    scene.add(box);

    window.addEventListener('resize', onresize, false);


    update();


}

function update() {
    requestAnimationFrame(update);
    
    box.rotation.y += 0.01;
    renderer.render(scene, camera);
 
}

function onResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


function update() {

    requestAnimationFrame(update);

    box.rotation.y += 0.01;

    renderer.render(scene, camera);

}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

}