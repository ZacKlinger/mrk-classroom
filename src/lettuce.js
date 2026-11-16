import * as THREE from 'three';

// Broad, cupped leaves form a loose butterhead rosette. Shared geometry and
// instancing keep the 48 planting sites inexpensive to draw.
export function createLettuceBed(sites) {
  const group = new THREE.Group();
  const vertices = [], colors = [], indices = [];
  const rows = 16, columns = 12;
  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    for (let j = 0; j <= columns; j++) {
      const u = j / columns * 2 - 1;
      const width = .105 * Math.pow(Math.sin(Math.PI * t), .65);
      const edge = Math.abs(u);
      const ripple = Math.sin(t * 38 + u * 7) * .006 * edge ** 3 * Math.sin(Math.PI * t);
      vertices.push(u * width, .095 * Math.sin(t * Math.PI * .85) + .035 * edge ** 2 * Math.sin(Math.PI * t) + ripple, .205 * t);
      const vein = Math.exp(-Math.abs(u) * 35) * .22 + Math.max(0, Math.cos(t * 40 - edge * 6)) ** 16 * .055;
      colors.push(1, 1, 1 - vein);
    }
  }
  for (let i = 0; i < rows; i++) for (let j = 0; j < columns; j++) {
    const a = i * (columns + 1) + j, b = a + columns + 1;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const rings = [
    { count: 6, color: '#285d19', size: 1, tilt: -.04, delay: 0 },
    { count: 7, color: '#4e811f', size: .77, tilt: -.48, delay: .16 },
    { count: 5, color: '#739a2b', size: .54, tilt: -.95, delay: .34 },
  ].map(ring => {
    const material = new THREE.MeshLambertMaterial({color:ring.color, side:THREE.DoubleSide, emissive:ring.color, emissiveIntensity:.08, vertexColors:true});
    const mesh = new THREE.InstancedMesh(geometry, material, sites.length * ring.count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.castShadow = true; mesh.receiveShadow = false; mesh.frustumCulled = false;
    group.add(mesh); return {...ring, mesh};
  });
  const transform = new THREE.Object3D();
  group.visible = false;
  let lastProgress = -1;
  function update(progress) {
    group.visible = progress > 0;
    if (progress === lastProgress) return;
    lastProgress = progress;
    rings.forEach((ring, ringIndex) => {
      sites.forEach((site, plantIndex) => {
        const local = THREE.MathUtils.clamp((progress - ring.delay - (plantIndex % 5) * .012) / (1 - ring.delay - .048), 0, 1);
        const growth = local * local * (3 - 2 * local);
        for (let leaf = 0; leaf < ring.count; leaf++) {
          const angle = leaf * Math.PI * 2 / ring.count + ringIndex * 1.37 + plantIndex * 2.399;
          transform.position.set(site.x, site.y + ringIndex * .012 * growth, site.z);
          transform.rotation.set(0, angle, 0);
          transform.rotateX(ring.tilt);
          const size = Math.max(.0001, ring.size * growth * (.94 + .06 * Math.sin(plantIndex * 7 + leaf)));
          transform.scale.set(size, size, size);
          transform.updateMatrix(); ring.mesh.setMatrixAt(plantIndex * ring.count + leaf, transform.matrix);
        }
      });
      ring.mesh.instanceMatrix.needsUpdate = true;
    });
  }
  return {group, update};
}
