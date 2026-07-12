import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import "./style.css";

// 3D空間
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202030);

// カメラ
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

camera.position.set(5, 4, 7);

// レンダラー
const renderer = new THREE.WebGLRenderer({
  antialias: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

// マウス操作
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.5, 0);

// 地面
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.9,
  }),
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// 動作確認用の立方体
const box = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({
    color: 0xff6633,
    roughness: 0.5,
  }),
);

box.position.y = 0.5;
box.castShadow = true;
scene.add(box);

// 空からの光
const hemisphereLight = new THREE.HemisphereLight(
  0x8899ff,
  0x442211,
  1.5,
);

scene.add(hemisphereLight);

// 夕陽を想定した光
const sunLight = new THREE.DirectionalLight(0xffaa66, 3);

sunLight.position.set(-5, 6, 3);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);

scene.add(sunLight);

// ウィンドウサイズ変更
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// アニメーション
const clock = new THREE.Clock();

function animate() {
  const elapsedTime = clock.getElapsedTime();

  box.rotation.x = elapsedTime * 0.4;
  box.rotation.y = elapsedTime * 0.7;

  controls.update();
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);