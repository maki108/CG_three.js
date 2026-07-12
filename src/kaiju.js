import * as THREE from "three";

function createLeg(material) {
  const leg = new THREE.Group();

  const upperLength = 1.55;
  const lowerLength = 1.45;

  const upper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.42, upperLength, 10),
    material,
  );
  upper.position.y = -upperLength / 2;
  leg.add(upper);

  // 膝を回転軸にする
  const knee = new THREE.Group();
  knee.position.y = -upperLength;
  leg.add(knee);

  const lower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.34, lowerLength, 10),
    material,
  );
  lower.position.y = -lowerLength / 2;
  knee.add(lower);

  const foot = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.35, 1.15),
    material,
  );
  foot.position.set(0, -lowerLength - 0.08, 0.28);
  knee.add(foot);

  leg.userData.knee = knee;
  leg.userData.foot = foot;

  return leg;
}

function createArm(material) {
  const arm = new THREE.Group();

  const upperLength = 1.35;
  const lowerLength = 1.25;

  const upper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.34, upperLength, 10),
    material,
  );
  upper.position.y = -upperLength / 2;
  arm.add(upper);

  // 肘を回転軸にする
  const elbow = new THREE.Group();
  elbow.position.y = -upperLength;
  arm.add(elbow);

  const lower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.27, lowerLength, 10),
    material,
  );
  lower.position.y = -lowerLength / 2;
  elbow.add(lower);

  const hand = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 12, 10),
    material,
  );
  hand.scale.set(1, 0.75, 1.2);
  hand.position.y = -lowerLength;
  elbow.add(hand);

  arm.userData.elbow = elbow;

  return arm;
}

function createTail(material) {
  const root = new THREE.Group();
  const pivots = [];

  let parent = root;

  const lengths = [1.8, 1.6, 1.35, 1.1];
  const radii = [0.52, 0.4, 0.3, 0.18];

  lengths.forEach((length, index) => {
    const pivot = new THREE.Group();
    parent.add(pivot);
    pivots.push(pivot);

    const segment = new THREE.Mesh(
      new THREE.CylinderGeometry(
        radii[index] * 0.72,
        radii[index],
        length,
        10,
      ),
      material,
    );

    // 円柱を後ろ方向へ伸ばす
    segment.rotation.x = Math.PI / 2;
    segment.position.z = -length / 2;

    pivot.add(segment);

    const next = new THREE.Group();
    next.position.z = -length;

    pivot.add(next);
    parent = next;
  });

  return {
    root,
    pivots,
  };
}

