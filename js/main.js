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
function wall(x,y,z,w,h,d) {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.01, roughness: 0.5 })
  )
  wall.position.x = x
  wall.position.y = y
  wall.position.z = z
  wall.castShadow = true
  wall.receiveShadow = true
  return wall
}
scene.add(wall(0, .75, 0, 6.1, 0.1, 3))

scene.add(wall(-3, 1.25, 0, .001, 1, 3))
scene.add(wall(0, 1.25, -.875, .2, 1, 1.25))
scene.add(wall(0, 1.65, 0, .2, .2, .5))
scene.add(wall(0, 1.25, .875, .2, 1, 1.25))
scene.add(wall(3, 1.25, 0, .001, 1, 3))
scene.add(wall(0, 1.25, -1.5, 6, 1, .001))

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

// some random boxes for GI
//

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

// global illumination
const probeconf = [
  {loc: [-1.55, 1.3, 0], size: [2.9, 1.1, 3.2], count: [6, 3, 5], bakerate: 0.5, bounces: 1}, // room 1
  {loc: [1.55, 1.3, 0], size: [2.9, 1.1, 3.2], count: [6, 3, 5], bakerate: 0.5, bounces: 1} // room 2
]
const probes = probeconf.map((grid) => {
  const g = new LightProbeGrid(...grid.size, ...grid.count)
  g.position.set(...grid.loc)
  g.bake(renderer, scene, { cubemapSize: 8, near: 0.05, far: 10, bounces: grid.bounces })
  scene.add(g)
  return g
})

const probeHelpers = probes.map((g) => {
  const h = new LightProbeGridHelper(g, 0.03)
  h.visible = false
  scene.add(h)
  return h
})

const bakeJobs = probeconf.map(() => ({ running: false, pass: 0, next: 0 }))

function startBake() {
  bakeJobs.forEach((job) => Object.assign(job, { running: true, pass: 0, next: 0 }))
}

function stepBake() {
  if (!bakeJobs.some((job) => job.running)) return
  probeconf.forEach((conf, i) => {
    const job = bakeJobs[i]
    if (!job.running) return
    const totalProbes = conf.count[0] * conf.count[1] * conf.count[2]
    const count = Math.min(Math.max(1, Math.floor(conf.bakerate * totalProbes)), totalProbes - job.next)
    probes.forEach((g) => g.visible = false)
    probes[i].bake(renderer, scene, { cubemapSize: 8, near: 0.05, far: 10, start: job.next, count, pass: job.pass })
    probes.forEach((g) => g.visible = gi.enabled)

    job.next += count
    if (job.next >= totalProbes) {
      job.next = 0
      job.pass++
    }
    if (job.pass > conf.bounces) {
      job.running = false
      probeHelpers[i].update()
    }
  })
}

// post processing ???

// a small debug gui
const gui = new GUI()
const gi = {
  enabled: true,
  showProbes: false,
  rebake: () => startBake(),
}
gui.add(lighta, "intensity", 0, 10).name("light a").onFinishChange(startBake)
gui.add(lightb, "intensity", 0, 10).name("light b").onFinishChange(startBake)
gui.add(gi, "enabled").name("GI enabled").onChange((v) => probes.forEach((g) => g.visible = v))
gui.add(gi, "showProbes").name("show probes").onChange((v) => probeHelpers.forEach((h) => h.visible = v))
gui.add(gi, "rebake").name("bake")

renderer.setAnimationLoop(() => {
  controls.update()
  stepBake()
  renderer.render(scene, camera)
})
