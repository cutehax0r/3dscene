import * as THREE from "three";

const canvas = document.querySelector("#scene")
const renderer = new THREE.WebGPURenderer({ canvas, antialias: true })
renderer.setSize(1920, 1080, false)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0xeeeeee)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.VSMShadowMap

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, (16/9), 0.1, 1000)
camera.position.set(0, 3, 5);
camera.lookAt(0, 0, 0);

const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 10),
  new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    roughness: 0.4,
    metalness: 0.1
  })
)
plane.rotation.x = -Math.PI / 2
plane.position.y = 0
plane.receiveShadow = true
scene.add(plane)

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1.5,1.5,1.5),
  new THREE.MeshStandardMaterial({
    color: 0x55ff55,
    metalness: 0.1,
    roughness: 0.5
  })
)
cube.position.x = 3
cube.position.y = .75
cube.castShadow = true
scene.add(cube)

const cone = new THREE.Mesh(
  new THREE.ConeGeometry(2, 3, 20, 5),
  new THREE.MeshStandardMaterial({
    color: 0xff5555,
    roughness: 0.2,
    metalness: 0.0
  })
)
cone.position.x = -2.5
cone.position.y = 0
cone.position.z = -1
cone.castShadow = true
scene.add(cone)

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(),
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.5
  })
)
sphere.position.x = 0,
sphere.position.y = 1,
sphere.position.z = 1
sphere.castShadow = true
scene.add(sphere)

// cheap global illumination: bake a sky/ground gradient into a light probe
await renderer.init()

const skyColor = new THREE.Color(0xff0000)
const horizonColor = new THREE.Color(0xffff00)
const groundColor = new THREE.Color(0x333333)

const envGeometry = new THREE.SphereGeometry(50, 32, 16)
const envPositions = envGeometry.attributes.position
const envColors = new Float32Array(envPositions.count * 3)
const envColor = new THREE.Color()
for (let i = 0; i < envPositions.count; i++) {
  const t = envPositions.getY(i) / 50
  if (t > 0) {
    envColor.lerpColors(horizonColor, skyColor, t)
  } else {
    envColor.lerpColors(horizonColor, groundColor, -t)
  }
  envColor.toArray(envColors, i * 3)
}
envGeometry.setAttribute("color", new THREE.BufferAttribute(envColors, 3))

const envScene = new THREE.Scene()
envScene.add(new THREE.Mesh(
  envGeometry,
  new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true })
))

const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromScene(envScene).texture
scene.environmentIntensity = 0.35

const sunLight = new THREE.DirectionalLight(0xffffff, 4)
sunLight.position.set(5,5,5)
sunLight.shadow.mapSize.set(1024, 1024)
sunLight.castShadow = true
sunLight.shadow.blurSamples = 8
sunLight.shadow.radius = 8
scene.add(sunLight)

renderer.setAnimationLoop(() => {
  // cube.rotateX(0.01)
  // cube.rotateY(0.01)
  // cube.rotateZ(0.01)
  renderer.render(scene, camera)
})

window.addEventListener('resize', () => {
  camera.aspect = canvas.clientWidth / canvas.clientHeight
  camera.updateProjectionMatrix()
})
