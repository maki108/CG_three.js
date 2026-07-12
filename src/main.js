import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createKaiju } from "./kaiju.js";
import {
  createDestructionSystem,
} from "./destruction.js";
import "./style.css";

// ============================================================
// 基本設定
// ============================================================

const scene = new THREE.Scene();

// 夕暮れの背景色
const sunsetColor = new THREE.Color(0x70445f);
scene.background = sunsetColor;

// 遠くの建物を夕焼け色に溶け込ませる
scene.fog = new THREE.Fog(sunsetColor, 28, 75);

// カメラ
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  200,
);

camera.position.set(20, 13, 23);

// レンダラー
const renderer = new THREE.WebGLRenderer({
  antialias: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);

// 内蔵GPUの負荷を抑えるため上限を1.5にする
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

document.body.appendChild(renderer.domElement);

// ============================================================
// マウス操作
// ============================================================

const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.dampingFactor = 0.06;

controls.target.set(0, 3, 0);

controls.minDistance = 8;
controls.maxDistance = 65;

// 地面より下にカメラが回り込まないようにする
controls.maxPolarAngle = Math.PI / 2.05;

// ============================================================
// 光源
// ============================================================

// 空からの弱い環境光
const hemisphereLight = new THREE.HemisphereLight(
  0x7084bb, // 空側の青紫色
  0x4a251b, // 地面側の暗い赤色
  1.3,
);

scene.add(hemisphereLight);

// 夕陽
const sunLight = new THREE.DirectionalLight(0xff9a55, 4.5);

sunLight.position.set(-25, 18, -30);
sunLight.target.position.set(0, 0, 0);

sunLight.castShadow = true;

// UHD Graphics 620向けに、まず1024で開始
sunLight.shadow.mapSize.set(1024, 1024);

sunLight.shadow.camera.left = -30;
sunLight.shadow.camera.right = 30;
sunLight.shadow.camera.top = 30;
sunLight.shadow.camera.bottom = -30;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 80;

sunLight.shadow.bias = -0.0002;

scene.add(sunLight);
scene.add(sunLight.target);

// 夕陽と反対側から当たる青紫色の補助光
const fillLight = new THREE.DirectionalLight(
  0x7186c9,
  1.4,
);

fillLight.position.set(18, 12, 20);

// 影は夕陽だけで作るため、補助光には影を付けない
fillLight.castShadow = false;

scene.add(fillLight);

// ============================================================
// 背景の太陽
// ============================================================

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(3.2, 32, 32),
  new THREE.MeshBasicMaterial({
    color: 0xffb35c,
    fog: false,
  }),
);

// カメラから見て都市の奥側に配置
sun.position.set(-17, 13, -48);

scene.add(sun);

// ============================================================
// 地面
// ============================================================

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.MeshStandardMaterial({
    color: 0x342c2b,
    roughness: 1,
  }),
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;

scene.add(ground);

// ============================================================
// 道路
// ============================================================

const roadMaterial = new THREE.MeshStandardMaterial({
  color: 0x24262b,
  roughness: 0.95,
});

// 縦方向の道路
const verticalRoad = new THREE.Mesh(
  new THREE.PlaneGeometry(5.5, 80),
  roadMaterial,
);

verticalRoad.rotation.x = -Math.PI / 2;
verticalRoad.position.y = 0.015;
verticalRoad.receiveShadow = true;

scene.add(verticalRoad);

// 横方向の道路
const horizontalRoad = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 5.5),
  roadMaterial,
);

horizontalRoad.rotation.x = -Math.PI / 2;
horizontalRoad.position.y = 0.02;
horizontalRoad.receiveShadow = true;

scene.add(horizontalRoad);

// ============================================================
// 道路の中央線
// ============================================================

const roadLineMaterial = new THREE.MeshBasicMaterial({
  color: 0xe8d6a0,
});

