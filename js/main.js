import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// basic setup

const canvas = document.querySelector("#scene")
const renderer = new THREE.WebGPURenderer({ canvas, antialias: true })

renderer.setSize(1920, 1080, false)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x111111)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.VSMShadowMap

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, (16/9), 0.1, 1000)
camera.position.set(0, 3, 5);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0, 0)
controls.enableDamping = true

window.addEventListener('resize', () => {
  camera.aspect = canvas.clientWidth / canvas.clientHeight
  camera.updateProjectionMatrix()
})

// geometry

const ground = new THREE.Mesh(
  new THREE.BoxGeometry(4.1, 0.1, 3),
  new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    metalness: 0.01,
    roughness: 0.5
  })
)
ground.position.x = 0
ground.position.y = .75
ground.castShadow = true
scene.add(ground)

const leftwall = new THREE.Mesh( new THREE.BoxGeometry(.1, 1, 3), new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.01, roughness: 0.5 }))
leftwall.position.x = -2
leftwall.position.y = 1.25
leftwall.castShadow = true
scene.add(leftwall)

const centerawall = new THREE.Mesh( new THREE.BoxGeometry(.1, 1, 1.25), new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.01, roughness: 0.5 }))
centerawall.position.z = -.875
centerawall.position.y = 1.25
centerawall.castShadow = true
scene.add(centerawall)

const centerbwall = new THREE.Mesh( new THREE.BoxGeometry(.1, .2, .5), new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.01, roughness: 0.5 }))
centerbwall.position.z = 0
centerbwall.position.y = 1.65
centerbwall.castShadow = true
scene.add(centerbwall)

const centercwall = new THREE.Mesh( new THREE.BoxGeometry(.1, 1, 1.25), new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.01, roughness: 0.5 }))
centercwall.position.z = .875
centercwall.position.y = 1.25
centercwall.castShadow = true
scene.add(centercwall)

const rightwall = new THREE.Mesh( new THREE.BoxGeometry(.1, 1, 3), new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.01, roughness: 0.5 }))
rightwall.position.x = 2
rightwall.position.y = 1.25
rightwall.castShadow = true
scene.add(rightwall)

const backwall = new THREE.Mesh( new THREE.BoxGeometry(4.1, 1, .1), new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.01, roughness: 0.5 }))
backwall.position.y = 1.25
backwall.position.z = -1.5
backwall.castShadow = true
scene.add(backwall)


// lighting

const light = new THREE.PointLight(0xffffff, 50, 20, 1.5)
light.position.x = 7
light.position.y = 5
light.position.z = 7
light.castShadow = true
scene.add(light)

// post processing

renderer.setAnimationLoop(() => {
  controls.update()
  renderer.render(scene, camera)
})

