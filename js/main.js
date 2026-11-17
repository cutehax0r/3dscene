import * as THREE from "three";

const canvas = document.querySelector("#scene")
const renderer = new THREE.WebGPURenderer({ canvas, antialias: true })
renderer.setSize(1920, 1080, false)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0xff00ff)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.VSMShadowMap

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, (16/9), 0.1, 1000)
camera.position.set(0, 3, 5);
camera.lookAt(0, 0, 0);

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshNormalMaterial()
)
cube.position.y = 2
cube.castShadow = true
scene.add(cube)

const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 10),
  new THREE.MeshStandardMaterial({
    color: 0xff00ff,
    roughness: 0.4,
    metalness: 0.1
  })
)
plane.rotation.x = -Math.PI / 2
plane.position.y = 0
plane.receiveShadow = true
scene.add(plane)

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
scene.add(ambientLight)

const sunLight = new THREE.DirectionalLight(0xffffff, 4)
sunLight.position.set(0,5,0)
sunLight.shadow.mapSize.set(1024, 1024)
sunLight.castShadow = true
sunLight.shadow.blurSamples = 8
sunLight.shadow.radius = 8
scene.add(sunLight)

renderer.setAnimationLoop(() => {
  cube.rotateX(0.01)
  cube.rotateY(0.01)
  cube.rotateZ(0.01)
  renderer.render(scene, camera)
})

window.addEventListener('resize', () => {
  camera.aspect = canvas.clientWidth / canvas.clientHeight
  camera.updateProjectionMatrix()
})
