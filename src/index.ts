import * as THREE from 'three';
import {VRButton} from 'three/examples/jsm/webxr/VRButton.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

let camera, controls, scene, renderer, sphere, clock;
let initialCameraPosition = new THREE.Vector3();

class ImageSet {
    color_path: string;
    depth_path: string;
    src_url: string;
    geometry: THREE.Geometry;

    constructor(color_path: string, depth_path: string, src_url: string, geometry: THREE.Geometry) {
        this.color_path = color_path;
        this.depth_path = depth_path;
        this.src_url = src_url;
        this.geometry = geometry;
    }
}

// Good source of equirectangular 360 degree images: https://www.flickr.com/groups/equirectangular/pool/
const imageSets = {
    // market: new ImageSet(
    //     './images/market.jpg',
    //     './images/market-depth.png',
    //     'https://www.flickr.com/photos/hapephotographix/51114732965/in/pool-equirectangular/',
    //     new THREE.SphereGeometry(10, 256, 256)
    // ),
    chapel: new ImageSet(
        './images/chapel_equirectangular.jpg',
        './images/chapel_equirectangular.png',
        'https://www.flickr.com/photos/hapephotographix/50947196346/in/pool-equirectangular/',
        new THREE.SphereGeometry(5, 256, 256)
    ),
    // campus: new ImageSet(
    //     './static/campusR_cropped.jpg',
    //     './static/campusR_cropped-depth.png',
    //     null,
    //     new THREE.CylinderGeometry(10, 10, 8, 256, 256, true)
    // ),
    // blossoms: new ImageSet(
    //     './static/blossoms.jpg',
    //     './static/blossoms-depth.png',
    //     null,
    //     new THREE.SphereGeometry(10, 256, 256)
    // ),
    // nyu: new ImageSet(
    //     './static/00000_colors.png',
    //     './static/000000.png',
    //     null,
    //     new THREE.PlaneGeometry(640, 480, 512, 512)
    // )
}
let imageSet = imageSets.chapel;
// TODO: Allow image set to be changed by user via keyboard shortcuts.
// TODO: Display source image url.
// TODO: WASD controls.
// TODO: Do we really need to limit the viewing angle?
const minAngle = 0;
const maxAngle = Math.PI;

window.onload = () => {
    init();
    animate();
}

function init() {
    const container = document.getElementById('container');

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');
    container.appendChild(renderer.domElement);

    document.body.appendChild(VRButton.createButton(renderer));

    window.addEventListener('resize', onWindowResize);

    clock = new THREE.Clock();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101010);

    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
    scene.add(camera);

    // controls
    controls = new OrbitControls(camera, renderer.domElement);
    // controls.listenToKeyEvents( window ); // optional

    controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;

    controls.screenSpacePanning = false;

    controls.minDistance = 1;
    controls.maxDistance = 500;

    controls.minPolarAngle = minAngle;
    controls.maxPolarAngle = maxAngle;

    // Create the panoramic sphere geometery
    const panoSphereGeo = imageSet.geometry;

    // Create the panoramic sphere material
    const panoSphereMat = new THREE.MeshStandardMaterial({
        side: THREE.BackSide,
        displacementScale: -4.0
    });

    // Create the panoramic sphere mesh
    sphere = new THREE.Mesh(panoSphereGeo, panoSphereMat);

    // Load and assign the texture and depth map
    const manager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(manager);

    loader.load(imageSet.color_path, function (texture) {

        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        sphere.material.map = texture;

    });

    loader.load(imageSet.depth_path, function (depth) {

        depth.minFilter = THREE.NearestFilter;
        depth.generateMipmaps = false;
        sphere.material.displacementMap = depth;

    });

    // On load complete add the panoramic sphere to the scene
    manager.onLoad = function () {
        sphere.scale.x *= -1; // Textures are flipped horizontally when loaded, so we need to undo that here.
        scene.add(sphere);

    };
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}
function animate() {
    renderer.setAnimationLoop(render);
    controls.update();
    // Set initial camera rotation to be looking at the 'horizon' since it defaults to looking straight at the ground
    // (the world origin).
    camera.rotateX((maxAngle - minAngle) / 2);
    camera.position.copy(initialCameraPosition);
}

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    if (event.key == 'r') {
        let {x, y, z} = initialCameraPosition;
        camera.position.set(x, y, z);
    }
}

function render() {

    // // If we are not presenting move the camera a little so the effect is visible
    //
    // if (renderer.xr.isPresenting === false) {
    //
    //     const time = clock.getElapsedTime();
    //
    //     sphere.rotation.y += 0.001;
    //     sphere.position.x = Math.sin(time) * 0.2;
    //     sphere.position.z = Math.cos(time) * 0.2;
    //
    // }

    renderer.render(scene, camera);

}