export function createKaiju() {
  const root = new THREE.Group();

  root.name = "kaiju";
  root.userData.type = "kaiju";
  root.position.set(0, 0, -14);

  // 全体の大きさ
  root.scale.setScalar(1.45);

  let roarRequested = false;
  let roarStartedAt = -Infinity;

  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0x294238,
    roughness: 0.92,
    metalness: 0,
  });

  const bellyMaterial = new THREE.MeshStandardMaterial({
    color: 0x6e7156,
    roughness: 0.95,
  });

  const clawMaterial = new THREE.MeshStandardMaterial({
    color: 0xc6b795,
    roughness: 0.75,
  });

  const glowMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a8fb3,
    emissive: 0x2d9fd0,
    emissiveIntensity: 1.8,
    roughness: 0.35,
  });

  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6a2d,
    emissive: 0xff2d00,
    emissiveIntensity: 3,
    roughness: 0.2,
  });

  // 上半身だけ上下動させるためのグループ
  const upperBody = new THREE.Group();
  root.add(upperBody);

  // 腰
  const hip = new THREE.Mesh(
    new THREE.SphereGeometry(1.35, 22, 16),
    skinMaterial,
  );

  hip.scale.set(1.15, 0.9, 1);
  hip.position.y = 3.45;

  upperBody.add(hip);

  // 胴体
  const torso = new THREE.Mesh(
    new THREE.SphereGeometry(1.55, 24, 18),
    skinMaterial,
  );

  torso.scale.set(1.12, 1.55, 0.9);
  torso.position.y = 5.35;

  upperBody.add(torso);

  // 腹
  const belly = new THREE.Mesh(
    new THREE.SphereGeometry(1.12, 20, 14),
    bellyMaterial,
  );

  belly.scale.set(0.86, 1.35, 0.28);
  belly.position.set(0, 5.18, 1.23);

  upperBody.add(belly);

  // 首
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.82, 1.2, 12),
    skinMaterial,
  );

  neck.position.y = 7.2;

  upperBody.add(neck);

  // 頭全体の回転軸
  const headPivot = new THREE.Group();
  headPivot.position.y = 8.2;

  upperBody.add(headPivot);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 20, 14),
    skinMaterial,
  );

  head.scale.set(1.05, 0.9, 1.15);

  headPivot.add(head);

  // 鼻先
  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.55, 1.25),
    skinMaterial,
  );

  snout.position.set(0, -0.18, 0.86);
  snout.rotation.x = -0.08;

  headPivot.add(snout);

  // 顎
  const jawPivot = new THREE.Group();
  jawPivot.position.set(0, -0.38, 0.82);

  headPivot.add(jawPivot);

  const jaw = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, 0.3, 1.05),
    bellyMaterial,
  );

  jaw.position.z = 0.42;

  jawPivot.add(jaw);

  // 目と角
  [-1, 1].forEach((side) => {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 12, 10),
      eyeMaterial,
    );

    eye.position.set(0.35 * side, 0.18, 0.9);

    headPivot.add(eye);

    const horn = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.55, 8),
      clawMaterial,
    );

    horn.position.set(0.48 * side, 0.72, -0.05);
    horn.rotation.z = -0.28 * side;

    headPivot.add(horn);
  });

  // 腕
  const leftArm = createArm(skinMaterial);
  const rightArm = createArm(skinMaterial);

  leftArm.position.set(1.55, 6.5, 0);
  rightArm.position.set(-1.55, 6.5, 0);

  leftArm.rotation.z = -0.16;
  rightArm.rotation.z = 0.16;

  upperBody.add(leftArm);
  upperBody.add(rightArm);

  // 脚
  const leftLeg = createLeg(skinMaterial);
  const rightLeg = createLeg(skinMaterial);

  leftLeg.position.set(0.8, 3.25, 0);
  rightLeg.position.set(-0.8, 3.25, 0);

  root.add(leftLeg);
  root.add(rightLeg);

  // 足の爪
  [leftLeg, rightLeg].forEach((leg) => {
    [-1, 0, 1].forEach((offset) => {
      const claw = new THREE.Mesh(
        new THREE.ConeGeometry(0.09, 0.42, 8),
        clawMaterial,
      );

      claw.rotation.x = Math.PI / 2;
      claw.position.set(offset * 0.22, -0.04, 0.67);

      leg.userData.foot.add(claw);
    });
  });

  // 尻尾
  const tail = createTail(skinMaterial);

  tail.root.position.set(0, 4.25, -0.9);
  tail.root.rotation.x = -0.18;

  upperBody.add(tail.root);

  // 背びれ
  const spikePositions = [
    { y: 4.8, z: -1.05, size: 0.58 },
    { y: 5.7, z: -1.18, size: 0.72 },
    { y: 6.65, z: -1.05, size: 0.64 },
    { y: 7.45, z: -0.72, size: 0.48 },
  ];

  spikePositions.forEach(({ y, z, size }) => {
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(
        size * 0.55,
        size * 1.6,
        8,
      ),
      glowMaterial,
    );

    spike.position.set(0, y, z);
    spike.rotation.x = -0.15;

    upperBody.add(spike);
  });

  // 怪獣の全パーツに影を設定
  root.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  function roar() {
    roarRequested = true;
  }

  function update(elapsedTime) {
    if (roarRequested) {
      roarStartedAt = elapsedTime;
      roarRequested = false;
    }

    const roarElapsed =
      elapsedTime - roarStartedAt;

    const roarDuration = 1.8;

    const isRoaring =
      roarElapsed >= 0 &&
      roarElapsed <= roarDuration;

    const roarProgress = isRoaring
      ? roarElapsed / roarDuration
      : 0;

    // 0 → 1 → 0と変化する
    const roarPower = isRoaring
      ? Math.sin(roarProgress * Math.PI)
      : 0;

    const walkSpeed = 2.7;
    const phase = elapsedTime * walkSpeed;

    const routeLength = 28;

    root.position.z =
      -14 + ((elapsedTime * 1.15) % routeLength);

    // 歩行による上下動
    upperBody.position.y =
      Math.abs(Math.sin(phase)) * 0.12 +
      roarPower * 0.16;

    upperBody.rotation.z =
      Math.sin(phase) * 0.025;

    upperBody.rotation.x =
      -roarPower * 0.07;

    // 脚
    leftLeg.rotation.x =
      Math.sin(phase) * 0.48;

    rightLeg.rotation.x =
      -Math.sin(phase) * 0.48;

    leftLeg.userData.knee.rotation.x =
      Math.max(0, -Math.sin(phase)) * 0.48;

    rightLeg.userData.knee.rotation.x =
      Math.max(0, Math.sin(phase)) * 0.48;

    // 腕
    leftArm.rotation.x =
      -Math.sin(phase) * 0.38;

    rightArm.rotation.x =
      Math.sin(phase) * 0.38;

    // 咆哮時に腕を広げる
    leftArm.rotation.z =
      -0.16 - roarPower * 0.42;

    rightArm.rotation.z =
      0.16 + roarPower * 0.42;

    leftArm.userData.elbow.rotation.x =
      0.18 + roarPower * 0.2;

    rightArm.userData.elbow.rotation.x =
      0.18 + roarPower * 0.2;

    // 頭
    headPivot.rotation.y =
      Math.sin(elapsedTime * 0.9) * 0.12;

    headPivot.rotation.z =
      Math.sin(elapsedTime * 0.55) * 0.035;

    // 咆哮時に頭を後ろへ反らす
    headPivot.rotation.x =
      -roarPower * 0.22;

    // 通常時の顎の動き＋咆哮時の大きな開口
    jawPivot.rotation.x =
      0.04 +
      Math.max(
        0,
        Math.sin(elapsedTime * 0.65),
      ) *
        0.08 +
      roarPower * 0.72;

    // 尻尾
    tail.pivots.forEach((pivot, index) => {
      pivot.rotation.y =
        Math.sin(
          elapsedTime * 2.1 - index * 0.55,
        ) *
          (0.18 + index * 0.055) +
        roarPower *
          Math.sin(index * 0.8) *
          0.12;
    });

    // 咆哮時に背びれと目を強く発光
    glowMaterial.emissiveIntensity =
      1.8 + roarPower * 5;

    eyeMaterial.emissiveIntensity =
      3 + roarPower * 5;
  }

  return {
    group: root,
    update,
    roar,
  };
}