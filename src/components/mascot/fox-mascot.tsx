"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import "./fox-mascot.css";

export type PulseLoginMood = "idle" | "email" | "password" | "otp" | "busy" | "success" | "error";

export const LOCAL_MODEL_URL = "/models/pulse-fox.glb";
export const CDN_MODEL_URL = "https://cdn.imageurlgenerator.com/uploads/1b577b81-86cd-42b1-8b3f-895c32131ceb.glb";

export const LOCAL_POSTER_URL = "/images/pulse-fox-poster.webp";
export const CDN_POSTER_URL = "https://cdn.21st.dev/assets/mirror/96/9645a9f3d6adc8fe2306500cfe92fbaf2ff11d6ffb5867c7bb021833a70ea681.webp";

export type FoxState = {
  mood: PulseLoginMood;
  typing: boolean;
  reduced: boolean;
  peeking?: boolean;
  mobile?: boolean;
};

type Phase = {
  kind: "turning" | "walking" | "sitting" | "standing";
  age: number;
  duration: number;
  from: number;
  to: number;
};

const smooth = (t: number) => t * t * (3 - 2 * t);
const near = (a: number, b: number) => Math.abs(a - b) < 0.001;
const angleDelta = (from: number, to: number) =>
  Math.atan2(Math.sin(to - from), Math.cos(to - from));

function earFlick(age: number) {
  if (age < 0 || age > 0.9) return 0;
  return 0.16 * Math.sin((age / 0.9) * Math.PI * 2) * Math.sin((age / 0.9) * Math.PI);
}

export function createFoxMotion(initial: FoxState) {
  let state = initial;
  let time = 0;
  let earAge = 10;
  let progress = 0;
  let yaw = -0.12;
  let sit = 0;
  let tailPhase = 0;
  let tailSpeed = 1.8;
  let tailAmplitude = 0.02;
  let peek = 0;
  let lookDown = 0;
  let phase: Phase | null = null;

  const destination = () =>
    !state.mobile && (state.mood === "email" || state.mood === "otp") ? 1 : 0;
  const facing = () =>
    state.mood === "password" ? Math.PI : destination() ? 0.65 : -0.12;

  const plan = () => {
    const target = destination();
    const desiredSit = state.mood === "password" ? 1 : 0;
    const needsTravel = !near(progress, target);
    const targetYaw = needsTravel ? (target > progress ? Math.PI / 2 : -Math.PI / 2) : facing();
    const delta = angleDelta(yaw, targetYaw);

    if (sit > 0 && (needsTravel || Math.abs(delta) > 0.001 || !desiredSit)) {
      phase = { kind: "standing", age: 0, duration: 0.6, from: sit, to: 0 };
    } else if (Math.abs(delta) > 0.001) {
      phase = {
        kind: "turning",
        age: 0,
        duration: Math.max(1, Math.abs(delta) * 0.8),
        from: yaw,
        to: yaw + delta,
      };
    } else if (needsTravel) {
      phase = {
        kind: "walking",
        age: 0,
        duration: 2.1 * Math.abs(target - progress),
        from: progress,
        to: target,
      };
    } else if (!near(sit, desiredSit)) {
      phase = { kind: "sitting", age: 0, duration: 0.8, from: sit, to: desiredSit };
    }
  };

  return {
    setState(next: FoxState) {
      const enteringMobile = next.mobile && !state.mobile;
      if (
        next.mood !== state.mood ||
        (next.typing && !state.typing) ||
        next.peeking !== state.peeking
      ) {
        earAge = 0;
      }
      state = next;

      if (state.mobile && (enteringMobile || progress !== 0)) {
        progress = 0;
        if (phase?.kind === "walking" || phase?.kind === "turning") phase = null;
        if (state.mood === "email" || state.mood === "otp") yaw = -0.12;
      }
    },
    sample(dt: number) {
      time += dt;
      earAge += dt;
      let gait = 0;
      let activity: Phase["kind"] | "resting" = "resting";

      if (state.reduced) {
        progress = destination();
        yaw = facing();
        sit = state.mood === "password" ? 1 : 0;
        phase = null;
      } else {
        if (!phase) plan();
        if (phase) {
          activity = phase.kind;
          phase.age = Math.min(phase.duration, phase.age + dt);
          const t = phase.age / phase.duration;
          const eased = smooth(t);
          const value = phase.from + (phase.to - phase.from) * eased;
          if (phase.kind === "turning") yaw = value;
          else if (phase.kind === "walking") progress = value;
          else sit = value;
          gait = phase.kind === "walking" || phase.kind === "turning" ? eased : 0;
          if (t === 1) phase = null;
        }
      }

      const peekTarget =
        state.peeking && state.mood === "password" && sit > 0.99 && activity === "resting" ? 1 : 0;
      peek = state.reduced ? peekTarget : peek + (peekTarget - peek) * (1 - Math.exp(-dt / 0.24));

      const lookDownTarget =
        state.mobile && (state.mood === "email" || state.mood === "otp") && sit < 0.01 ? 1 : 0;
      lookDown = state.reduced
        ? lookDownTarget
        : lookDown + (lookDownTarget - lookDown) * (1 - Math.exp(-dt / 0.28));

      if (!state.reduced) {
        const settling = 1 - Math.exp(-dt / 0.65);
        tailSpeed += (1.8 + sit * 0.6 - tailSpeed) * settling;
        tailAmplitude += (0.02 + sit * 0.06 - tailAmplitude) * settling;
        tailPhase = (tailPhase + tailSpeed * dt) % (Math.PI * 2);
      }

      return {
        progress,
        yaw,
        sit,
        gait,
        activity,
        peek,
        lookDown,
        walking: activity === "walking" || activity === "turning",
        earLeft: state.reduced ? 0 : earFlick(Math.min(earAge, time % 6.8)),
        earRight: state.reduced ? 0 : -earFlick(Math.min(earAge - 0.14, (time + 3.1) % 8.3)),
        tail: state.reduced ? 0 : Math.sin(tailPhase) * tailAmplitude,
        breath: state.reduced || activity !== "resting" ? 1 : 1 + Math.sin(time * 1.8) * 0.0015,
      };
    },
  };
}

