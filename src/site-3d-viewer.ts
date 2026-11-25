/** On-demand, zero-dependency, CSP-safe WebGL glTF 2.0 (.glb) site viewer.
 *  Fetches nothing over the network until the user explicitly activates Load 3D.
 */
import { hydrateGuideReturnLinks } from './guide-return';

interface Annotation {
  id: string;
  label: string;
  recordId: string;
  position: [number, number, number];
  dates?: string;
  summary?: string;
}

interface ViewerConfig {
  id: string;
  title: string;
  src: string;
  bytes: number;
  classificationLabel: string;
  camera: { position: [number, number, number]; target: [number, number, number]; fovDeg: number };
  annotations: Annotation[];
}

interface ParsedPrimitive {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array | null;
  uvs: Float32Array | null;
  indices: Uint32Array | Uint16Array | null;
  baseColor: [number, number, number, number];
  textureIndex: number | null;
}

interface ParsedGLB {
  primitives: ParsedPrimitive[];
  images: { data: Uint8Array; mimeType: string }[];
  boundsMin: [number, number, number];
  boundsMax: [number, number, number];
}

const GLB_MAGIC = 0x46546c67;
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;

const TYPE_COMPONENTS: Record<string, number> = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};

function formatMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function mat4Identity(): Float32Array {
  const m = new Float32Array(16);
  m[0] = m[5] = m[10] = m[15] = 1;
  return m;
}

function mat4Multiply(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] =
        a[r] * b[c * 4] +
        a[4 + r] * b[c * 4 + 1] +
        a[8 + r] * b[c * 4 + 2] +
        a[12 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

function mat4FromTRS(t?: number[], r?: number[], s?: number[]): Float32Array {
  const tx = t?.[0] ?? 0, ty = t?.[1] ?? 0, tz = t?.[2] ?? 0;
  const qx = r?.[0] ?? 0, qy = r?.[1] ?? 0, qz = r?.[2] ?? 0, qw = r?.[3] ?? 1;
  const sx = s?.[0] ?? 1, sy = s?.[1] ?? 1, sz = s?.[2] ?? 1;
  const x2 = qx + qx, y2 = qy + qy, z2 = qz + qz;
  const xx = qx * x2, xy = qx * y2, xz = qx * z2;
  const yy = qy * y2, yz = qy * z2, zz = qz * z2;
  const wx = qw * x2, wy = qw * y2, wz = qw * z2;
  return new Float32Array([
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ]);
}

function mat4Perspective(fovRad: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan(fovRad / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]);
}

function mat4LookAt(eye: [number, number, number], target: [number, number, number]): Float32Array {
  let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
  let len = Math.hypot(zx, zy, zz) || 1;
  zx /= len; zy /= len; zz /= len;
  let xx = 1 * zz - 0 * zy, xy = 0 * zx - 0 * zz, xz = 0 * zy - 1 * zx;
  len = Math.hypot(xx, xy, xz);
  if (len < 1e-5) {
    xx = 1; xy = 0; xz = 0;
  } else {
    xx /= len; xy /= len; xz /= len;
  }
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
    1,
  ]);
}

