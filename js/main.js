import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { LightProbeGrid } from "three/addons/lighting/LightProbeGrid.js";
import { LightProbeGridHelper } from "three/addons/helpers/LightProbeGridHelper.js";
import GUI from "lil-gui";

// basic setup

const canvas = document.querySelector("#scene")
const renderer = new THREE.WebGPURenderer({ canvas, antialias: true })

renderer.setSize(1920, 1080, false)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x000000) // this contributes to GI lighting
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

const backwall = new THREE.Mesh( new THREE.BoxGeometry(6, 1, .001), new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.01, roughness: 0.5 }))
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
lighta.shadow.bias = -0.002
lighta.shadow.normalBias = 0
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
lightb.shadow.bias = -0.002
lightb.shadow.normalBias = 0
lightb.shadow.radius = 4
lightb.shadow.blurSamples = 8
lightb.shadow.camera.near = 0.1
lightb.shadow.camera.far = 8
scene.add(lightb)

await renderer.init()

// setup the grid, fill the 'rooms' with 12 wide, 3 high, 6 deep worth of probes
const probes = new LightProbeGrid(6.2, 1.1, 3.2, 12, 3, 6)
probes.position.set(0, 1.3, 0)
probes.bake(renderer, scene, { cubemapSize: 8, near: 0.05, far: 10, bounces: 1 })
scene.add(probes)
const probeHelper = new LightProbeGridHelper(probes, 0.03)
probeHelper.visible = false
scene.add(probeHelper)

// post processing ???

// a small debug gui
const gui = new GUI()
const gi = {
  enabled: true,
  showProbes: false,
  bounces: 1,
  status: "idle",
  rebake: () => startBake(),
}

// rebuild the gi lighting, const probes = new LightProbeGrid(6.2, 1.1, 3.2, x, y, z)
const totalProbes = 216 // x * y * z
const bakeJob = { running: false, pass: 0, next: 0 }

// this purges the current bake and starts a new one so the scene dims. can we have two and lerp
// between them when the second finishes? it'd add 
function startBake() {
  bakeJob.running = true
  bakeJob.pass = 0
  bakeJob.next = 0
}

function stepBake() {
  if (!bakeJob.running) return
  // how many to update per frame. higher = more responsive but risks frame lag - just do em all
  const count = Math.min(216, totalProbes - bakeJob.next)

  // pass 0 - direct light only - don't include any probes, then for pass 1+ turn them on
  probes.visible = bakeJob.pass > 0
  probes.bake(renderer, scene, { cubemapSize: 8, near: 0.05, far: 10, start: bakeJob.next, count, pass: bakeJob.pass })
  probes.visible = gi.enabled

  bakeJob.next += count
  if (bakeJob.next >= totalProbes) {
    bakeJob.next = 0
    bakeJob.pass++
  }
  if (bakeJob.pass > 1) {
    bakeJob.running = false
    probeHelper.update()
    gi.status = "idle"
  } else {
    gi.status = `pass ${bakeJob.pass}: ${bakeJob.next}/${totalProbes}`
  }
}
gui.add(lighta, "intensity", 0, 10).name("light a")
gui.add(lightb, "intensity", 0, 10).name("light b")
gui.add(gi, "enabled").name("GI enabled").onChange((v) => probes.visible = v)
gui.add(gi, "showProbes").name("show probes").onChange((v) => probeHelper.visible = v)
gui.add(gi, "rebake").name("bake")
gui.add(gi, "status").name("bake status").listen().disable()

renderer.setAnimationLoop(() => {
  controls.update()
  stepBake()
  renderer.render(scene, camera)
})