export type PulseFoxController = {
  setState: (state: FoxState) => void;
  dispose: () => void;
};

export async function createPulseFox(
  host: HTMLElement,
  initial: FoxState
): Promise<PulseFoxController> {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 30);
  camera.position.set(0.1, 1.08, 4.2);
  camera.lookAt(0, 0.85, 0.12);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.06);
  room.dispose();
  pmrem.dispose();
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.8;

  scene.add(new THREE.HemisphereLight(0xf8fbff, 0xb4c5e6, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 2.7);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe1ebff, 1.1);
  fill.position.set(3, 2, 1);
  scene.add(fill);

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  let gltf;
  try {
    try {
      gltf = await loader.loadAsync(LOCAL_MODEL_URL);
    } catch {
      gltf = await loader.loadAsync(CDN_MODEL_URL);
    }
  } catch (error) {
    environment.dispose();
    renderer.dispose();
    throw error;
  }

  const model = gltf.scene;
  model.rotation.y = -0.12;
  scene.add(model);

  const morphs: THREE.Mesh[] = [];
  const blinkUniform = { value: 0 };

  model.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.frustumCulled = false;
      if (object.morphTargetDictionary) morphs.push(object);
      if (object.morphTargetDictionary?.Blink25 !== undefined) object.visible = false;

      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (material instanceof THREE.MeshStandardMaterial) {
          material.metalness = 0;
          material.envMapIntensity = 0.6;
          if ((object.name === "Pulse_Fox" || object.name === "Pulse Fox") && material.map) {
            const positions = object.geometry.getAttribute("position");
            const uvs = object.geometry.getAttribute("uv");

            const restScale = 0.8500864244706463;
            const restCenter = new THREE.Vector3(
              -0.000786125659942627,
              0.8498990796797443,
              0.002342313528060913
            );
            const restPositions = new THREE.Float32BufferAttribute(
              new Float32Array(positions.count * 3),
              3
            );
            for (let i = 0; i < positions.count; i++) {
              restPositions.setXYZ(
                i,
                positions.getX(i) * restScale + restCenter.x,
                positions.getY(i) * restScale + restCenter.y,
                positions.getZ(i) * restScale + restCenter.z
              );
            }
            object.geometry.setAttribute("pulseRestPosition", restPositions);

            const sampleUv = (x: number, y: number, z: number) => {
              let closest = 0;
              let distance = Infinity;
              for (let i = 0; i < positions.count; i++) {
                const d =
                  (restPositions.getX(i) - x) ** 2 +
                  (restPositions.getY(i) - y) ** 2 +
                  (restPositions.getZ(i) - z) ** 2;
                if (d < distance) {
                  distance = d;
                  closest = i;
                }
              }
              return new THREE.Vector2(uvs.getX(closest), uvs.getY(closest));
            };

            const furLeft = sampleUv(-0.12, 1.3, 0.6);
            const furRight = sampleUv(0.12, 1.3, 0.6);
            const cheekLeft = sampleUv(-0.22, 0.91, 0.59);
            const cheekRight = sampleUv(0.22, 0.91, 0.59);

            material.onBeforeCompile = (shader) => {
              shader.uniforms.pulseBlink = blinkUniform;
              shader.uniforms.pulseFurLeft = { value: furLeft };
              shader.uniforms.pulseFurRight = { value: furRight };
              shader.uniforms.pulseCheekLeft = { value: cheekLeft };
              shader.uniforms.pulseCheekRight = { value: cheekRight };
              shader.vertexShader =
                "attribute vec3 pulseRestPosition;\nvarying vec3 vPulseRest;\n" +
                shader.vertexShader;
              shader.vertexShader = shader.vertexShader.replace(
                "#include <begin_vertex>",
                "#include <begin_vertex>\nvPulseRest = pulseRestPosition;"
              );
              shader.fragmentShader =
                `varying vec3 vPulseRest;
uniform float pulseBlink;
uniform vec2 pulseFurLeft, pulseFurRight, pulseCheekLeft, pulseCheekRight;
` + shader.fragmentShader;
              shader.fragmentShader = shader.fragmentShader.replace(
                "#include <map_fragment>",
                `#include <map_fragment>
if (pulseBlink > 0.001 && vPulseRest.z > 0.50) {
  vec2 eye = vec2((abs(vPulseRest.x) - 0.188) / 0.139, (vPulseRest.y - 1.069) / 0.151);
  float extent = sqrt(max(0.0, 1.0 - eye.x * eye.x));
  float area = 1.0 - smoothstep(0.97, 1.025, dot(eye, eye));
  float upperEdge = extent * (1.0 - 1.65 * pulseBlink);
  float lowerEdge = extent * (-1.0 + 0.35 * pulseBlink);
  float upper = smoothstep(upperEdge - 0.025, upperEdge + 0.025, eye.y);
  float lower = 1.0 - smoothstep(lowerEdge - 0.025, lowerEdge + 0.025, eye.y);
  vec2 furUv = vPulseRest.x < 0.0 ? pulseFurLeft : pulseFurRight;
  vec2 cheekUv = vPulseRest.x < 0.0 ? pulseCheekLeft : pulseCheekRight;
  vec3 furColor = texture2D(map, furUv).rgb;
  vec3 cheekColor = texture2D(map, cheekUv).rgb;
  float coverage = min(1.0, upper + lower);
  vec3 lidColor = mix(cheekColor, furColor, upper / max(upper + lower, 0.001));
  diffuseColor.rgb = mix(diffuseColor.rgb, lidColor, coverage * area);
  float seam = (1.0 - smoothstep(0.006, 0.018, abs(eye.y + extent * 0.65))) * smoothstep(0.94, 1.0, pulseBlink);
  diffuseColor.rgb = mix(diffuseColor.rgb, furColor * 0.28, seam * area);
}`
              );
            };
            material.customProgramCacheKey = () => "pulse-surface-blink-fur-seam-9";
          }
        }
      }
    }
  });

  const approach = gltf.animations.find((clip) => clip.name === "Pulse_Approach");
  if (!approach) throw new Error("Pulse fox is missing its footfall animation");

  const legNames = new Set(
    [5, 6, 7, 10, 11, 12, 24, 25, 26, 30, 31, 32].map((id) => `Bone_${String(id).padStart(3, "0")}`)
  );
  const footfalls = new THREE.AnimationClip(
    "Footfalls",
    approach.duration,
    approach.tracks.filter((track) => {
      const [name, property] = track.name.split(".");
      return (
        property === "quaternion" &&
        (legNames.has(name) || name.startsWith("Pulse_Forearm_Twist_"))
      );
    })
  );

  const mixer = new THREE.AnimationMixer(model);
  const stride = mixer.clipAction(footfalls).setLoop(THREE.LoopOnce, 1).play();
  stride.clampWhenFinished = true;
  stride.paused = true;

  const seated = gltf.animations.find((clip) => clip.name === "Pulse_Sit");
  if (!seated) throw new Error("Pulse fox is missing its sitting pose");
  const sitAction = mixer.clipAction(seated).play();
  sitAction.paused = true;
  sitAction.time = 0;
  sitAction.setEffectiveWeight(0);

  const tail = model.getObjectByName("Bone_002");
  const tailRest = tail?.quaternion.clone();
  model.updateMatrixWorld(true);

  const tailAxis = new THREE.Vector3(0, 1, 0);
  if (tail) tailAxis.applyQuaternion(tail.getWorldQuaternion(new THREE.Quaternion()).invert());
  const tailRotation = new THREE.Quaternion();

  const ears = ["Bone_046", "Bone_049"].map((name) => {
    const bone = model.getObjectByName(name);
    return bone ? { bone, rest: bone.quaternion.clone() } : null;
  });
  const earRotation = new THREE.Quaternion();
  const earAxis = new THREE.Vector3(0, 0, 1);

  const peekBones = [
    { name: "Bone_020", angle: -0.28, down: 0.1 },
    { name: "Bone_019", angle: -1.2, down: 0.27 },
  ].flatMap(({ name, angle, down }) => {
    const bone = model.getObjectByName(name);
    return bone ? [{ bone, angle, down, rest: bone.quaternion.clone() }] : [];
  });

  const peekAxis = new THREE.Vector3();
  const peekParentRotation = new THREE.Quaternion();
  const peekRotation = new THREE.Quaternion();
  const headModelRotation = new THREE.Quaternion();

  const mobileLayout = window.matchMedia("(max-width: 900px)");
  const motion = createFoxMotion({ ...initial, mobile: mobileLayout.matches });
  const basePosition = model.position.clone();
  const baseScale = model.scale.clone();
  let travel = 0.46;
  let radialExtent = 0.82;

  const soleMesh = model.getObjectByName("Pulse_Fox") ?? model.getObjectByName("Pulse Fox");
  const soles: number[] = [];
  const solePoint = new THREE.Vector3();
  if (soleMesh instanceof THREE.SkinnedMesh) {
    const positions = soleMesh.geometry.getAttribute("position");
    radialExtent = 0;
    for (let i = 0; i < positions.count; i++)
      radialExtent = Math.max(radialExtent, Math.hypot(positions.getX(i), positions.getZ(i)));
    let lowest = Infinity;
    for (let i = 0; i < positions.count; i++) lowest = Math.min(lowest, positions.getY(i));
    const candidates: number[] = [];
    for (let i = 0; i < positions.count; i++)
      if (positions.getY(i) < lowest + 0.025) candidates.push(i);
    const step = Math.max(1, Math.floor(candidates.length / 120));
    for (let i = 0; i < candidates.length; i += step) soles.push(candidates[i]);
  }

  const soleHeight = () => {
    if (!(soleMesh instanceof THREE.SkinnedMesh) || !soles.length) return 0;
    model.updateMatrixWorld(true);
    let lowest = Infinity;
    for (const index of soles) {
      soleMesh.getVertexPosition(index, solePoint);
      soleMesh.localToWorld(solePoint);
      lowest = Math.min(lowest, solePoint.y);
    }
    return lowest;
  };
  const floorHeight = soleHeight();
  const ground = host.parentElement?.querySelector<HTMLElement>(".ims-fox-ground");

  let state = initial;
  let running = true;
  let inView = true;
  let raf = 0;
  let previous = performance.now();
  let elapsed = 0;
  let nextBlink = 2.5;
  let blinkStart = -10;

  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    travel = mobileLayout.matches ? 0 : width < 400 ? 0.24 : 0.46;
    motion.setState({ ...state, mobile: mobileLayout.matches });
    renderer.setSize(width, height, false);
    camera.aspect = width / height;

    const halfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const horizontalSlope = halfFov * camera.aspect;
    const fitDistance =
      (radialExtent * Math.sqrt(1 + horizontalSlope * horizontalSlope) + travel / 2 + 0.1) /
      horizontalSlope;
    camera.position.set(travel / 2, 1.08, Math.max(4.2, fitDistance));
    camera.lookAt(travel / 2, 0.85, 0);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };

  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const visibility = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    resume();
  });
  visibility.observe(host);
  host.appendChild(renderer.domElement);

  const loseContext = (event: Event) => {
    event.preventDefault();
    running = false;
  };
  renderer.domElement.addEventListener("webglcontextlost", loseContext);
  const restoreContext = () => {
    running = true;
    resume();
  };
  renderer.domElement.addEventListener("webglcontextrestored", restoreContext);

  function tick(now: number) {
    raf = 0;
    if (!running || document.hidden || !inView) return;
    const dt = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    elapsed += dt;
    const pose = motion.sample(dt);

    stride.time = pose.gait * footfalls.duration;
    stride.setEffectiveWeight(1 - pose.sit);
    sitAction.setEffectiveWeight(pose.sit);

    peekBones.forEach(({ bone, rest }) => bone.quaternion.copy(rest));
    mixer.update(0);
    peekBones.forEach(({ bone, rest }) => rest.copy(bone.quaternion));

    host.dataset.motion = pose.activity;
    host.dataset.posture = pose.sit > 0.99 ? "seated" : "standing";

    if (tail && tailRest)
      tail.quaternion.copy(tailRest).multiply(tailRotation.setFromAxisAngle(tailAxis, pose.tail));
    ears.forEach((ear, index) => {
      if (ear)
        ear.bone.quaternion
          .copy(ear.rest)
          .multiply(earRotation.setFromAxisAngle(earAxis, index ? pose.earRight : pose.earLeft));
    });

    model.position.set(
      basePosition.x + pose.progress * travel,
      basePosition.y,
      basePosition.z + pose.progress * 0.07
    );
    model.rotation.set(0, pose.yaw, 0);
    model.scale.set(baseScale.x, baseScale.y * pose.breath, baseScale.z);
    model.updateMatrixWorld(true);

    model.getWorldQuaternion(headModelRotation);
    for (const { bone, angle, down } of peekBones) {
      if (!bone.parent || (pose.peek < 0.0001 && pose.lookDown < 0.0001)) continue;
      bone.parent.getWorldQuaternion(peekParentRotation);
      peekParentRotation.invert();
      if (pose.peek >= 0.0001) {
        peekAxis.set(0, 1, 0).applyQuaternion(peekParentRotation);
        bone.quaternion.premultiply(peekRotation.setFromAxisAngle(peekAxis, angle * pose.peek));
      }
      if (pose.lookDown >= 0.0001) {
        peekAxis.set(1, 0, 0).applyQuaternion(headModelRotation).applyQuaternion(peekParentRotation);
        bone.quaternion.premultiply(peekRotation.setFromAxisAngle(peekAxis, down * pose.lookDown));
      }
      bone.updateMatrixWorld(true);
    }

    model.position.y += floorHeight - soleHeight();

    if (ground) {
      const visibleWidth =
        2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect;
      ground.style.transform = `translateX(${(pose.progress * travel / visibleWidth) * host.clientWidth}px)`;
      ground.style.opacity = "1";
    }

    if (elapsed >= nextBlink && !state.reduced) {
      blinkStart = elapsed;
      nextBlink = elapsed + 3.2 + Math.random() * 2.3;
    }
    const blinkAge = elapsed - blinkStart;
    const ease = (t: number) => t * t * (3 - 2 * t);
    const blink =
      state.reduced || blinkAge < 0 || blinkAge > 0.25
        ? 0
        : blinkAge < 0.075
        ? ease(blinkAge / 0.075)
        : blinkAge < 0.095
        ? 1
        : 1 - ease((blinkAge - 0.095) / 0.155);
    blinkUniform.value = blink;

    for (const mesh of morphs) {
      const dict = mesh.morphTargetDictionary!;
      const values = mesh.morphTargetInfluences!;
      if (dict.Blink25 !== undefined) mesh.visible = false;
      if (dict.Blink !== undefined) values[dict.Blink] = 0;
      if (dict.Gaze !== undefined) values[dict.Gaze] = 0;
    }

    renderer.render(scene, camera);
    if (!state.reduced) raf = requestAnimationFrame(tick);
  }

  function resume() {
    if (!raf && running && !document.hidden && inView) {
      previous = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }

  document.addEventListener("visibilitychange", resume);
  resize();
  resume();

  return {
    setState(next) {
      state = next;
      motion.setState({ ...next, mobile: mobileLayout.matches });
      resume();
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", resume);
      renderer.domElement.removeEventListener("webglcontextlost", loseContext);
      renderer.domElement.removeEventListener("webglcontextrestored", restoreContext);
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
      const textures = new Set<THREE.Texture>();
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const mats = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of mats) {
          for (const value of Object.values(material)) {
            if (value instanceof THREE.Texture) textures.add(value);
          }
          material.dispose();
        }
        if (object instanceof THREE.SkinnedMesh) object.skeleton.dispose();
      });
      textures.forEach((texture) => texture.dispose());
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

