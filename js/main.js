import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { LightProbeGrid } from "three/addons/lighting/LightProbeGrid.js";
import { pass, mrt, normalView, builtinAOContext, screenUV, uniform, mix, convertToTexture, vec4 } from "three/tsl";
import { ao } from "three/addons/tsl/display/GTAONode.js";
import { denoise } from "three/addons/tsl/display/DenoiseNode.js";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import GUI from "lil-gui";

// some funcs for making stuff
function light(x,y,z, color, intensity, distance, decay) {
  const lamp = new THREE.PointLight(color, intensity, distance, decay)
  lamp.position.x = x
  lamp.position.y = y
  lamp.position.z = z
  lamp.castShadow = true
  lamp.shadow.mapSize.set(1024, 1024)
  lamp.shadow.bias = -0.0004
  lamp.shadow.normalBias = 0.02
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
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, .66, 20, 10),
    new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.01, roughness: 0.5 })
  )
  mesh.position.x = x
  mesh.position.y = 1.085
  mesh.position.z = z
  mesh.receiveShadow = true
  mesh.castShadow = true
  return mesh
}

function bucket(x,y,z, w, h, t) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, w, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, w-t, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 64 })
  geometry.rotateX(-Math.PI / 2)
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.01, roughness: 0.5 })
  )
  mesh.position.set(x, y, z)
  mesh.receiveShadow = true
  mesh.castShadow = true
  return mesh
}

function pool(x,y,z, r, c, i) {
  const geometry = new THREE.CircleGeometry(r, 64)
  geometry.rotateX(-Math.PI / 2)
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: 0x000000, emissive: c, emissiveIntensity: i, roughness: 0.2 })
  )
  mesh.position.set(x, y, z)
  return mesh
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

renderer.setPixelRatio(1) // disable retina rendering: renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(1920, 1080, false)
renderer.setClearColor(0x000000) // this contributes to GI lighting
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.VSMShadowMap
renderer.toneMapping = THREE.NeutralToneMapping
renderer.toneMappingExposure = 0.95

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

// and a bucket
scene.add(bucket(1.6, 0.79, 0, 0.30, 0.2, 0.05))
scene.add(pool(1.6, 0.96, 0, 0.25, 0xff0000, 6.5))

// lighting
const lighta = light(-2, 1.70, 0, 0xffaa99, 2.2, 5, .5)
const lightb = light(2, 1.70, 0, 0x99aaff, 1.75, 5, .5)
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
    probes.forEach((g) => g.visible = true)

    job.next += count
    if (job.next >= totalProbes) {
      job.next = 0
      job.pass++
    }
    if (job.pass > conf.bounces) {
      job.running = false
    }
  })
}

// swapping to use a render pipeline, droping renderer.render(scene, camera), so AO etc. can happen.
const prePass = pass(scene, camera)
prePass.setMRT(mrt({ output: normalView }))

const aoPass = ao(prePass.getTextureNode("depth"), prePass.getTextureNode(), camera)
aoPass.resolutionScale = 0.5 // lower resolution to have better speed

const aoDenoised = convertToTexture(denoise(aoPass.getTextureNode(), prePass.getTextureNode("depth"), prePass.getTextureNode(), camera))

const scenePass = pass(scene, camera)
scenePass.contextNode = builtinAOContext(mix(1, aoDenoised.sample(screenUV).r, 0.75)) // tone down AO a bit, 0.75 just looks nicer

const scenePassColor = scenePass.getTextureNode()
const bloomPass = bloom(scenePassColor, 0.75, 0.5, 0.5)
bloomPass.smoothWidth.value = 1.5

const tint = uniform(new THREE.Color(1, 0.95, 0.9))

const pipeline = new THREE.RenderPipeline(renderer, scenePassColor.add(bloomPass).mul(vec4(tint, 1)))


renderer.setAnimationLoop(() => {
  controls.update()
  stepBake()
  pipeline.render()
})

// a small debug gui
const gui = new GUI()
// const gi = { enabled: true, }
gui.add(lighta, "intensity", 0, 10).name("light a").onFinishChange(startBake)
gui.add(lightb, "intensity", 0, 10).name("light b").onFinishChange(startBake)
gui.add(tint.value, "r", 0, 2).name("tint red")
gui.add(tint.value, "g", 0, 2).name("tint green")
gui.add(tint.value, "b", 0, 2).name("tint blue")
// gui.add(gi, "enabled").name("GI enabled").onChange((v) => probes.forEach((g) => g.visible = v))

