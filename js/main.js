import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { LightProbeGrid } from "three/addons/lighting/LightProbeGrid.js";
import { LightProbeGridHelper } from "three/addons/helpers/LightProbeGridHelper.js";
import GUI from "lil-gui";

// some funcs for making stuff
function light(x,y,z, color, intensity, distance, decay) {
  const lamp = new THREE.PointLight(color, intensity, distance, decay)
  lamp.position.x = x
  lamp.position.y = y
  lamp.position.z = z
  lamp.castShadow = true
  lamp.shadow.mapSize.set(1024, 1024)
  lamp.shadow.bias = -0.002
  lamp.shadow.normalBias = 0
  lamp.shadow.radius = 4
  lamp.shadow.blurSamples = 8
  lamp.shadow.camera.near = 0.1
  lamp.shadow.camera.far = 8
  return lamp
}

function wall(x,y,z,w,h,d) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.01, roughness: 0.5 })
  )
  mesh.position.x = x
  mesh.position.y = y
  mesh.position.z = z
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

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

function knot(x,y,z) {
  const mesh = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.1, 0.033, 100, 50, 2, 3),
    new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.01, roughness: 0.0, envMapIntensity: 1.0 })
  )
  mesh.position.x = x
  mesh.position.y = y
  mesh.position.z = z
  return mesh
}

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
scene.add(wall(0, .75, 0, 6.1, 0.1, 3))

scene.add(wall(-3, 1.25, 0, .001, 1, 3))
scene.add(wall(0, 1.25, -.875, .2, 1, 1.25))
scene.add(wall(0, 1.65, 0, .2, .2, .5))
scene.add(wall(0, 1.25, .875, .2, 1, 1.25))
scene.add(wall(3, 1.25, 0, .001, 1, 3))
scene.add(wall(0, 1.25, -1.5, 6, 1, .001))

// room content
scene.add(col(-2.5, -0.75 ))
scene.add(col(-2.5, 0.75 ))
scene.add(col(-0.5, -0.75 ))
scene.add(col(-0.5, 0.75 ))

scene.add(col(2.5, -0.75 ))
scene.add(col(2.5, 0.75 ))
scene.add(col(0.5, -0.75 ))
scene.add(col(0.5, 0.75 ))

scene.add(knot(-1.5, 1.25, 0))
scene.add(knot(1.5, 1.25, 0))

// some random boxes for AO
scene.add(wall(-1.6, 0.9, 0.05, 0.2, 0.2, 0.2))
scene.add(wall(-1.45, 0.85, 0.05, 0.1, 0.1, 0.1))
scene.add(wall(-1.45, 0.84, 0.14, 0.08, 0.08, 0.08))
scene.add(wall(-1.60, 1.02, -0.05, 0.1, 0.04, 0.15))
scene.add(wall(-1.55, 1.058, 0.02, 0.15, 0.036, 0.1))

// lighting
const lighta = light(-1.5, 1.5, 0, 0xffaa99, 3, 5, .5)
const lightb = light(1.5, 1.5, 0, 0x99aaff, 3, 5, .5)
scene.add(lighta)
scene.add(lightb)


// global illumination
await renderer.init()
const probeconf = [
  {loc: [-1.55, 1.3, 0], size: [2.9, 1.1, 3.2], count: [6, 3, 5], bakerate: 0.5, bounces: 1}, // room 1
  {loc: [1.55, 1.3, 0], size: [2.9, 1.1, 3.2], count: [6, 3, 5], bakerate: 0.5, bounces: 1} // room 2
]
const probes = probeconf.map((grid) => {
  const g = new LightProbeGrid(...grid.size, ...grid.count)
  g.position.set(...grid.loc)
  g.bake(renderer, scene, { cubemapSize: 8, near: 0.05, far: 10, bounces: grid.bounces })
  return g
})
probes.forEach((g) => scene.add(g))

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
}
gui.add(lighta, "intensity", 0, 10).name("light a").onFinishChange(startBake)
gui.add(lightb, "intensity", 0, 10).name("light b").onFinishChange(startBake)
gui.add(gi, "enabled").name("GI enabled").onChange((v) => probes.forEach((g) => g.visible = v))
gui.add(gi, "showProbes").name("show probes").onChange((v) => probeHelpers.forEach((h) => h.visible = v))

renderer.setAnimationLoop(() => {
  controls.update()
  stepBake()
  renderer.render(scene, camera)
})
