import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// Each whorl has its own cupped blade: open outer leaves surround an upright,
// inward-curving heart. Elliptical sampling keeps the tips round, not pointed.
function leafGeometry({ length, width, curl, cup, color }, ringIndex) {
  const positions = [], colors = [], indices = [];
  const rows = 28, columns = 18;
  const base = new THREE.Color(color);
  const ribColor = new THREE.Color('#d1df91');
  const shade = new THREE.Color();
  for (let i = 0; i <= rows; i++) {
    const theta = Math.PI * i / rows;
    const t = (1 - Math.cos(theta)) / 2;
    const outline = Math.sin(theta);
    for (let j = 0; j <= columns; j++) {
      const u = j / columns * 2 - 1;
      const edge = Math.abs(u);
      const bladeWidth = width * outline * (.72 + .28 * t);
      const scallop = 1 + .025 * Math.sin(theta * 7 + ringIndex) * edge ** 4;
      const rib = Math.exp(-u * u * 90) * outline;
      // Small, broad undulations keep the edge soft rather than serrated.
      const fold = Math.sin(u * Math.PI * 2 + t * 4 + ringIndex) * .003 * outline * edge;
      positions.push(
        bladeWidth * u * scallop,
        length * (1 - Math.cos(curl * t)) / curl - cup * .10 * edge ** 2 * outline + fold - rib * .0015,
        length * Math.sin(curl * t) / curl - cup * edge ** 2 * outline,
      );
      const sideVein = Math.exp(-Math.pow(Math.sin(t * 24 - edge * 5), 2) * 80) * .055 * (1 - edge) * outline;
      shade.copy(base).multiplyScalar(.78 + .22 * Math.sqrt(t));
      shade.lerp(ribColor, rib * .22 + sideVein);
      colors.push(shade.r, shade.g, shade.b);
    }
  }
  for (let i = 0; i < rows; i++) for (let j = 0; j < columns; j++) {
    const a = i * (columns + 1) + j, b = a + columns + 1;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  const smoothGeometry = mergeVertices(geometry, .00001);
  geometry.dispose();
  smoothGeometry.computeVertexNormals();
  return smoothGeometry;
}

export function createLettuceBed(sites) {
  const group = new THREE.Group();
  // Pale overlapping inner leaves fill the head as the darker outer rosette opens.
  const rings = [
    { count: 7, length: .195, width: .120, curl: .45, cup: .026, color: '#719d3f', lift: 0, delay: 0 },
    { count: 7, length: .205, width: .108, curl: 1.4, cup: .035, color: '#8ab34c', lift: .006, delay: .10 },
    { count: 6, length: .200, width: .096, curl: 2.2, cup: .036, color: '#a2c65b', lift: .014, delay: .23 },
    { count: 6, length: .175, width: .078, curl: 2.65, cup: .030, color: '#bad477', lift: .035, delay: .37 },
    { count: 5, length: .135, width: .058, curl: 2.85, cup: .022, color: '#cedf91', lift: .075, delay: .49 },
    { count: 4, length: .090, width: .045, curl: 3.1, cup: .014, color: '#d8e6a2', lift: .110, delay: .60 },
  ].map((ring, ringIndex) => {
    const geometry = leafGeometry(ring, ringIndex);
    // A soft diffuse response keeps thin foliage green under the pink fixtures.
    const material = new THREE.MeshPhongMaterial({
      color: '#ffffff', side: THREE.DoubleSide, vertexColors: true,
      emissive: ring.color, emissiveIntensity: .10,
      specular: '#52653a', shininess: 14,
    });
    const mesh = new THREE.InstancedMesh(geometry, material, sites.length * ring.count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    mesh.frustumCulled = false;
    group.add(mesh);
    return { ...ring, mesh };
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
          const variation = Math.sin(plantIndex * 7.13 + leaf * 3.71 + ringIndex);
          const angle = leaf * Math.PI * 2 / ring.count + ringIndex * 2.399 + plantIndex * 2.399 + variation * .08;
          transform.position.set(site.x, site.y + ring.lift * growth, site.z);
          transform.rotation.set(0, angle, 0);
          // Young leaves stand together; outer leaves gently unfurl as they expand.
          transform.rotateX(-(1 - growth) * .45 + variation * .035);
          const size = Math.max(.0001, growth * (.94 + .06 * variation));
          transform.scale.set(size, size, size);
          transform.updateMatrix();
          ring.mesh.setMatrixAt(plantIndex * ring.count + leaf, transform.matrix);
        }
      });
      ring.mesh.instanceMatrix.needsUpdate = true;
    });
  }
  return { group, update };
}