export const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener?.("change", sync);
    return () => query.removeEventListener?.("change", sync);
  }, []);
  return reduced;
};

export const PulseLoginMascot = ({
  mood,
  typing = false,
  peeking = false,
}: {
  mood: PulseLoginMood;
  typing?: boolean;
  peeking?: boolean;
}) => {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<PulseFoxController | null>(null);
  const reduced = usePrefersReducedMotion();
  const latest = useRef({ mood, typing, peeking, reduced: Boolean(reduced) });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    latest.current = { mood, typing, peeking, reduced: Boolean(reduced) };
    controller.current?.setState(latest.current);
  }, [mood, typing, peeking, reduced]);

  useEffect(() => {
    let disposed = false;
    const element = host.current;
    if (!element) return;

    const fallbackTimer = window.setTimeout(() => {
      if (!disposed && !controller.current) setShowFallback(true);
    }, 650);

    void createPulseFox(element, latest.current)
      .then((scene) => {
        if (disposed) {
          scene.dispose();
          return;
        }
        controller.current = scene;
        scene.setState(latest.current);
        setShowFallback(false);
        setReady(true);
      })
      .catch((error) => {
        if (!disposed) {
          setFailed(true);
          setShowFallback(true);
        }
        console.error("Interactive mascot failed to initialize", error);
      });

    return () => {
      disposed = true;
      window.clearTimeout(fallbackTimer);
      controller.current?.dispose();
      controller.current = null;
    };
  }, []);

  return (
    <div
      className="ims-fox"
      data-motion-version="interactive-mascot-sign-in-1"
      data-mood={mood}
      data-typing={typing}
      data-renderer={ready ? "webgl" : failed ? "poster" : "loading"}
    >
      <div className="ims-fox-ground" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={`ims-fox-poster${showFallback && !ready ? " is-visible" : ""}`}
        src={LOCAL_POSTER_URL}
        onError={(e) => {
          e.currentTarget.src = CDN_POSTER_URL;
        }}
        alt=""
        aria-hidden="true"
      />
      <div
        ref={host}
        aria-hidden="true"
        className={`ims-fox-canvas${ready ? " is-ready" : ""}`}
      />
    </div>
  );
};