// 縦道路の中央線
for (let z = -36; z <= 36; z += 4) {
  const line = new THREE.Mesh(
    new THREE.PlaneGeometry(0.13, 2.1),
    roadLineMaterial,
  );

  line.rotation.x = -Math.PI / 2;
  line.position.set(0, 0.035, z);

  scene.add(line);
}

// 横道路の中央線
for (let x = -36; x <= 36; x += 4) {
  const line = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 0.13),
    roadLineMaterial,
  );

  line.rotation.x = -Math.PI / 2;
  line.position.set(x, 0.04, 0);

  scene.add(line);
}

// ============================================================
// 建物用テクスチャ
// ============================================================

function createWindowTexture(patternNumber) {
  const canvas = document.createElement("canvas");

  canvas.width = 128;
  canvas.height = 256;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas 2D contextを取得できませんでした。");
  }

  // 外壁
  context.fillStyle = "#3b3e46";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const columns = 4;
  const rows = 8;

  const windowWidth = 17;
  const windowHeight = 18;

  const startX = 10;
  const startY = 10;

  const intervalX = 29;
  const intervalY = 30;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const value =
        (row * 7 + column * 11 + patternNumber * 13) % 6;

      // 一部の部屋のみ点灯
      const isLit = value !== 0 && value !== 3;

      context.fillStyle = isLit ? "#ffc875" : "#171b25";

      context.fillRect(
        startX + column * intervalX,
        startY + row * intervalY,
        windowWidth,
        windowHeight,
      );
    }
  }

  const texture = new THREE.CanvasTexture(canvas);

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;

  return texture;
}

// Canvasから直接テクスチャを作るCanvasTextureを利用
const buildingTextures = [
  createWindowTexture(0),
  createWindowTexture(1),
  createWindowTexture(2),
];

const buildingMaterials = buildingTextures.map(
  (texture, index) =>
    new THREE.MeshStandardMaterial({
      map: texture,
      color: [
        new THREE.Color(0xc2b6ad),
        new THREE.Color(0xaeb3bd),
        new THREE.Color(0xb69f98),
      ][index],
      roughness: 0.85,
      metalness: 0,
    }),
);

const roofMaterial = new THREE.MeshStandardMaterial({
  color: 0x39363a,
  roughness: 0.95,
});

// ============================================================
// 疑似乱数
// ============================================================

function pseudoRandom(x, z, offset = 0) {
  const value =
    Math.sin(x * 12.9898 + z * 78.233 + offset * 37.719) *
    43758.5453;

  return value - Math.floor(value);
}

// ============================================================
// 建物を作る
// ============================================================

const cityGroup = new THREE.Group();
scene.add(cityGroup);

function createBuilding(gridX, gridZ) {
  const x = gridX * 4.1;
  const z = gridZ * 4.1;

  const width = 2.3 + pseudoRandom(gridX, gridZ, 1) * 0.8;
  const depth = 2.3 + pseudoRandom(gridX, gridZ, 2) * 0.8;
  const height = 3.5 + pseudoRandom(gridX, gridZ, 3) * 9;

  const materialNumber = Math.floor(
    pseudoRandom(gridX, gridZ, 4) * buildingMaterials.length,
  );

  const wallMaterial = buildingMaterials[materialNumber];

  // BoxGeometryの各面に材質を割り当てる
  const materials = [
    wallMaterial,
    wallMaterial,
    roofMaterial,
    roofMaterial,
    wallMaterial,
    wallMaterial,
  ];

  const building = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    materials,
  );

  building.position.set(x, height / 2, z);

  building.castShadow = true;
  building.receiveShadow = true;

  building.userData.type = "building";
  building.userData.gridPosition = { gridX, gridZ };

  cityGroup.add(building);
}

// 7×7区画を作り、中央道路の部分を空ける
for (let gridX = -3; gridX <= 3; gridX += 1) {
  for (let gridZ = -3; gridZ <= 3; gridZ += 1) {
    // 中央の十字道路
    if (gridX === 0 || gridZ === 0) {
      continue;
    }

    createBuilding(gridX, gridZ);
  }
}

