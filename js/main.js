import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";

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
camera.position.set(0, 3, 3);
camera.lookAt(0, 1, 0);

const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0, 0)
controls.enableDamping = true

window.addEventListener('resize', () => {
  camera.aspect = canvas.clientWidth / canvas.clientHeight
  camera.updateProjectionMatrix()
})

// geometry

const ground = new THREE.Mesh(
  new THREE.BoxGeometry(6.1, 0.1, 3),
  new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    metalness: 0.01,
    roughness: 0.5
  })
)
ground.position.x = 0
ground.position.y = .75
ground.castShadow = true
ground.receiveShadow = true
scene.add(ground)

const leftwall = new THREE.Mesh( new THREE.BoxGeometry(.001, 1, 3), new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.01, roughness: 0.5 }))
leftwall.position.x = -3
leftwall.position.y = 1.25
leftwall.castShadow = true
leftwall.receiveShadow = true
scene.add(leftwall)

const centerawall = new THREE.Mesh( new THREE.BoxGeometry(.2, 1, 1.25), new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.01, roughness: 0.5 }))
centerawall.position.z = -.875
centerawall.position.y = 1.25
centerawall.castShadow = true
centerawall.receiveShadow = true
scene.add(centerawall)

const centerbwall = new THREE.Mesh( new THREE.BoxGeometry(.2, .2, .5), new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.01, roughness: 0.5 }))
centerbwall.position.z = 0
centerbwall.position.y = 1.65
centerbwall.castShadow = true
centerbwall.receiveShadow = true
scene.add(centerbwall)

const centercwall = new THREE.Mesh( new THREE.BoxGeometry(.2, 1, 1.25), new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.01, roughness: 0.5 }))
centercwall.position.z = .875
centercwall.position.y = 1.25
centercwall.castShadow = true
centercwall.receiveShadow = true
scene.add(centercwall)

const rightwall = new THREE.Mesh( new THREE.BoxGeometry(.001, 1, 3), new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.01, roughness: 0.5 }))
rightwall.position.x = 3
rightwall.position.y = 1.25
rightwall.castShadow = true
rightwall.receiveShadow = true
scene.add(rightwall)

const backwall = new THREE.Mesh( new THREE.BoxGeometry(6.1, 1, .001), new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.01, roughness: 0.5 }))
backwall.position.y = 1.25
backwall.position.z = -1.5
backwall.castShadow = true
backwall.receiveShadow = true
scene.add(backwall)

// room content
function col(x,z) {
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, .66, 20, 10),
    new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.01, roughness: 0.5 })
  )
  column.position.x = x
  column.position.y = 1.085
  column.position.z = z
  column.receiveShadow = true
  column.castShadow = true
  return column
}
scene.add(col(-2.5, -0.75 ))
scene.add(col(-2.5, 0.75 ))
scene.add(col(-0.5, -0.75 ))
scene.add(col(-0.5, 0.75 ))

scene.add(col(2.5, -0.75 ))
scene.add(col(2.5, 0.75 ))
scene.add(col(0.5, -0.75 ))
scene.add(col(0.5, 0.75 ))

const knota = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.1, 0.033, 100, 50, 2, 3),
  new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.01, roughness: 0.0, envMapIntensity: 1.0 })
)
knota.position.x = -1.5
knota.position.y = 1.25
scene.add(knota)

const knotb = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.1, 0.033, 100, 50, 2, 3),
  new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.01, roughness: 0.0, envMapIntensity: 1.0 })
)
knotb.position.x = 1.5
knotb.position.y = 1.25
scene.add(knotb)

// lighting

const lighta = new THREE.PointLight(0xffaa99, 3, 5, .5)
lighta.position.x = -1.75
lighta.position.y = 1.5
lighta.position.z = 0
lighta.castShadow = true
lighta.shadow.mapSize.set(1024, 1024)
lighta.shadow.bias = -0.0005
lighta.shadow.normalBias = 0.02
lighta.shadow.radius = 4
lighta.shadow.blurSamples = 8
lighta.shadow.camera.near = 0.1
lighta.shadow.camera.far = 8
scene.add(lighta)

const lightb = new THREE.PointLight(0x99aaff, 3, 5, .5)
lightb.position.x = 1.75
lightb.position.y = 1.5
lightb.position.z = 0
lightb.castShadow = true
lightb.shadow.mapSize.set(1024, 1024)
lightb.shadow.bias = -0.0005
lightb.shadow.normalBias = 0.02
lightb.shadow.radius = 4
lightb.shadow.blurSamples = 8
lightb.shadow.camera.near = 0.1
lightb.shadow.camera.far = 8
scene.add(lightb)

await renderer.init()

// post processing

// the direct blue/red lights are behaving well, casting through the door and mixing to a nice
// purple. The issue is that the columns cast super dark shadow on the wall but the walls should be
// bouncing light on to them. The corners of everything look pretty good - almost like ambiet
// occlusion is working but I think I could break that by adding a 'table' under the knots that
// is very close

// a small debug gui
const gui = new GUI()
gui.add(lighta, "intensity", 0, 10).name("light a")
gui.add(lightb, "intensity", 0, 10).name("light b")

renderer.setAnimationLoop(() => {
  controls.update()
  renderer.render(scene, camera)
})
