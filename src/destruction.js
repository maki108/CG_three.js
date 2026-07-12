import * as THREE from "three";

export function createDestructionSystem(scene) {
  const pieces = [];
  const dustClouds = [];

  /**
   * 建物崩壊時の粉じんを生成する
   */
  function createDust(origin) {
    const particleCount = 100;

    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let index = 0; index < particleCount; index += 1) {
      const positionIndex = index * 3;

      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 1.5;

      positions[positionIndex] =
        origin.x + Math.cos(angle) * radius;

      positions[positionIndex + 1] =
        origin.y + Math.random() * 1.3;

      positions[positionIndex + 2] =
        origin.z + Math.sin(angle) * radius;

      const speed = 0.7 + Math.random() * 2;

      velocities[positionIndex] =
        Math.cos(angle) * speed;

      velocities[positionIndex + 1] =
        0.7 + Math.random() * 2.3;

      velocities[positionIndex + 2] =
        Math.sin(angle) * speed;
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );

    const material = new THREE.PointsMaterial({
      color: 0x8c705c,
      size: 0.35,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);

    scene.add(points);

    dustClouds.push({
      points,
      velocities,
      age: 0,
      lifetime: 2.5,
    });
  }

  /**
   * 建物を複数の瓦礫へ分割する
   */
  function destroyBuilding(building) {
    if (
      !building ||
      building.userData.destroyed ||
      building.userData.type !== "building"
    ) {
      return false;
    }

    building.userData.destroyed = true;

    const parameters = building.geometry.parameters;

    const originalWidth = parameters.width ?? 2;
    const originalHeight = parameters.height ?? 5;
    const originalDepth = parameters.depth ?? 2;

    const worldPosition = new THREE.Vector3();
    const worldQuaternion = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();

    building.getWorldPosition(worldPosition);
    building.getWorldQuaternion(worldQuaternion);
    building.getWorldScale(worldScale);

    const buildingWidth =
      originalWidth * worldScale.x;

    const buildingHeight =
      originalHeight * worldScale.y;

    const buildingDepth =
      originalDepth * worldScale.z;

    const xCount = 2;
    const zCount = 2;

    // 高い建物ほど縦方向の分割数を増やす
    const yCount = THREE.MathUtils.clamp(
      Math.round(buildingHeight / 2),
      3,
      5,
    );

    const pieceWidth = buildingWidth / xCount;
    const pieceHeight = buildingHeight / yCount;
    const pieceDepth = buildingDepth / zCount;

    for (let xIndex = 0; xIndex < xCount; xIndex += 1) {
      for (let yIndex = 0; yIndex < yCount; yIndex += 1) {
        for (let zIndex = 0; zIndex < zCount; zIndex += 1) {
          const geometry = new THREE.BoxGeometry(
            pieceWidth * 0.94,
            pieceHeight * 0.94,
            pieceDepth * 0.94,
          );

          // 元の建物と同じ材質を使用する
          const piece = new THREE.Mesh(
            geometry,
            building.material,
          );

          const offset = new THREE.Vector3(
            (xIndex - (xCount - 1) / 2) * pieceWidth,
            (yIndex - (yCount - 1) / 2) * pieceHeight,
            (zIndex - (zCount - 1) / 2) * pieceDepth,
          );

          offset.applyQuaternion(worldQuaternion);

          piece.position
            .copy(worldPosition)
            .add(offset);

          piece.quaternion.copy(worldQuaternion);

          piece.castShadow = true;
          piece.receiveShadow = true;

          scene.add(piece);

          const horizontalDirection = new THREE.Vector3(
            offset.x,
            0,
            offset.z,
          );

          if (horizontalDirection.lengthSq() < 0.01) {
            horizontalDirection.set(
              Math.random() - 0.5,
              0,
              Math.random() - 0.5,
            );
          }

          horizontalDirection.normalize();

          const outwardSpeed =
            1.5 + Math.random() * 3;

          const velocity = horizontalDirection
            .multiplyScalar(outwardSpeed);

          velocity.y =
            2.5 +
            Math.random() * 4 +
            yIndex * 0.35;

          const angularVelocity = new THREE.Vector3(
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4,
          );

          pieces.push({
            mesh: piece,
            velocity,
            angularVelocity,
            age: 0,
            lifetime: 6,
            floorHeight: pieceHeight / 2,
          });
        }
      }
    }

    createDust(
      new THREE.Vector3(
        worldPosition.x,
        0.2,
        worldPosition.z,
      ),
    );

    // 元の建物を削除する
    building.parent?.remove(building);
    building.geometry.dispose();

    return true;
  }

  /**
   * 毎フレーム、瓦礫と粉じんを更新する
   */
  function update(deltaTime) {
    const safeDelta = Math.min(deltaTime, 0.05);

    // 瓦礫
    for (
      let index = pieces.length - 1;
      index >= 0;
      index -= 1
    ) {
      const piece = pieces[index];

      piece.age += safeDelta;

      piece.velocity.y -= 9.8 * safeDelta;

      piece.mesh.position.addScaledVector(
        piece.velocity,
        safeDelta,
      );

      piece.mesh.rotation.x +=
        piece.angularVelocity.x * safeDelta;

      piece.mesh.rotation.y +=
        piece.angularVelocity.y * safeDelta;

      piece.mesh.rotation.z +=
        piece.angularVelocity.z * safeDelta;

      // 簡易的な地面との衝突
      if (piece.mesh.position.y < piece.floorHeight) {
        piece.mesh.position.y = piece.floorHeight;

        if (Math.abs(piece.velocity.y) > 0.6) {
          piece.velocity.y *= -0.28;
        } else {
          piece.velocity.y = 0;
        }

        piece.velocity.x *= 0.88;
        piece.velocity.z *= 0.88;

        piece.angularVelocity.multiplyScalar(0.88);
      }

      if (piece.age >= piece.lifetime) {
        scene.remove(piece.mesh);
        piece.mesh.geometry.dispose();

        pieces.splice(index, 1);
      }
    }

    // 粉じん
    for (
      let cloudIndex = dustClouds.length - 1;
      cloudIndex >= 0;
      cloudIndex -= 1
    ) {
      const cloud = dustClouds[cloudIndex];

      cloud.age += safeDelta;

      const positionAttribute =
        cloud.points.geometry.attributes.position;

      const positionArray = positionAttribute.array;

      for (
        let index = 0;
        index < positionAttribute.count;
        index += 1
      ) {
        const positionIndex = index * 3;

        cloud.velocities[positionIndex + 1] -=
          1.4 * safeDelta;

        positionArray[positionIndex] +=
          cloud.velocities[positionIndex] * safeDelta;

        positionArray[positionIndex + 1] +=
          cloud.velocities[positionIndex + 1] *
          safeDelta;

        positionArray[positionIndex + 2] +=
          cloud.velocities[positionIndex + 2] *
          safeDelta;
      }

      positionAttribute.needsUpdate = true;

      const progress =
        cloud.age / cloud.lifetime;

      cloud.points.material.opacity =
        0.8 * (1 - progress);

      cloud.points.material.size =
        0.35 + progress * 0.5;

      if (cloud.age >= cloud.lifetime) {
        scene.remove(cloud.points);

        cloud.points.geometry.dispose();
        cloud.points.material.dispose();

        dustClouds.splice(cloudIndex, 1);
      }
    }
  }

  return {
    destroyBuilding,
    update,
  };
}