function readAccessor(gltf: any, bin: Uint8Array, accessorIndex: number): { data: Float32Array | Uint32Array | Uint16Array | Uint8Array; numComponents: number; count: number; normalized: boolean } {
  const acc = gltf.accessors[accessorIndex];
  if (!acc) throw new Error('Missing glTF accessor ' + accessorIndex);
  const bv = gltf.bufferViews[acc.bufferView];
  if (!bv) throw new Error('Missing glTF bufferView for accessor ' + accessorIndex);
  const numComponents = TYPE_COMPONENTS[acc.type];
  if (!numComponents) throw new Error('Unsupported accessor type ' + acc.type);
  const count: number = acc.count;
  const byteOffset = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const compSize = acc.componentType === 5126 || acc.componentType === 5125 ? 4 : acc.componentType === 5123 || acc.componentType === 5122 ? 2 : 1;
  const stride = bv.byteStride && bv.byteStride > compSize * numComponents ? bv.byteStride : 0;

  const readScalar = (view: DataView, pos: number): number => {
    switch (acc.componentType) {
      case 5126: return view.getFloat32(pos, true);
      case 5125: return view.getUint32(pos, true);
      case 5123: return view.getUint16(pos, true);
      case 5122: return view.getInt16(pos, true);
      case 5121: return view.getUint8(pos);
      case 5120: return view.getInt8(pos);
      default: throw new Error('Unsupported glTF componentType ' + acc.componentType);
    }
  };

  if (!stride && (byteOffset % compSize === 0)) {
    const slice = bin.buffer.slice(bin.byteOffset + byteOffset, bin.byteOffset + byteOffset + count * numComponents * compSize);
    if (acc.componentType === 5126) return { data: new Float32Array(slice), numComponents, count, normalized: !!acc.normalized };
    if (acc.componentType === 5125) return { data: new Uint32Array(slice), numComponents, count, normalized: !!acc.normalized };
    if (acc.componentType === 5123) return { data: new Uint16Array(slice), numComponents, count, normalized: !!acc.normalized };
    if (acc.componentType === 5121) return { data: new Uint8Array(slice), numComponents, count, normalized: !!acc.normalized };
  }

  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  const effectiveStride = stride || compSize * numComponents;
  const out = acc.componentType === 5125 ? new Uint32Array(count * numComponents) : new Float32Array(count * numComponents);
  for (let i = 0; i < count; i++) {
    const base = byteOffset + i * effectiveStride;
    for (let c = 0; c < numComponents; c++) {
      out[i * numComponents + c] = readScalar(view, base + c * compSize);
    }
  }
  return { data: out, numComponents, count, normalized: !!acc.normalized };
}

function computeNormals(pos: Float32Array, indices: Uint32Array | Uint16Array | null): Float32Array {
  const normals = new Float32Array(pos.length);
  const triCount = indices ? Math.floor(indices.length / 3) : Math.floor(pos.length / 9);
  for (let t = 0; t < triCount; t++) {
    const i0 = indices ? indices[t * 3] : t * 3;
    const i1 = indices ? indices[t * 3 + 1] : t * 3 + 1;
    const i2 = indices ? indices[t * 3 + 2] : t * 3 + 2;
    const ax = pos[i1 * 3] - pos[i0 * 3], ay = pos[i1 * 3 + 1] - pos[i0 * 3 + 1], az = pos[i1 * 3 + 2] - pos[i0 * 3 + 2];
    const bx = pos[i2 * 3] - pos[i0 * 3], by = pos[i2 * 3 + 1] - pos[i0 * 3 + 1], bz = pos[i2 * 3 + 2] - pos[i0 * 3 + 2];
    const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    for (const idx of [i0, i1, i2]) {
      normals[idx * 3] += nx; normals[idx * 3 + 1] += ny; normals[idx * 3 + 2] += nz;
    }
  }
  for (let i = 0; i < normals.length; i += 3) {
    const len = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    normals[i] /= len; normals[i + 1] /= len; normals[i + 2] /= len;
  }
  return normals;
}