// ============================================================
// 街灯の外見
// ============================================================

const lampMaterial = new THREE.MeshStandardMaterial({
  color: 0x2b2b30,
  roughness: 0.7,
});

const lampLightMaterial = new THREE.MeshStandardMaterial({
  color: 0xffd28a,
  emissive: 0xff8c35,
  emissiveIntensity: 3,
});

function createStreetLamp(x, z) {
  const lampGroup = new THREE.Group();

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 2.2, 8),
    lampMaterial,
  );

  pole.position.y = 1.1;

  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 12, 12),
    lampLightMaterial,
  );

  lamp.position.y = 2.2;

  lampGroup.add(pole);
  lampGroup.add(lamp);

  lampGroup.position.set(x, 0, z);

  scene.add(lampGroup);
}

// 実際のPointLightを大量に置くと重いため、発光材質で表現
for (let position = -16; position <= 16; position += 4) {
  if (Math.abs(position) < 2) {
    continue;
  }

  createStreetLamp(-3.2, position);
  createStreetLamp(3.2, position);

  createStreetLamp(position, -3.2);
  createStreetLamp(position, 3.2);
}

// ============================================================
// 怪獣
// ============================================================

const kaiju = createKaiju();

scene.add(kaiju.group);

// ============================================================
// 建物崩壊システム
// ============================================================

const destructionSystem =
  createDestructionSystem(scene);

// ============================================================
// マウスクリック判定
// ============================================================

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const pointerDownPosition = {
  x: 0,
  y: 0,
};

function findInteractiveObject(object) {
  let currentObject = object;

  while (currentObject) {
    if (
      currentObject.userData.type === "building" ||
      currentObject.userData.type === "kaiju"
    ) {
      return currentObject;
    }

    currentObject = currentObject.parent;
  }

  return null;
}

renderer.domElement.addEventListener(
  "pointerdown",
  (event) => {
    pointerDownPosition.x = event.clientX;
    pointerDownPosition.y = event.clientY;
  },
);

renderer.domElement.addEventListener(
  "pointerup",
  (event) => {
    // カメラをドラッグした場合はクリックとして扱わない
    const movedDistance = Math.hypot(
      event.clientX - pointerDownPosition.x,
      event.clientY - pointerDownPosition.y,
    );

    if (movedDistance > 6 || event.button !== 0) {
      return;
    }

    const canvasRect =
      renderer.domElement.getBoundingClientRect();

    pointer.x =
      ((event.clientX - canvasRect.left) /
        canvasRect.width) *
        2 -
      1;

    pointer.y =
      -(
        (event.clientY - canvasRect.top) /
        canvasRect.height
      ) *
        2 +
      1;

    raycaster.setFromCamera(pointer, camera);

    const intersections =
      raycaster.intersectObjects(
        [cityGroup, kaiju.group],
        true,
      );

    if (intersections.length === 0) {
      return;
    }

    const target = findInteractiveObject(
      intersections[0].object,
    );

    if (!target) {
      return;
    }

    if (target.userData.type === "kaiju") {
      kaiju.roar();
      return;
    }

    if (target.userData.type === "building") {
      destructionSystem.destroyBuilding(target);
    }
  },
);

// ============================================================
// ウィンドウサイズ変更
// ============================================================

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 1.5),
  );
});

// ============================================================
// アニメーション
// ============================================================

const clock = new THREE.Clock();

let previousTime = 0;

function animate() {
  const elapsedTime = clock.getElapsedTime();

  const deltaTime = Math.min(
    elapsedTime - previousTime,
    0.05,
  );

  previousTime = elapsedTime;

  sun.scale.setScalar(
    1 + Math.sin(elapsedTime * 0.5) * 0.015,
  );

  kaiju.update(elapsedTime);

  destructionSystem.update(deltaTime);

  controls.update();

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);