function parseGLB(buffer: ArrayBuffer): ParsedGLB {
  if (buffer.byteLength < 20) throw new Error('3D file is empty or truncated.');
  const dv = new DataView(buffer);
  const magic = dv.getUint32(0, true);
  const version = dv.getUint32(4, true);
  const totalLen = dv.getUint32(8, true);
  if (magic !== GLB_MAGIC || version !== 2) throw new Error('Unsupported 3D format (expected binary glTF 2.0).');
  if (totalLen > buffer.byteLength) throw new Error('Incomplete glTF 2.0 file.');

  let offset = 12;
  let gltf: any = null;
  let bin = new Uint8Array(0);
  while (offset + 8 <= totalLen) {
    const chunkLen = dv.getUint32(offset, true);
    const chunkType = dv.getUint32(offset + 4, true);
    const chunkStart = offset + 8;
    if (chunkStart + chunkLen > buffer.byteLength) throw new Error('Corrupt glTF chunk length.');
    if (chunkType === CHUNK_JSON) {
      gltf = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, chunkStart, chunkLen)));
    } else if (chunkType === CHUNK_BIN) {
      bin = new Uint8Array(buffer, chunkStart, chunkLen);
    }
    offset = chunkStart + chunkLen;
  }
  if (!gltf) throw new Error('glTF JSON header missing.');
  if (Array.isArray(gltf.extensionsRequired) && gltf.extensionsRequired.includes('KHR_draco_mesh_compression')) {
    throw new Error('This model uses Draco mesh compression, which requires an uncompressed glTF 2.0 re-export.');
  }

  const images: { data: Uint8Array; mimeType: string }[] = [];
  for (const img of gltf.images ?? []) {
    if (img.bufferView !== undefined && gltf.bufferViews?.[img.bufferView]) {
      const bv = gltf.bufferViews[img.bufferView];
      const off = bv.byteOffset ?? 0;
      images.push({
        data: bin.slice(off, off + bv.byteLength),
        mimeType: img.mimeType || 'image/jpeg',
      });
    } else {
      images.push({ data: new Uint8Array(0), mimeType: 'image/png' });
    }
  }

  const primitives: ParsedPrimitive[] = [];
  const boundsMin: [number, number, number] = [Infinity, Infinity, Infinity];
  const boundsMax: [number, number, number] = [-Infinity, -Infinity, -Infinity];

  const visitNode = (nodeIdx: number, parentWorld: Float32Array) => {
    const node = gltf.nodes?.[nodeIdx];
    if (!node) return;
    const local = node.matrix
      ? new Float32Array(node.matrix)
      : mat4FromTRS(node.translation, node.rotation, node.scale);
    const world = mat4Multiply(parentWorld, local);

    if (node.mesh !== undefined && gltf.meshes?.[node.mesh]) {
      const mesh = gltf.meshes[node.mesh];
      for (const prim of mesh.primitives ?? []) {
        if (prim.mode !== undefined && prim.mode !== 4) continue;
        const posAcc = prim.attributes?.POSITION;
        if (posAcc === undefined) continue;
        const posRaw = readAccessor(gltf, bin, posAcc);
        const vertCount = posRaw.count;
        const positions = new Float32Array(vertCount * 3);
        for (let i = 0; i < vertCount; i++) {
          const x = posRaw.data[i * 3], y = posRaw.data[i * 3 + 1], z = posRaw.data[i * 3 + 2];
          const wx = world[0] * x + world[4] * y + world[8] * z + world[12];
          const wy = world[1] * x + world[5] * y + world[9] * z + world[13];
          const wz = world[2] * x + world[6] * y + world[10] * z + world[14];
          positions[i * 3] = wx; positions[i * 3 + 1] = wy; positions[i * 3 + 2] = wz;
          if (wx < boundsMin[0]) boundsMin[0] = wx;
          if (wy < boundsMin[1]) boundsMin[1] = wy;
          if (wz < boundsMin[2]) boundsMin[2] = wz;
          if (wx > boundsMax[0]) boundsMax[0] = wx;
          if (wy > boundsMax[1]) boundsMax[1] = wy;
          if (wz > boundsMax[2]) boundsMax[2] = wz;
        }

        let indices: Uint32Array | Uint16Array | null = null;
        if (prim.indices !== undefined) {
          const idxRaw = readAccessor(gltf, bin, prim.indices);
          if (idxRaw.data instanceof Uint32Array || idxRaw.data instanceof Uint16Array) {
            indices = idxRaw.data;
          } else {
            const out = new Uint32Array(idxRaw.count);
            for (let i = 0; i < idxRaw.count; i++) out[i] = idxRaw.data[i];
            indices = out;
          }
        }

        let normals: Float32Array;
        if (prim.attributes?.NORMAL !== undefined) {
          const normRaw = readAccessor(gltf, bin, prim.attributes.NORMAL);
          normals = new Float32Array(vertCount * 3);
          for (let i = 0; i < vertCount; i++) {
            const x = normRaw.data[i * 3], y = normRaw.data[i * 3 + 1], z = normRaw.data[i * 3 + 2];
            const nx = world[0] * x + world[4] * y + world[8] * z;
            const ny = world[1] * x + world[5] * y + world[9] * z;
            const nz = world[2] * x + world[6] * y + world[10] * z;
            const len = Math.hypot(nx, ny, nz) || 1;
            normals[i * 3] = nx / len; normals[i * 3 + 1] = ny / len; normals[i * 3 + 2] = nz / len;
          }
        } else {
          normals = computeNormals(positions, indices);
        }

        let colors: Float32Array | null = null;
        if (prim.attributes?.COLOR_0 !== undefined) {
          const colRaw = readAccessor(gltf, bin, prim.attributes.COLOR_0);
          colors = new Float32Array(vertCount * 3);
          const scale = colRaw.data instanceof Uint8Array ? 255 : colRaw.data instanceof Uint16Array ? 65535 : 1;
          for (let i = 0; i < vertCount; i++) {
            colors[i * 3] = colRaw.data[i * colRaw.numComponents] / scale;
            colors[i * 3 + 1] = colRaw.data[i * colRaw.numComponents + 1] / scale;
            colors[i * 3 + 2] = colRaw.data[i * colRaw.numComponents + 2] / scale;
          }
        }

        let uvs: Float32Array | null = null;
        if (prim.attributes?.TEXCOORD_0 !== undefined) {
          const uvRaw = readAccessor(gltf, bin, prim.attributes.TEXCOORD_0);
          uvs = new Float32Array(vertCount * 2);
          for (let i = 0; i < vertCount; i++) {
            uvs[i * 2] = uvRaw.data[i * 2];
            uvs[i * 2 + 1] = uvRaw.data[i * 2 + 1];
          }
        }

        const mat = prim.material !== undefined ? gltf.materials?.[prim.material] : null;
        const pbr = mat?.pbrMetallicRoughness;
        const factor = pbr?.baseColorFactor ?? [0.85, 0.78, 0.68, 1.0];
        const texRef = pbr?.baseColorTexture?.index;
        const texSource = texRef !== undefined ? gltf.textures?.[texRef]?.source ?? null : null;

        primitives.push({
          positions,
          normals,
          colors,
          uvs,
          indices,
          baseColor: [factor[0] ?? 1, factor[1] ?? 1, factor[2] ?? 1, factor[3] ?? 1],
          textureIndex: typeof texSource === 'number' ? texSource : null,
        });
      }
    }
    for (const child of node.children ?? []) visitNode(child, world);
  };

  const scene = gltf.scenes?.[gltf.scene ?? 0];
  const rootNodes: number[] = scene?.nodes ?? (gltf.nodes?.length ? [0] : []);
  const identity = mat4Identity();
  for (const idx of rootNodes) visitNode(idx, identity);

  if (!primitives.length) throw new Error('No triangle geometry found in glTF 2.0 model.');
  return { primitives, images, boundsMin, boundsMax };
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Could not allocate WebGL shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || 'Unknown shader compile error';
    gl.deleteShader(shader);
    throw new Error(info);
  }
  return shader;
}

class GLSceneRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private buffers: WebGLBuffer[] = [];
  private textures: (WebGLTexture | null)[] = [];
  private drawCalls: {
    pos: WebGLBuffer;
    norm: WebGLBuffer;
    col: WebGLBuffer | null;
    uv: WebGLBuffer | null;
    idx: WebGLBuffer | null;
    idxType: number;
    count: number;
    baseColor: [number, number, number, number];
    texture: WebGLTexture | null;
  }[] = [];
  private locs: {
    aPos: number; aNorm: number; aCol: number; aUV: number;
    uMVP: WebGLUniformLocation | null;
    uBaseColor: WebGLUniformLocation | null;
    uHasColor: WebGLUniformLocation | null;
    uHasTex: WebGLUniformLocation | null;
    uTex: WebGLUniformLocation | null;
  };
  private uintExt: OES_element_index_uint | null = null;
  private isWebGL2 = false;

  constructor(canvas: HTMLCanvasElement, parsed: ParsedGLB) {
    const gl2 = canvas.getContext('webgl2', { antialias: true, alpha: false });
    const gl = gl2 || canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) throw new Error('WebGL is unavailable in this browser.');
    this.gl = gl;
    this.isWebGL2 = Boolean(gl2);
    if (!this.isWebGL2) {
      this.uintExt = gl.getExtension('OES_element_index_uint');
    }

    const vsSrc = `
      attribute vec3 aPos;
      attribute vec3 aNorm;
      attribute vec3 aCol;
      attribute vec2 aUV;
      uniform mat4 uMVP;
      uniform float uHasColor;
      varying vec3 vNorm;
      varying vec3 vCol;
      varying vec2 vUV;
      void main() {
        gl_Position = uMVP * vec4(aPos, 1.0);
        vNorm = aNorm;
        vCol = uHasColor > 0.5 ? aCol : vec3(1.0);
        vUV = aUV;
      }
    `;
    const fsSrc = `
      precision mediump float;
      uniform vec4 uBaseColor;
      uniform float uHasTex;
      uniform sampler2D uTex;
      varying vec3 vNorm;
      varying vec3 vCol;
      varying vec2 vUV;
      void main() {
        vec3 n = normalize(vNorm);
        vec3 sun = normalize(vec3(0.55, 0.78, 0.30));
        vec3 fill = normalize(vec3(-0.4, 0.35, -0.6));
        float diff = max(dot(n, sun), 0.0) * 0.72 + max(dot(n, fill), 0.0) * 0.16 + 0.28;
        vec3 albedo = uBaseColor.rgb * vCol;
        if (uHasTex > 0.5) {
          albedo *= texture2D(uTex, vUV).rgb;
        }
        gl_FragColor = vec4(albedo * diff, uBaseColor.a);
      }
    `;
    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
    const prog = gl.createProgram();
    if (!prog) throw new Error('Failed to create WebGL program.');
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog) || 'WebGL program link failed.');
    }
    this.program = prog;
    this.locs = {
      aPos: gl.getAttribLocation(prog, 'aPos'),
      aNorm: gl.getAttribLocation(prog, 'aNorm'),
      aCol: gl.getAttribLocation(prog, 'aCol'),
      aUV: gl.getAttribLocation(prog, 'aUV'),
      uMVP: gl.getUniformLocation(prog, 'uMVP'),
      uBaseColor: gl.getUniformLocation(prog, 'uBaseColor'),
      uHasColor: gl.getUniformLocation(prog, 'uHasColor'),
      uHasTex: gl.getUniformLocation(prog, 'uHasTex'),
      uTex: gl.getUniformLocation(prog, 'uTex'),
    };

    for (const prim of parsed.primitives) {
      const upload = (target: number, data: ArrayBufferView) => {
        const b = gl.createBuffer();
        if (!b) throw new Error('Failed to allocate GPU buffer.');
        gl.bindBuffer(target, b);
        gl.bufferData(target, data, gl.STATIC_DRAW);
        this.buffers.push(b);
        return b;
      };
      const pos = upload(gl.ARRAY_BUFFER, prim.positions);
      const norm = upload(gl.ARRAY_BUFFER, prim.normals);
      const col = prim.colors ? upload(gl.ARRAY_BUFFER, prim.colors) : null;
      const uv = prim.uvs ? upload(gl.ARRAY_BUFFER, prim.uvs) : null;

      let idx: WebGLBuffer | null = null;
      let idxType: number = gl.UNSIGNED_SHORT;
      let count = prim.positions.length / 3;
      if (prim.indices) {
        count = prim.indices.length;
        if (prim.indices instanceof Uint32Array) {
          if (!this.isWebGL2 && !this.uintExt) {
            throw new Error('Browser WebGL lacks 32-bit index support for this mesh.');
          }
          idxType = gl.UNSIGNED_INT;
        }
        idx = upload(gl.ELEMENT_ARRAY_BUFFER, prim.indices);
      }
      this.drawCalls.push({
        pos, norm, col, uv, idx, idxType, count,
        baseColor: prim.baseColor,
        texture: null,
      });
    }

    // Decode embedded textures asynchronously using createImageBitmap (no blob: img URLs needed).
    void this.decodeTextures(parsed);
  }

  private async decodeTextures(parsed: ParsedGLB): Promise<void> {
    if (!parsed.images.length || typeof createImageBitmap !== 'function') return;
    const gl = this.gl;
    for (let i = 0; i < parsed.images.length; i++) {
      const img = parsed.images[i];
      if (!img.data.byteLength) {
        this.textures.push(null);
        continue;
      }
      try {
        const blob = new Blob([img.data], { type: img.mimeType });
        const bitmap = await createImageBitmap(blob);
        const tex = gl.createTexture();
        if (!tex) { bitmap.close(); this.textures.push(null); continue; }
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        bitmap.close();
        this.textures.push(tex);
        for (let p = 0; p < parsed.primitives.length; p++) {
          if (parsed.primitives[p].textureIndex === i) this.drawCalls[p].texture = tex;
        }
      } catch {
        this.textures.push(null);
      }
    }
  }

  render(mvp: Float32Array, width: number, height: number): void {
    const gl = this.gl;
    gl.viewport(0, 0, width, height);
    gl.clearColor(0.89, 0.92, 0.93, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.locs.uMVP, false, mvp);

    for (const dc of this.drawCalls) {
      gl.bindBuffer(gl.ARRAY_BUFFER, dc.pos);
      gl.enableVertexAttribArray(this.locs.aPos);
      gl.vertexAttribPointer(this.locs.aPos, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, dc.norm);
      gl.enableVertexAttribArray(this.locs.aNorm);
      gl.vertexAttribPointer(this.locs.aNorm, 3, gl.FLOAT, false, 0, 0);

      if (dc.col && this.locs.aCol >= 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, dc.col);
        gl.enableVertexAttribArray(this.locs.aCol);
        gl.vertexAttribPointer(this.locs.aCol, 3, gl.FLOAT, false, 0, 0);
        gl.uniform1f(this.locs.uHasColor, 1);
      } else if (this.locs.aCol >= 0) {
        gl.disableVertexAttribArray(this.locs.aCol);
        gl.uniform1f(this.locs.uHasColor, 0);
      }

      if (dc.uv && dc.texture && this.locs.aUV >= 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, dc.uv);
        gl.enableVertexAttribArray(this.locs.aUV);
        gl.vertexAttribPointer(this.locs.aUV, 2, gl.FLOAT, false, 0, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, dc.texture);
        gl.uniform1i(this.locs.uTex, 0);
        gl.uniform1f(this.locs.uHasTex, 1);
      } else {
        if (this.locs.aUV >= 0) gl.disableVertexAttribArray(this.locs.aUV);
        gl.uniform1f(this.locs.uHasTex, 0);
      }

      gl.uniform4fv(this.locs.uBaseColor, dc.baseColor);
      if (dc.idx) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, dc.idx);
        gl.drawElements(gl.TRIANGLES, dc.count, dc.idxType, 0);
      } else {
        gl.drawArrays(gl.TRIANGLES, 0, dc.count);
      }
    }
  }

  dispose(): void {
    const gl = this.gl;
    for (const b of this.buffers) gl.deleteBuffer(b);
    for (const t of this.textures) if (t) gl.deleteTexture(t);
    gl.deleteProgram(this.program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

function mount3DViewer(root: HTMLElement): void {
  const configEl = root.querySelector<HTMLScriptElement>('script[data-site-3d-config]');
  if (!configEl?.textContent) return;
  const config = JSON.parse(configEl.textContent) as ViewerConfig;

  const fallbackEl = root.querySelector<HTMLElement>('[data-3d-fallback]');
  const stageEl = root.querySelector<HTMLElement>('[data-3d-stage]');
  const statusEl = root.querySelector<HTMLElement>('[data-3d-status]');
  const loadBtn = root.querySelector<HTMLButtonElement>('[data-load-3d]');
  const cancelBtn = root.querySelector<HTMLButtonElement>('[data-cancel-3d]');
  const unloadBtn = root.querySelector<HTMLButtonElement>('[data-unload-3d]');
  const labelsBtn = root.querySelector<HTMLButtonElement>('[data-3d-action="labels"]');
  const toolbarEl = root.querySelector<HTMLElement>('[data-3d-toolbar]');
  const canvas = root.querySelector<HTMLCanvasElement>('[data-3d-canvas]');
  const pinsEl = root.querySelector<HTMLElement>('[data-3d-pins]');
  if (!fallbackEl || !stageEl || !statusEl || !loadBtn || !cancelBtn || !unloadBtn || !toolbarEl || !canvas || !pinsEl) return;

  let controller: AbortController | null = null;
  let renderer: GLSceneRenderer | null = null;
  let showLabels = true;
  let rafPending = false;

  const dx = config.camera.position[0] - config.camera.target[0];
  const dy = config.camera.position[1] - config.camera.target[1];
  const dz = config.camera.position[2] - config.camera.target[2];
  const initialRadius = Math.hypot(dx, dy, dz) || 100;
  const initialYaw = Math.atan2(dx, dz);
  const initialPitch = Math.asin(Math.max(-0.98, Math.min(0.98, dy / initialRadius)));

  let yaw = initialYaw;
  let pitch = initialPitch;
  let radius = initialRadius;
  let target: [number, number, number] = [...config.camera.target];
  let minRadius = initialRadius * 0.15;
  let maxRadius = initialRadius * 2.8;

  const pinNodes: { el: HTMLAnchorElement; pos: [number, number, number] }[] = [];
  for (const ann of config.annotations) {
    const a = document.createElement('a');
    a.className = 'site-3d-pin';
    a.href = '../#review/' + encodeURIComponent(ann.recordId);
    a.textContent = ann.label;
    if (ann.dates || ann.summary) a.title = [ann.dates, ann.summary].filter(Boolean).join(' — ');
    pinsEl.appendChild(a);
    pinNodes.push({ el: a, pos: ann.position });
  }

  const updateCameraBounds = (parsed: ParsedGLB) => {
    const span = Math.hypot(
      parsed.boundsMax[0] - parsed.boundsMin[0],
      parsed.boundsMax[1] - parsed.boundsMin[1],
      parsed.boundsMax[2] - parsed.boundsMin[2],
    );
    if (span > 0) {
      minRadius = Math.max(1.0, span * 0.08);
      maxRadius = span * 2.5;
    }
  };

  const drawFrame = () => {
    rafPending = false;
    if (!renderer || stageEl.hidden) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = Math.max(1, canvas.clientWidth);
    const cssH = Math.max(1, canvas.clientHeight);
    const w = Math.round(cssW * dpr);
    const h = Math.round(cssH * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const eye: [number, number, number] = [
      target[0] + radius * Math.cos(pitch) * Math.sin(yaw),
      target[1] + radius * Math.sin(pitch),
      target[2] + radius * Math.cos(pitch) * Math.cos(yaw),
    ];
    const proj = mat4Perspective((config.camera.fovDeg * Math.PI) / 180, cssW / cssH, Math.max(0.5, radius * 0.01), Math.max(2000, radius * 8));
    const view = mat4LookAt(eye, target);
    const mvp = mat4Multiply(proj, view);
    renderer.render(mvp, w, h);

    pinsEl.hidden = !showLabels;
    if (showLabels) {
      for (const pin of pinNodes) {
        const [x, y, z] = pin.pos;
        const cx = mvp[0] * x + mvp[4] * y + mvp[8] * z + mvp[12];
        const cy = mvp[1] * x + mvp[5] * y + mvp[9] * z + mvp[13];
        const cw = mvp[3] * x + mvp[7] * y + mvp[11] * z + mvp[15];
        if (cw <= 0.01) {
          pin.el.hidden = true;
          continue;
        }
        const ndcX = cx / cw;
        const ndcY = cy / cw;
        if (Math.abs(ndcX) > 1.05 || Math.abs(ndcY) > 1.05) {
          pin.el.hidden = true;
          continue;
        }
        pin.el.hidden = false;
        pin.el.style.left = ((ndcX * 0.5 + 0.5) * cssW).toFixed(1) + 'px';
        pin.el.style.top = ((0.5 - ndcY * 0.5) * cssH).toFixed(1) + 'px';
      }
    }
  };

  const scheduleDraw = () => {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(drawFrame);
    }
  };

  const resetCamera = () => {
    yaw = initialYaw;
    pitch = initialPitch;
    radius = initialRadius;
    target = [...config.camera.target];
    scheduleDraw();
  };

  const unloadModel = (message?: string) => {
    controller?.abort();
    controller = null;
    renderer?.dispose();
    renderer = null;
    stageEl.hidden = true;
    toolbarEl.hidden = true;
    unloadBtn.hidden = true;
    cancelBtn.hidden = true;
    fallbackEl.hidden = false;
    loadBtn.hidden = false;
    loadBtn.disabled = false;
    loadBtn.textContent = `Load interactive 3D model (${formatMB(config.bytes)})`;
    statusEl.textContent = message ?? 'Static documentation photograph displayed. No 3D geometry is loaded.';
  };

  loadBtn.addEventListener('click', async () => {
    if (renderer) return;
    controller = new AbortController();
    loadBtn.disabled = true;
    cancelBtn.hidden = false;
    statusEl.textContent = `Downloading ${formatMB(config.bytes)} 3D model…`;
    try {
      const response = await fetch(config.src, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status} while loading 3D model.`);
      let buffer: ArrayBuffer;
      if (response.body && typeof response.body.getReader === 'function') {
        const reader = response.body.getReader();
        const total = Number(response.headers.get('Content-Length')) || config.bytes;
        const chunks: Uint8Array[] = [];
        let received = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.byteLength;
          statusEl.textContent = `Downloading 3D model… ${formatMB(received)} / ${formatMB(total)}`;
        }
        const merged = new Uint8Array(received);
        let pos = 0;
        for (const c of chunks) { merged.set(c, pos); pos += c.byteLength; }
        buffer = merged.buffer;
      } else {
        buffer = await response.arrayBuffer();
      }
      statusEl.textContent = 'Parsing glTF 2.0 geometry…';
      const parsed = parseGLB(buffer);
      updateCameraBounds(parsed);
      fallbackEl.hidden = true;
      stageEl.hidden = false;
      renderer = new GLSceneRenderer(canvas, parsed);
      toolbarEl.hidden = false;
      loadBtn.hidden = true;
      cancelBtn.hidden = true;
      unloadBtn.hidden = false;
      resetCamera();
      statusEl.textContent = `Loaded ${config.title} (${formatMB(buffer.byteLength)}). Drag to orbit, scroll to zoom, Shift+drag to pan.`;
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        unloadModel('3D download cancelled. Showing static documentation photograph.');
      } else {
        unloadModel(`Could not load interactive 3D view (${(err as Error).message}). Showing static photograph fallback.`);
        loadBtn.textContent = `Retry 3D model (${formatMB(config.bytes)})`;
      }
    } finally {
      controller = null;
    }
  });

  cancelBtn.addEventListener('click', () => {
    controller?.abort();
  });

  unloadBtn.addEventListener('click', () => {
    unloadModel();
  });

  toolbarEl.addEventListener('click', async (event) => {
    const btn = (event.target as Element).closest<HTMLButtonElement>('[data-3d-action]');
    if (!btn) return;
    const action = btn.dataset['3dAction'];
    if (action === 'left') { yaw -= 0.25; scheduleDraw(); }
    if (action === 'right') { yaw += 0.25; scheduleDraw(); }
    if (action === 'up') { pitch = Math.min(1.48, pitch + 0.16); scheduleDraw(); }
    if (action === 'down') { pitch = Math.max(0.12, pitch - 0.16); scheduleDraw(); }
    if (action === 'in') { radius = Math.max(minRadius, radius * 0.8); scheduleDraw(); }
    if (action === 'out') { radius = Math.min(maxRadius, radius * 1.25); scheduleDraw(); }
    if (action === 'reset') { resetCamera(); }
    if (action === 'labels') {
      showLabels = !showLabels;
      if (labelsBtn) labelsBtn.textContent = showLabels ? 'Hide labels' : 'Show labels';
      scheduleDraw();
    }
    if (action === 'fullscreen') {
      try {
        if (document.fullscreenElement === root) await document.exitFullscreen();
        else await root.requestFullscreen();
      } catch {
        statusEl.textContent = 'Full screen unavailable in this browser.';
      }
      scheduleDraw();
    }
  });

  canvas.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); yaw -= 0.18; scheduleDraw(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); yaw += 0.18; scheduleDraw(); }
    if (event.key === 'ArrowUp') { event.preventDefault(); pitch = Math.min(1.48, pitch + 0.12); scheduleDraw(); }
    if (event.key === 'ArrowDown') { event.preventDefault(); pitch = Math.max(0.12, pitch - 0.12); scheduleDraw(); }
    if (event.key === '+' || event.key === '=') { event.preventDefault(); radius = Math.max(minRadius, radius * 0.82); scheduleDraw(); }
    if (event.key === '-') { event.preventDefault(); radius = Math.min(maxRadius, radius * 1.22); scheduleDraw(); }
    if (event.key === 'r' || event.key === 'R') { event.preventDefault(); resetCamera(); }
    if (event.key === 'l' || event.key === 'L') {
      event.preventDefault();
      showLabels = !showLabels;
      if (labelsBtn) labelsBtn.textContent = showLabels ? 'Hide labels' : 'Show labels';
      scheduleDraw();
    }
  });

  let dragging = false;
  let panning = false;
  let lastX = 0, lastY = 0;
  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    panning = event.button === 2 || event.shiftKey;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dxPx = event.clientX - lastX;
    const dyPx = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    if (panning) {
      const scale = radius * 0.0022;
      const rightX = Math.cos(yaw), rightZ = -Math.sin(yaw);
      const fwdX = -Math.sin(yaw), fwdZ = -Math.cos(yaw);
      target[0] -= (dxPx * rightX - dyPx * fwdX) * scale;
      target[2] -= (dxPx * rightZ - dyPx * fwdZ) * scale;
    } else {
      yaw -= dxPx * 0.007;
      pitch = Math.max(0.1, Math.min(1.48, pitch + dyPx * 0.007));
    }
    scheduleDraw();
  });
  const endDrag = () => { dragging = false; panning = false; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const factor = event.deltaY > 0 ? 1.12 : 0.89;
    radius = Math.max(minRadius, Math.min(maxRadius, radius * factor));
    scheduleDraw();
  }, { passive: false });

  window.addEventListener('resize', scheduleDraw);
  document.addEventListener('fullscreenchange', scheduleDraw);
}

hydrateGuideReturnLinks();
for (const viewer of document.querySelectorAll<HTMLElement>('[data-site-3d]')) {
  mount3DViewer(viewer);
}
