const e = 4294967295, t = 65535, r = 134695760, n = r, s = 33639248, a = 101075792, i = 22, o = 16384, c = void 0, l = 1 / 0, u = "undefined", d = "function";
let f = 2;
try {
  typeof navigator != u && navigator.hardwareConcurrency && (f = navigator.hardwareConcurrency);
} catch {
}
const h = { workerURI: "./core/web-worker-wasm.js", wasmURI: "./core/streams/zlib-wasm/zlib-streams.wasm", chunkSize: 65536, maxWorkers: f, terminateWorkerTimeout: 5e3, useWebWorkers: true, useCompressionStream: true, CompressionStream: typeof CompressionStream != u && CompressionStream, DecompressionStream: typeof DecompressionStream != u && DecompressionStream }, p = Object.assign({}, h);
function w(e2) {
  const { baseURI: t2, chunkSize: r2, maxWorkers: n2, terminateWorkerTimeout: s2, useCompressionStream: a2, useWebWorkers: i2, CompressionStream: o2, DecompressionStream: c2, CompressionStreamZlib: l2, DecompressionStreamZlib: u2, workerURI: d2, wasmURI: f2 } = e2;
  g("baseURI", t2), g("wasmURI", f2), g("workerURI", d2), g("chunkSize", r2), g("maxWorkers", n2), g("terminateWorkerTimeout", s2), g("useCompressionStream", a2), g("useWebWorkers", i2), g("CompressionStream", o2), g("DecompressionStream", c2), g("CompressionStreamZlib", l2), g("DecompressionStreamZlib", u2);
}
function g(e2, t2) {
  t2 !== c && (p[e2] = t2);
}
const m = [];
for (let e2 = 0; e2 < 256; e2++) {
  let t2 = e2;
  for (let e3 = 0; e3 < 8; e3++) 1 & t2 ? t2 = t2 >>> 1 ^ 3988292384 : t2 >>>= 1;
  m[e2] = t2;
}
class y {
  constructor(e2) {
    this.crc = e2 || -1;
  }
  append(e2) {
    let t2 = 0 | this.crc;
    for (let r2 = 0, n2 = 0 | e2.length; r2 < n2; r2++) t2 = t2 >>> 8 ^ m[255 & (t2 ^ e2[r2])];
    this.crc = t2;
  }
  get() {
    return ~this.crc;
  }
}
class b extends TransformStream {
  constructor() {
    let e2;
    const t2 = new y();
    super({ transform(e3, r2) {
      t2.append(e3), r2.enqueue(e3);
    }, flush() {
      const r2 = new Uint8Array(4);
      new DataView(r2.buffer).setUint32(0, t2.get()), e2.value = r2;
    } }), e2 = this;
  }
}
const S = { concat(e2, t2) {
  if (0 === e2.length || 0 === t2.length) return e2.concat(t2);
  const r2 = e2[e2.length - 1], n2 = S.getPartial(r2);
  return 32 === n2 ? e2.concat(t2) : S._shiftRight(t2, n2, 0 | r2, e2.slice(0, e2.length - 1));
}, bitLength(e2) {
  const t2 = e2.length;
  if (0 === t2) return 0;
  const r2 = e2[t2 - 1];
  return 32 * (t2 - 1) + S.getPartial(r2);
}, clamp(e2, t2) {
  if (32 * e2.length < t2) return e2;
  const r2 = (e2 = e2.slice(0, Math.ceil(t2 / 32))).length;
  return t2 &= 31, r2 > 0 && t2 && (e2[r2 - 1] = S.partial(t2, e2[r2 - 1] & 2147483648 >> t2 - 1, 1)), e2;
}, partial: (e2, t2, r2) => 32 === e2 ? t2 : (r2 ? 0 | t2 : t2 << 32 - e2) + 1099511627776 * e2, getPartial: (e2) => Math.round(e2 / 1099511627776) || 32, _shiftRight(e2, t2, r2, n2) {
  for (void 0 === n2 && (n2 = []); t2 >= 32; t2 -= 32) n2.push(r2), r2 = 0;
  if (0 === t2) return n2.concat(e2);
  for (let s3 = 0; s3 < e2.length; s3++) n2.push(r2 | e2[s3] >>> t2), r2 = e2[s3] << 32 - t2;
  const s2 = e2.length ? e2[e2.length - 1] : 0, a2 = S.getPartial(s2);
  return n2.push(S.partial(t2 + a2 & 31, t2 + a2 > 32 ? r2 : n2.pop(), 1)), n2;
} }, k = { bytes: { fromBits(e2) {
  const t2 = S.bitLength(e2) / 8, r2 = new Uint8Array(t2);
  let n2;
  for (let s2 = 0; s2 < t2; s2++) 3 & s2 || (n2 = e2[s2 / 4]), r2[s2] = n2 >>> 24, n2 <<= 8;
  return r2;
}, toBits(e2) {
  const t2 = [];
  let r2, n2 = 0;
  for (r2 = 0; r2 < e2.length; r2++) n2 = n2 << 8 | e2[r2], 3 & ~r2 || (t2.push(n2), n2 = 0);
  return 3 & r2 && t2.push(S.partial(8 * (3 & r2), n2)), t2;
} } }, z = { sha1: class {
  constructor(e2) {
    const t2 = this;
    t2.blockSize = 512, t2._init = [1732584193, 4023233417, 2562383102, 271733878, 3285377520], t2._key = [1518500249, 1859775393, 2400959708, 3395469782], e2 ? (t2._h = e2._h.slice(0), t2._buffer = e2._buffer.slice(0), t2._length = e2._length) : t2.reset();
  }
  reset() {
    const e2 = this;
    return e2._h = e2._init.slice(0), e2._buffer = [], e2._length = 0, e2;
  }
  update(e2) {
    const t2 = this;
    "string" == typeof e2 && (e2 = k.utf8String.toBits(e2));
    const r2 = t2._buffer = S.concat(t2._buffer, e2), n2 = t2._length, s2 = t2._length = n2 + S.bitLength(e2);
    if (s2 > 9007199254740991) throw new Error("Cannot hash more than 2^53 - 1 bits");
    const a2 = new Uint32Array(r2);
    let i2 = 0;
    for (let e3 = t2.blockSize + n2 - (t2.blockSize + n2 & t2.blockSize - 1); e3 <= s2; e3 += t2.blockSize) t2._block(a2.subarray(16 * i2, 16 * (i2 + 1))), i2 += 1;
    return r2.splice(0, 16 * i2), t2;
  }
  finalize() {
    const e2 = this;
    let t2 = e2._buffer;
    const r2 = e2._h;
    t2 = S.concat(t2, [S.partial(1, 1)]);
    for (let e3 = t2.length + 2; 15 & e3; e3++) t2.push(0);
    for (t2.push(Math.floor(e2._length / 4294967296)), t2.push(0 | e2._length); t2.length; ) e2._block(t2.splice(0, 16));
    return e2.reset(), r2;
  }
  _f(e2, t2, r2, n2) {
    return e2 <= 19 ? t2 & r2 | ~t2 & n2 : e2 <= 39 ? t2 ^ r2 ^ n2 : e2 <= 59 ? t2 & r2 | t2 & n2 | r2 & n2 : e2 <= 79 ? t2 ^ r2 ^ n2 : void 0;
  }
  _S(e2, t2) {
    return t2 << e2 | t2 >>> 32 - e2;
  }
  _block(e2) {
    const t2 = this, r2 = t2._h, n2 = Array(80);
    for (let t3 = 0; t3 < 16; t3++) n2[t3] = e2[t3];
    let s2 = r2[0], a2 = r2[1], i2 = r2[2], o2 = r2[3], c2 = r2[4];
    for (let e3 = 0; e3 <= 79; e3++) {
      e3 >= 16 && (n2[e3] = t2._S(1, n2[e3 - 3] ^ n2[e3 - 8] ^ n2[e3 - 14] ^ n2[e3 - 16]));
      const r3 = t2._S(5, s2) + t2._f(e3, a2, i2, o2) + c2 + n2[e3] + t2._key[Math.floor(e3 / 20)] | 0;
      c2 = o2, o2 = i2, i2 = t2._S(30, a2), a2 = s2, s2 = r3;
    }
    r2[0] = r2[0] + s2 | 0, r2[1] = r2[1] + a2 | 0, r2[2] = r2[2] + i2 | 0, r2[3] = r2[3] + o2 | 0, r2[4] = r2[4] + c2 | 0;
  }
} }, x = { aes: class {
  constructor(e2) {
    const t2 = this;
    t2._tables = [[[], [], [], [], []], [[], [], [], [], []]], t2._tables[0][0][0] || t2._precompute();
    const r2 = t2._tables[0][4], n2 = t2._tables[1], s2 = e2.length;
    let a2, i2, o2, c2 = 1;
    if (4 !== s2 && 6 !== s2 && 8 !== s2) throw new Error("invalid aes key size");
    for (t2._key = [i2 = e2.slice(0), o2 = []], a2 = s2; a2 < 4 * s2 + 28; a2++) {
      let e3 = i2[a2 - 1];
      (a2 % s2 === 0 || 8 === s2 && a2 % s2 === 4) && (e3 = r2[e3 >>> 24] << 24 ^ r2[e3 >> 16 & 255] << 16 ^ r2[e3 >> 8 & 255] << 8 ^ r2[255 & e3], a2 % s2 === 0 && (e3 = e3 << 8 ^ e3 >>> 24 ^ c2 << 24, c2 = c2 << 1 ^ 283 * (c2 >> 7))), i2[a2] = i2[a2 - s2] ^ e3;
    }
    for (let e3 = 0; a2; e3++, a2--) {
      const t3 = i2[3 & e3 ? a2 : a2 - 4];
      o2[e3] = a2 <= 4 || e3 < 4 ? t3 : n2[0][r2[t3 >>> 24]] ^ n2[1][r2[t3 >> 16 & 255]] ^ n2[2][r2[t3 >> 8 & 255]] ^ n2[3][r2[255 & t3]];
    }
  }
  encrypt(e2) {
    return this._crypt(e2, 0);
  }
  decrypt(e2) {
    return this._crypt(e2, 1);
  }
  _precompute() {
    const e2 = this._tables[0], t2 = this._tables[1], r2 = e2[4], n2 = t2[4], s2 = [], a2 = [];
    let i2, o2, c2, l2;
    for (let e3 = 0; e3 < 256; e3++) a2[(s2[e3] = e3 << 1 ^ 283 * (e3 >> 7)) ^ e3] = e3;
    for (let u2 = i2 = 0; !r2[u2]; u2 ^= o2 || 1, i2 = a2[i2] || 1) {
      let a3 = i2 ^ i2 << 1 ^ i2 << 2 ^ i2 << 3 ^ i2 << 4;
      a3 = a3 >> 8 ^ 255 & a3 ^ 99, r2[u2] = a3, n2[a3] = u2, l2 = s2[c2 = s2[o2 = s2[u2]]];
      let d2 = 16843009 * l2 ^ 65537 * c2 ^ 257 * o2 ^ 16843008 * u2, f2 = 257 * s2[a3] ^ 16843008 * a3;
      for (let r3 = 0; r3 < 4; r3++) e2[r3][u2] = f2 = f2 << 24 ^ f2 >>> 8, t2[r3][a3] = d2 = d2 << 24 ^ d2 >>> 8;
    }
    for (let r3 = 0; r3 < 5; r3++) e2[r3] = e2[r3].slice(0), t2[r3] = t2[r3].slice(0);
  }
  _crypt(e2, t2) {
    if (4 !== e2.length) throw new Error("invalid aes block size");
    const r2 = this._key[t2], n2 = r2.length / 4 - 2, s2 = [0, 0, 0, 0], a2 = this._tables[t2], i2 = a2[0], o2 = a2[1], c2 = a2[2], l2 = a2[3], u2 = a2[4];
    let d2, f2, h2, p2 = e2[0] ^ r2[0], w2 = e2[t2 ? 3 : 1] ^ r2[1], g2 = e2[2] ^ r2[2], m2 = e2[t2 ? 1 : 3] ^ r2[3], y2 = 4;
    for (let e3 = 0; e3 < n2; e3++) d2 = i2[p2 >>> 24] ^ o2[w2 >> 16 & 255] ^ c2[g2 >> 8 & 255] ^ l2[255 & m2] ^ r2[y2], f2 = i2[w2 >>> 24] ^ o2[g2 >> 16 & 255] ^ c2[m2 >> 8 & 255] ^ l2[255 & p2] ^ r2[y2 + 1], h2 = i2[g2 >>> 24] ^ o2[m2 >> 16 & 255] ^ c2[p2 >> 8 & 255] ^ l2[255 & w2] ^ r2[y2 + 2], m2 = i2[m2 >>> 24] ^ o2[p2 >> 16 & 255] ^ c2[w2 >> 8 & 255] ^ l2[255 & g2] ^ r2[y2 + 3], y2 += 4, p2 = d2, w2 = f2, g2 = h2;
    for (let e3 = 0; e3 < 4; e3++) s2[t2 ? 3 & -e3 : e3] = u2[p2 >>> 24] << 24 ^ u2[w2 >> 16 & 255] << 16 ^ u2[g2 >> 8 & 255] << 8 ^ u2[255 & m2] ^ r2[y2++], d2 = p2, p2 = w2, w2 = g2, g2 = m2, m2 = d2;
    return s2;
  }
} }, U = { getRandomValues(e2) {
  const t2 = new Uint32Array(e2.buffer), r2 = (e3) => {
    let t3 = 987654321;
    const r3 = 4294967295;
    return function() {
      t3 = 36969 * (65535 & t3) + (t3 >> 16) & r3;
      return (((t3 << 16) + (e3 = 18e3 * (65535 & e3) + (e3 >> 16) & r3) & r3) / 4294967296 + 0.5) * (Math.random() > 0.5 ? 1 : -1);
    };
  };
  for (let n2, s2 = 0; s2 < e2.length; s2 += 4) {
    const e3 = r2(4294967296 * (n2 || Math.random()));
    n2 = 987654071 * e3(), t2[s2 / 4] = 4294967296 * e3() | 0;
  }
  return e2;
} }, A = { ctrGladman: class {
  constructor(e2, t2) {
    this._prf = e2, this._initIv = t2, this._iv = t2;
  }
  reset() {
    this._iv = this._initIv;
  }
  update(e2) {
    return this.calculate(this._prf, e2, this._iv);
  }
  incWord(e2) {
    if (255 & ~(e2 >> 24)) e2 += 1 << 24;
    else {
      let t2 = e2 >> 16 & 255, r2 = e2 >> 8 & 255, n2 = 255 & e2;
      255 === t2 ? (t2 = 0, 255 === r2 ? (r2 = 0, 255 === n2 ? n2 = 0 : ++n2) : ++r2) : ++t2, e2 = 0, e2 += t2 << 16, e2 += r2 << 8, e2 += n2;
    }
    return e2;
  }
  incCounter(e2) {
    0 === (e2[0] = this.incWord(e2[0])) && (e2[1] = this.incWord(e2[1]));
  }
  calculate(e2, t2, r2) {
    let n2;
    if (!(n2 = t2.length)) return [];
    const s2 = S.bitLength(t2);
    for (let s3 = 0; s3 < n2; s3 += 4) {
      this.incCounter(r2);
      const n3 = e2.encrypt(r2);
      t2[s3] ^= n3[0], t2[s3 + 1] ^= n3[1], t2[s3 + 2] ^= n3[2], t2[s3 + 3] ^= n3[3];
    }
    return S.clamp(t2, s2);
  }
} }, v = { importKey: (e2) => new v.hmacSha1(k.bytes.toBits(e2)), pbkdf2(e2, t2, r2, n2) {
  if (r2 = r2 || 1e4, n2 < 0 || r2 < 0) throw new Error("invalid params to pbkdf2");
  const s2 = 1 + (n2 >> 5) << 2;
  let a2, i2, o2, c2, l2;
  const u2 = new ArrayBuffer(s2), d2 = new DataView(u2);
  let f2 = 0;
  const h2 = S;
  for (t2 = k.bytes.toBits(t2), l2 = 1; f2 < (s2 || 1); l2++) {
    for (a2 = i2 = e2.encrypt(h2.concat(t2, [l2])), o2 = 1; o2 < r2; o2++) for (i2 = e2.encrypt(i2), c2 = 0; c2 < i2.length; c2++) a2[c2] ^= i2[c2];
    for (o2 = 0; f2 < (s2 || 1) && o2 < a2.length; o2++) d2.setInt32(f2, a2[o2]), f2 += 4;
  }
  return u2.slice(0, n2 / 8);
}, hmacSha1: class {
  constructor(e2) {
    const t2 = this, r2 = t2._hash = z.sha1, n2 = [[], []];
    t2._baseHash = [new r2(), new r2()];
    const s2 = t2._baseHash[0].blockSize / 32;
    e2.length > s2 && (e2 = new r2().update(e2).finalize());
    for (let t3 = 0; t3 < s2; t3++) n2[0][t3] = 909522486 ^ e2[t3], n2[1][t3] = 1549556828 ^ e2[t3];
    t2._baseHash[0].update(n2[0]), t2._baseHash[1].update(n2[1]), t2._resultHash = new r2(t2._baseHash[0]);
  }
  reset() {
    const e2 = this;
    e2._resultHash = new e2._hash(e2._baseHash[0]), e2._updated = false;
  }
  update(e2) {
    this._updated = true, this._resultHash.update(e2);
  }
  digest() {
    const e2 = this, t2 = e2._resultHash.finalize(), r2 = new e2._hash(e2._baseHash[1]).update(t2).finalize();
    return e2.reset(), r2;
  }
  encrypt(e2) {
    if (this._updated) throw new Error("encrypt on already updated hmac called!");
    return this.update(e2), this.digest(e2);
  }
} }, D = typeof crypto != u && typeof crypto.getRandomValues == d, _ = "Invalid password", F = "Invalid signature", O = "zipjs-abort-check-password";
function E(e2) {
  return D ? crypto.getRandomValues(e2) : U.getRandomValues(e2);
}
const T = 16, C = { name: "PBKDF2" }, R = Object.assign({ hash: { name: "HMAC" } }, C), W = Object.assign({ iterations: 1e3, hash: { name: "SHA-1" } }, C), M = ["deriveBits"], j = [8, 12, 16], I = [16, 24, 32], B = 10, P = [0, 0, 0, 0], L = typeof crypto != u, V = L && crypto.subtle, N = L && typeof V != u, Z = k.bytes, q = x.aes, H = A.ctrGladman, K = v.hmacSha1;
let G = L && N && typeof V.importKey == d, J = L && N && typeof V.deriveBits == d;
class Q extends TransformStream {
  constructor({ password: e2, rawPassword: t2, signed: r2, encryptionStrength: n2, checkPasswordOnly: s2 }) {
    super({ start() {
      Object.assign(this, { ready: new Promise((e3) => this.resolveReady = e3), password: ee(e2, t2), signed: r2, strength: n2 - 1, pending: new Uint8Array() });
    }, async transform(e3, t3) {
      const r3 = this, { password: n3, strength: a2, resolveReady: i2, ready: o2 } = r3;
      n3 ? (await (async function(e4, t4, r4, n4) {
        const s3 = await $(e4, t4, r4, re(n4, 0, j[t4])), a3 = re(n4, j[t4]);
        if (s3[0] != a3[0] || s3[1] != a3[1]) throw new Error(_);
      })(r3, a2, n3, re(e3, 0, j[a2] + 2)), e3 = re(e3, j[a2] + 2), s2 ? t3.error(new Error(O)) : i2()) : await o2;
      const c2 = new Uint8Array(e3.length - B - (e3.length - B) % T);
      t3.enqueue(Y(r3, e3, c2, 0, B, true));
    }, async flush(e3) {
      const { signed: t3, ctr: r3, hmac: n3, pending: s3, ready: a2 } = this;
      if (n3 && r3) {
        await a2;
        const i2 = re(s3, 0, s3.length - B), o2 = re(s3, s3.length - B);
        let c2 = new Uint8Array();
        if (i2.length) {
          const e4 = se(Z, i2);
          n3.update(e4);
          const t4 = r3.update(e4);
          c2 = ne(Z, t4);
        }
        if (t3) {
          const e4 = re(ne(Z, n3.digest()), 0, B);
          for (let t4 = 0; t4 < B; t4++) if (e4[t4] != o2[t4]) throw new Error(F);
        }
        e3.enqueue(c2);
      }
    } });
  }
}
class X extends TransformStream {
  constructor({ password: e2, rawPassword: t2, encryptionStrength: r2 }) {
    let n2;
    super({ start() {
      Object.assign(this, { ready: new Promise((e3) => this.resolveReady = e3), password: ee(e2, t2), strength: r2 - 1, pending: new Uint8Array() });
    }, async transform(e3, t3) {
      const r3 = this, { password: n3, strength: s2, resolveReady: a2, ready: i2 } = r3;
      let o2 = new Uint8Array();
      n3 ? (o2 = await (async function(e4, t4, r4) {
        const n4 = E(new Uint8Array(j[t4])), s3 = await $(e4, t4, r4, n4);
        return te(n4, s3);
      })(r3, s2, n3), a2()) : await i2;
      const c2 = new Uint8Array(o2.length + e3.length - e3.length % T);
      c2.set(o2, 0), t3.enqueue(Y(r3, e3, c2, o2.length, 0));
    }, async flush(e3) {
      const { ctr: t3, hmac: r3, pending: s2, ready: a2 } = this;
      if (r3 && t3) {
        await a2;
        let i2 = new Uint8Array();
        if (s2.length) {
          const e4 = t3.update(se(Z, s2));
          r3.update(e4), i2 = ne(Z, e4);
        }
        n2.signature = ne(Z, r3.digest()).slice(0, B), e3.enqueue(te(i2, n2.signature));
      }
    } }), n2 = this;
  }
}
function Y(e2, t2, r2, n2, s2, a2) {
  const { ctr: i2, hmac: o2, pending: c2 } = e2, l2 = t2.length - s2;
  let u2;
  for (c2.length && (t2 = te(c2, t2), r2 = (function(e3, t3) {
    if (t3 && t3 > e3.length) {
      const r3 = e3;
      (e3 = new Uint8Array(t3)).set(r3, 0);
    }
    return e3;
  })(r2, l2 - l2 % T)), u2 = 0; u2 <= l2 - T; u2 += T) {
    const e3 = se(Z, re(t2, u2, u2 + T));
    a2 && o2.update(e3);
    const s3 = i2.update(e3);
    a2 || o2.update(s3), r2.set(ne(Z, s3), u2 + n2);
  }
  return e2.pending = re(t2, u2), r2;
}
async function $(e2, t2, r2, n2) {
  e2.password = null;
  const s2 = await (async function(e3, t3, r3, n3, s3) {
    if (!G) return v.importKey(t3);
    try {
      return await V.importKey(e3, t3, r3, n3, s3);
    } catch {
      return G = false, v.importKey(t3);
    }
  })("raw", r2, R, false, M), a2 = await (async function(e3, t3, r3) {
    if (!J) return v.pbkdf2(t3, e3.salt, W.iterations, r3);
    try {
      return await V.deriveBits(e3, t3, r3);
    } catch {
      return J = false, v.pbkdf2(t3, e3.salt, W.iterations, r3);
    }
  })(Object.assign({ salt: n2 }, W), s2, 8 * (2 * I[t2] + 2)), i2 = new Uint8Array(a2), o2 = se(Z, re(i2, 0, I[t2])), c2 = se(Z, re(i2, I[t2], 2 * I[t2])), l2 = re(i2, 2 * I[t2]);
  return Object.assign(e2, { keys: { key: o2, authentication: c2, passwordVerification: l2 }, ctr: new H(new q(o2), Array.from(P)), hmac: new K(c2) }), l2;
}
function ee(e2, t2) {
  return t2 === c ? (function(e3) {
    if (typeof TextEncoder == u) {
      e3 = unescape(encodeURIComponent(e3));
      const t3 = new Uint8Array(e3.length);
      for (let r2 = 0; r2 < t3.length; r2++) t3[r2] = e3.charCodeAt(r2);
      return t3;
    }
    return new TextEncoder().encode(e3);
  })(e2) : t2;
}
function te(e2, t2) {
  let r2 = e2;
  return e2.length + t2.length && (r2 = new Uint8Array(e2.length + t2.length), r2.set(e2, 0), r2.set(t2, e2.length)), r2;
}
function re(e2, t2, r2) {
  return e2.subarray(t2, r2);
}
function ne(e2, t2) {
  return e2.fromBits(t2);
}
function se(e2, t2) {
  return e2.toBits(t2);
}
class ae extends TransformStream {
  constructor({ password: e2, passwordVerification: t2, checkPasswordOnly: r2 }) {
    super({ start() {
      Object.assign(this, { password: e2, passwordVerification: t2 }), le(this, e2);
    }, transform(e3, t3) {
      const n2 = this;
      if (n2.password) {
        const t4 = oe(n2, e3.subarray(0, 12));
        if (n2.password = null, t4.at(-1) != n2.passwordVerification) throw new Error(_);
        e3 = e3.subarray(12);
      }
      r2 ? t3.error(new Error(O)) : t3.enqueue(oe(n2, e3));
    } });
  }
}
class ie extends TransformStream {
  constructor({ password: e2, passwordVerification: t2 }) {
    super({ start() {
      Object.assign(this, { password: e2, passwordVerification: t2 }), le(this, e2);
    }, transform(e3, t3) {
      const r2 = this;
      let n2, s2;
      if (r2.password) {
        r2.password = null;
        const t4 = E(new Uint8Array(12));
        t4[11] = r2.passwordVerification, n2 = new Uint8Array(e3.length + t4.length), n2.set(ce(r2, t4), 0), s2 = 12;
      } else n2 = new Uint8Array(e3.length), s2 = 0;
      n2.set(ce(r2, e3), s2), t3.enqueue(n2);
    } });
  }
}
function oe(e2, t2) {
  const r2 = new Uint8Array(t2.length);
  for (let n2 = 0; n2 < t2.length; n2++) r2[n2] = de(e2) ^ t2[n2], ue(e2, r2[n2]);
  return r2;
}
function ce(e2, t2) {
  const r2 = new Uint8Array(t2.length);
  for (let n2 = 0; n2 < t2.length; n2++) r2[n2] = de(e2) ^ t2[n2], ue(e2, t2[n2]);
  return r2;
}
function le(e2, t2) {
  const r2 = [305419896, 591751049, 878082192];
  Object.assign(e2, { keys: r2, crcKey0: new y(r2[0]), crcKey2: new y(r2[2]) });
  for (let r3 = 0; r3 < t2.length; r3++) ue(e2, t2.charCodeAt(r3));
}
function ue(e2, t2) {
  let [r2, n2, s2] = e2.keys;
  e2.crcKey0.append([t2]), r2 = ~e2.crcKey0.get(), n2 = he(Math.imul(he(n2 + fe(r2)), 134775813) + 1), e2.crcKey2.append([n2 >>> 24]), s2 = ~e2.crcKey2.get(), e2.keys = [r2, n2, s2];
}
function de(e2) {
  const t2 = 2 | e2.keys[2];
  return fe(Math.imul(t2, 1 ^ t2) >>> 8);
}
function fe(e2) {
  return 255 & e2;
}
function he(e2) {
  return 4294967295 & e2;
}
const pe = "Invalid uncompressed size";
class we extends TransformStream {
  constructor(e2, { chunkSize: t2, CompressionStreamZlib: r2, CompressionStream: n2 }) {
    super({});
    const { compressed: s2, encrypted: a2, useCompressionStream: i2, zipCrypto: o2, signed: c2, level: l2 } = e2, u2 = this;
    let d2, f2, h2 = super.readable;
    a2 && !o2 || !c2 || (d2 = new b(), h2 = be(h2, d2)), s2 && (h2 = ye(h2, i2, { level: l2, chunkSize: t2 }, n2, r2, n2)), a2 && (o2 ? h2 = be(h2, new ie(e2)) : (f2 = new X(e2), h2 = be(h2, f2))), me(u2, h2, () => {
      let e3;
      a2 && !o2 && (e3 = f2.signature), a2 && !o2 || !c2 || (e3 = new DataView(d2.value.buffer).getUint32(0)), u2.signature = e3;
    });
  }
}
class ge extends TransformStream {
  constructor(e2, { chunkSize: t2, DecompressionStreamZlib: r2, DecompressionStream: n2 }) {
    super({});
    const { zipCrypto: s2, encrypted: a2, signed: i2, signature: o2, compressed: c2, useCompressionStream: l2, deflate64: u2 } = e2;
    let d2, f2, h2 = super.readable;
    a2 && (s2 ? h2 = be(h2, new ae(e2)) : (f2 = new Q(e2), h2 = be(h2, f2))), c2 && (h2 = ye(h2, l2, { chunkSize: t2, deflate64: u2 }, n2, r2, n2)), a2 && !s2 || !i2 || (d2 = new b(), h2 = be(h2, d2)), me(this, h2, () => {
      if ((!a2 || s2) && i2) {
        const e3 = new DataView(d2.value.buffer);
        if (o2 != e3.getUint32(0, false)) throw new Error(F);
      }
    });
  }
}
function me(e2, t2, r2) {
  t2 = be(t2, new TransformStream({ flush: r2 })), Object.defineProperty(e2, "readable", { get: () => t2 });
}
function ye(e2, t2, r2, n2, s2, a2) {
  const i2 = t2 && n2 ? n2 : s2 || a2, o2 = r2.deflate64 ? "deflate64-raw" : "deflate-raw";
  try {
    e2 = be(e2, new i2(o2, r2));
  } catch (n3) {
    if (!t2) throw n3;
    if (s2) e2 = be(e2, new s2(o2, r2));
    else {
      if (!a2) throw n3;
      e2 = be(e2, new a2(o2, r2));
    }
  }
  return e2;
}
function be(e2, t2) {
  return e2.pipeThrough(t2);
}
const Se = "start", ke = "pull", ze = "data", xe = "close", Ue = "inflate";
class Ae extends TransformStream {
  constructor(e2, t2) {
    super({});
    const r2 = this, { codecType: n2 } = e2;
    let s2;
    n2.startsWith("deflate") ? s2 = we : n2.startsWith(Ue) && (s2 = ge), r2.outputSize = 0;
    let a2 = 0;
    const i2 = new s2(e2, t2), o2 = super.readable, l2 = new TransformStream({ transform(e3, t3) {
      e3 && e3.length && (a2 += e3.length, t3.enqueue(e3));
    }, flush() {
      Object.assign(r2, { inputSize: a2 });
    } }), u2 = new TransformStream({ transform(t3, n3) {
      if (t3 && t3.length && (n3.enqueue(t3), r2.outputSize += t3.length, e2.outputSize !== c && r2.outputSize > e2.outputSize)) throw new Error(pe);
    }, flush() {
      const { signature: e3 } = i2;
      Object.assign(r2, { signature: e3, inputSize: a2 });
    } });
    Object.defineProperty(r2, "readable", { get: () => o2.pipeThrough(l2).pipeThrough(i2).pipeThrough(u2) });
  }
}
class ve extends TransformStream {
  constructor(e2) {
    let t2;
    super({ transform: function r2(n2, s2) {
      if (t2) {
        const e3 = new Uint8Array(t2.length + n2.length);
        e3.set(t2), e3.set(n2, t2.length), n2 = e3, t2 = null;
      }
      n2.length > e2 ? (s2.enqueue(n2.slice(0, e2)), r2(n2.slice(e2), s2)) : t2 = n2;
    }, flush(e3) {
      t2 && t2.length && e3.enqueue(t2);
    } });
  }
}
const De = { type: "module" };
let _e, Fe, Oe, Ee = true;
try {
  Ee = typeof structuredClone == d && structuredClone(new DOMException("", "AbortError")).code !== c;
} catch {
}
class Te {
  constructor(e2, { readable: t2, writable: r2 }, { options: n2, config: s2, streamOptions: a2, useWebWorkers: i2, transferStreams: o2, workerURI: l2 }, d2) {
    const { signal: f2 } = a2;
    return Object.assign(e2, { busy: true, readable: t2.pipeThrough(new ve(s2.chunkSize)).pipeThrough(new Ce(a2), { signal: f2 }), writable: r2, options: Object.assign({}, n2), workerURI: l2, transferStreams: o2, terminate: () => new Promise((t3) => {
      const { worker: r3, busy: n3 } = e2;
      r3 ? (n3 ? e2.resolveTerminated = t3 : (r3.terminate(), t3()), e2.interface = null) : t3();
    }), onTaskFinished() {
      const { resolveTerminated: t3 } = e2;
      t3 && (e2.resolveTerminated = null, e2.terminated = true, e2.worker.terminate(), t3()), e2.busy = false, d2(e2);
    } }), _e === c && (_e = typeof Worker != u), (i2 && _e ? Me : We)(e2, s2);
  }
}
class Ce extends TransformStream {
  constructor({ onstart: e2, onprogress: t2, size: r2, onend: n2 }) {
    let s2 = 0;
    super({ async start() {
      e2 && await Re(e2, r2);
    }, async transform(e3, n3) {
      s2 += e3.length, t2 && await Re(t2, s2, r2), n3.enqueue(e3);
    }, async flush() {
      n2 && await Re(n2, s2);
    } });
  }
}
async function Re(e2, ...t2) {
  try {
    await e2(...t2);
  } catch {
  }
}
function We(e2, t2) {
  return { run: () => (async function({ options: e3, readable: t3, writable: r2, onTaskFinished: n2 }, s2) {
    let a2;
    try {
      if (!e3.useCompressionStream) try {
        await void 0;
      } catch {
        e3.useCompressionStream = true;
      }
      a2 = new Ae(e3, s2), await t3.pipeThrough(a2).pipeTo(r2, { preventClose: true, preventAbort: true });
      const { signature: n3, inputSize: i2, outputSize: o2 } = a2;
      return { signature: n3, inputSize: i2, outputSize: o2 };
    } catch (e4) {
      throw a2 && (e4.outputSize = a2.outputSize), e4;
    } finally {
      n2();
    }
  })(e2, t2) };
}
function Me(e2, t2) {
  const { baseURI: r2, chunkSize: n2 } = t2;
  let { wasmURI: s2 } = t2;
  if (!e2.interface) {
    let a2;
    typeof s2 == d && (s2 = s2());
    try {
      a2 = je(e2.workerURI, r2, e2);
    } catch {
      return _e = false, We(e2, t2);
    }
    Object.assign(e2, { worker: a2, interface: { run: () => (async function(e3, t3) {
      let r3, n3;
      const s3 = new Promise((e4, t4) => {
        r3 = e4, n3 = t4;
      });
      Object.assign(e3, { reader: null, writer: null, resolveResult: r3, rejectResult: n3, result: s3 });
      const { readable: a3, options: i2 } = e3, { writable: o2, closed: c2 } = (function(e4) {
        const { writable: t4, readable: r4 } = new TransformStream(), n4 = r4.pipeTo(e4, { preventClose: true });
        return { writable: t4, closed: n4 };
      })(e3.writable), l2 = Ie({ type: Se, options: i2, config: t3, readable: a3, writable: o2 }, e3);
      l2 || Object.assign(e3, { reader: a3.getReader(), writer: o2.getWriter() });
      const u2 = await s3;
      l2 || await o2.getWriter().close();
      return await c2, u2;
    })(e2, { chunkSize: n2, wasmURI: s2, baseURI: r2 }) } });
  }
  return e2.interface;
}
function je(e2, t2, r2, n2, s2 = true) {
  let a2, i2, o2;
  if (Fe === c) {
    const l2 = typeof e2 == d;
    i2 = l2 ? e2(s2) : e2;
    const u2 = i2.startsWith("data:"), f2 = i2.startsWith("blob:");
    if (u2 || f2) {
      n2 === c && (n2 = false), n2 && (o2 = De);
      try {
        a2 = new Worker(i2, o2);
      } catch (s3) {
        if (f2) try {
          URL.revokeObjectURL(i2);
        } catch {
        }
        if (l2 && f2) return je(e2, t2, r2, n2, false);
        if (n2) throw s3;
        return je(e2, t2, r2, true, false);
      }
    } else {
      n2 === c && (n2 = true), n2 && (o2 = De);
      try {
        i2 = new URL(i2, t2);
      } catch {
      }
      try {
        a2 = new Worker(i2, o2);
      } catch (a3) {
        if (n2) throw a3;
        return je(e2, t2, r2, false, s2);
      }
    }
    Fe = i2, Oe = o2;
  } else a2 = new Worker(Fe, Oe);
  return a2.addEventListener("message", (e3) => (async function({ data: e4 }, t3) {
    const { type: r3, value: n3, messageId: s3, result: a3, error: i3 } = e4, { reader: o3, writer: c2, resolveResult: l2, rejectResult: u2, onTaskFinished: d2 } = t3;
    try {
      if (i3) {
        const { message: e5, stack: t4, code: r4, name: n4, outputSize: s4 } = i3, a4 = new Error(e5);
        Object.assign(a4, { stack: t4, code: r4, name: n4, outputSize: s4 }), f2(a4);
      } else {
        if (r3 == ke) {
          const { value: e5, done: r4 } = await o3.read();
          Ie({ type: ze, value: e5, done: r4, messageId: s3 }, t3);
        }
        r3 == ze && (await c2.ready, await c2.write(new Uint8Array(n3)), Ie({ type: "ack", messageId: s3 }, t3)), r3 == xe && f2(null, a3);
      }
    } catch (i4) {
      Ie({ type: xe, messageId: s3 }, t3), f2(i4);
    }
    function f2(e5, t4) {
      e5 ? u2(e5) : l2(t4), c2 && c2.releaseLock(), d2();
    }
  })(e3, r2)), a2;
}
function Ie(e2, { worker: t2, writer: r2, onTaskFinished: n2, transferStreams: s2 }) {
  try {
    const { value: r3, readable: n3, writable: a2 } = e2, i2 = [];
    if (r3 && (e2.value = r3, i2.push(e2.value.buffer)), s2 && Ee ? (n3 && i2.push(n3), a2 && i2.push(a2)) : e2.readable = e2.writable = null, i2.length) try {
      return t2.postMessage(e2, i2), true;
    } catch {
      Ee = false, e2.readable = e2.writable = null, t2.postMessage(e2);
    }
    else t2.postMessage(e2);
  } catch (e3) {
    throw r2 && r2.releaseLock(), n2(), e3;
  }
}
let Be = [];
const Pe = [];
let Le = 0;
async function Ve(e2, t2) {
  const { options: r2, config: n2 } = t2, { transferStreams: s2, useWebWorkers: a2, useCompressionStream: i2, compressed: o2, signed: l2, encrypted: u2 } = r2, { workerURI: d2, maxWorkers: f2 } = n2;
  t2.transferStreams = s2 || s2 === c;
  const h2 = !(o2 || l2 || u2 || t2.transferStreams);
  return t2.useWebWorkers = !h2 && (a2 || a2 === c && n2.useWebWorkers), t2.workerURI = t2.useWebWorkers && d2 ? d2 : c, r2.useCompressionStream = i2 || i2 === c && n2.useCompressionStream, (await (async function() {
    const r3 = Be.find((e3) => !e3.busy);
    if (r3) return Ne(r3), new Te(r3, e2, t2, p2);
    if (Be.length < f2) {
      const r4 = { indexWorker: Le };
      return Le++, Be.push(r4), new Te(r4, e2, t2, p2);
    }
    return new Promise((r4) => Pe.push({ resolve: r4, stream: e2, workerOptions: t2 }));
  })()).run();
  function p2(e3) {
    if (Pe.length) {
      const [{ resolve: t3, stream: r3, workerOptions: n3 }] = Pe.splice(0, 1);
      t3(new Te(e3, r3, n3, p2));
    } else e3.worker ? (Ne(e3), (function(e4, t3) {
      const { config: r3 } = t3, { terminateWorkerTimeout: n3 } = r3;
      Number.isFinite(n3) && n3 >= 0 && (e4.terminated ? e4.terminated = false : e4.terminateTimeout = setTimeout(async () => {
        Be = Be.filter((t4) => t4 != e4);
        try {
          await e4.terminate();
        } catch {
        }
      }, n3));
    })(e3, t2)) : Be = Be.filter((t3) => t3 != e3);
  }
}
function Ne(e2) {
  const { terminateTimeout: t2 } = e2;
  t2 && (clearTimeout(t2), e2.terminateTimeout = null);
}
const Ze = 65536, qe = "writable";
class He {
  constructor() {
    this.size = 0;
  }
  init() {
    this.initialized = true;
  }
}
class Ke extends He {
  get readable() {
    const e2 = this, { chunkSize: t2 = Ze } = e2, r2 = new ReadableStream({ start() {
      this.chunkOffset = 0;
    }, async pull(n2) {
      const { offset: s2 = 0, size: a2, diskNumberStart: i2 } = r2, { chunkOffset: o2 } = this, l2 = a2 === c ? t2 : Math.min(t2, a2 - o2), u2 = await rt(e2, s2 + o2, l2, i2);
      n2.enqueue(u2), o2 + t2 > a2 || a2 === c && !u2.length && l2 ? n2.close() : this.chunkOffset += t2;
    } });
    return r2;
  }
}
class Ge extends Ke {
  constructor(e2) {
    super(), Object.assign(this, { blob: e2, size: e2.size });
  }
  async readUint8Array(e2, t2) {
    const r2 = this, n2 = e2 + t2, s2 = e2 || n2 < r2.size ? r2.blob.slice(e2, n2) : r2.blob;
    let a2 = await s2.arrayBuffer();
    return a2.byteLength > t2 && (a2 = a2.slice(e2, n2)), new Uint8Array(a2);
  }
}
class Je extends He {
  constructor(e2) {
    super();
    const t2 = new TransformStream(), r2 = [];
    e2 && r2.push(["Content-Type", e2]), Object.defineProperty(this, qe, { get: () => t2.writable }), this.blob = new Response(t2.readable, { headers: r2 }).blob();
  }
  getData() {
    return this.blob;
  }
}
class Qe extends Je {
  constructor(e2) {
    super(e2), Object.assign(this, { encoding: e2, utf8: !e2 || "utf-8" == e2.toLowerCase() });
  }
  async getData() {
    const { encoding: e2, utf8: t2 } = this, r2 = await super.getData();
    if (r2.text && t2) return r2.text();
    {
      const t3 = new FileReader();
      return new Promise((n2, s2) => {
        Object.assign(t3, { onload: ({ target: e3 }) => n2(e3.result), onerror: () => s2(t3.error) }), t3.readAsText(r2, e2);
      });
    }
  }
}
class Xe extends Ke {
  constructor(e2) {
    super(), this.readers = e2;
  }
  async init() {
    const e2 = this, { readers: t2 } = e2;
    e2.lastDiskNumber = 0, e2.lastDiskOffset = 0, await Promise.all(t2.map(async (r2, n2) => {
      await r2.init(), n2 != t2.length - 1 && (e2.lastDiskOffset += r2.size), e2.size += r2.size;
    })), super.init();
  }
  async readUint8Array(e2, t2, r2 = 0) {
    const n2 = this, { readers: s2 } = this;
    let a2, i2 = r2;
    -1 == i2 && (i2 = s2.length - 1);
    let o2 = e2;
    for (; s2[i2] && o2 >= s2[i2].size; ) o2 -= s2[i2].size, i2++;
    const c2 = s2[i2];
    if (c2) {
      const s3 = c2.size;
      if (o2 + t2 <= s3) a2 = await rt(c2, o2, t2);
      else {
        const i3 = s3 - o2;
        a2 = new Uint8Array(t2);
        const l2 = await rt(c2, o2, i3);
        a2.set(l2, 0);
        const u2 = await n2.readUint8Array(e2 + i3, t2 - i3, r2);
        a2.set(u2, i3), l2.length + u2.length < t2 && (a2 = a2.subarray(0, l2.length + u2.length));
      }
    } else a2 = new Uint8Array();
    return n2.lastDiskNumber = Math.max(i2, n2.lastDiskNumber), a2;
  }
}
class Ye extends He {
  constructor(e2, t2 = 4294967295) {
    super();
    const r2 = this;
    let n2, s2, a2;
    Object.assign(r2, { diskNumber: 0, diskOffset: 0, size: 0, maxSize: t2, availableSize: t2 });
    const i2 = new WritableStream({ async write(t3) {
      const { availableSize: i3 } = r2;
      if (a2) t3.length >= i3 ? (await o2(t3.subarray(0, i3)), await c2(), r2.diskOffset += n2.size, r2.diskNumber++, a2 = null, await this.write(t3.subarray(i3))) : await o2(t3);
      else {
        const { value: i4, done: o3 } = await e2.next();
        if (o3 && !i4) throw new Error("Writer iterator completed too soon");
        n2 = i4, n2.size = 0, n2.maxSize && (r2.maxSize = n2.maxSize), r2.availableSize = r2.maxSize, await tt(n2), s2 = i4.writable, a2 = s2.getWriter(), await this.write(t3);
      }
    }, async close() {
      await a2.ready, await c2();
    } });
    async function o2(e3) {
      const t3 = e3.length;
      t3 && (await a2.ready, await a2.write(e3), n2.size += t3, r2.size += t3, r2.availableSize -= t3);
    }
    async function c2() {
      await a2.close();
    }
    Object.defineProperty(r2, qe, { get: () => i2 });
  }
}
class $e {
  constructor(e2) {
    return Array.isArray(e2) && (e2 = new Xe(e2)), e2 instanceof ReadableStream && (e2 = { readable: e2 }), e2;
  }
}
class et {
  constructor(e2) {
    return e2.writable === c && typeof e2.next == d && (e2 = new Ye(e2)), e2 instanceof WritableStream && (e2 = { writable: e2 }), e2.size === c && (e2.size = 0), e2 instanceof Ye || Object.assign(e2, { diskNumber: 0, diskOffset: 0, availableSize: l, maxSize: l }), e2;
  }
}
async function tt(e2, t2) {
  if (!e2.init || e2.initialized) return Promise.resolve();
  await e2.init(t2);
}
function rt(e2, t2, r2, n2) {
  return e2.readUint8Array(t2, r2, n2);
}
const nt = "\0\u263A\u263B\u2665\u2666\u2663\u2660\u2022\u25D8\u25CB\u25D9\u2642\u2640\u266A\u266B\u263C\u25BA\u25C4\u2195\u203C\xB6\xA7\u25AC\u21A8\u2191\u2193\u2192\u2190\u221F\u2194\u25B2\u25BC !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\u2302\xC7\xFC\xE9\xE2\xE4\xE0\xE5\xE7\xEA\xEB\xE8\xEF\xEE\xEC\xC4\xC5\xC9\xE6\xC6\xF4\xF6\xF2\xFB\xF9\xFF\xD6\xDC\xA2\xA3\xA5\u20A7\u0192\xE1\xED\xF3\xFA\xF1\xD1\xAA\xBA\xBF\u2310\xAC\xBD\xBC\xA1\xAB\xBB\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255D\u255C\u255B\u2510\u2514\u2534\u252C\u251C\u2500\u253C\u255E\u255F\u255A\u2554\u2569\u2566\u2560\u2550\u256C\u2567\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256B\u256A\u2518\u250C\u2588\u2584\u258C\u2590\u2580\u03B1\xDF\u0393\u03C0\u03A3\u03C3\xB5\u03C4\u03A6\u0398\u03A9\u03B4\u221E\u03C6\u03B5\u2229\u2261\xB1\u2265\u2264\u2320\u2321\xF7\u2248\xB0\u2219\xB7\u221A\u207F\xB2\u25A0 ".split(""), st = 256 == nt.length;
function at(e2, t2) {
  return t2 && "cp437" == t2.trim().toLowerCase() ? (function(e3) {
    if (st) {
      let t3 = "";
      for (let r2 = 0; r2 < e3.length; r2++) t3 += nt[e3[r2]];
      return t3;
    }
    return new TextDecoder().decode(e3);
  })(e2) : new TextDecoder(t2).decode(e2);
}
const it = "filename", ot = "rawFilename", ct = "comment", lt = "rawComment", ut = "uncompressedSize", dt = "compressedSize", ft = "offset", ht = "diskNumberStart", pt = "lastModDate", wt = "rawLastModDate", gt = "lastAccessDate", mt = "rawLastAccessDate", yt = "creationDate", bt = "rawCreationDate", St = [it, ot, ut, dt, pt, wt, ct, lt, gt, yt, bt, ft, ht, "internalFileAttributes", "externalFileAttributes", "msdosAttributesRaw", "msdosAttributes", "msDosCompatible", "zip64", "encrypted", "version", "versionMadeBy", "zipCrypto", "directory", "executable", "compressionMethod", "signature", "extraField", "extraFieldUnix", "extraFieldInfoZip", "uid", "gid", "unixMode", "setuid", "setgid", "sticky", "bitFlag", "filenameUTF8", "commentUTF8", "rawExtraField", "extraFieldZip64", "extraFieldUnicodePath", "extraFieldUnicodeComment", "extraFieldAES", "extraFieldNTFS", "extraFieldExtendedTimestamp"];
class kt {
  constructor(e2) {
    St.forEach((t2) => this[t2] = e2[t2]);
  }
}
const zt = "File format is not recognized", xt = "Zip64 extra field not found", Ut = "Compression method not supported", At = "Split zip file", vt = "Overlapping entry found", Dt = "utf-8", _t = "cp437", Ft = [[ut, e], [dt, e], [ft, e], [ht, t]], Ot = { [t]: { getValue: Nt, bytes: 4 }, [e]: { getValue: Zt, bytes: 8 } };
class Et {
  constructor(e2, t2 = {}) {
    Object.assign(this, { reader: new $e(e2), options: t2, config: p, readRanges: [] });
  }
  async *getEntriesGenerator(n2 = {}) {
    const l2 = this;
    let { reader: u2 } = l2;
    const { config: d2 } = l2;
    if (await tt(u2), u2.size !== c && u2.readUint8Array || (u2 = new Ge(await new Response(u2.readable).blob()), await tt(u2)), u2.size < i) throw new Error(zt);
    u2.chunkSize = (function(e2) {
      return Math.max(e2.chunkSize, 64);
    })(d2);
    const f2 = await (async function(e2, t2, r2, n3, s2) {
      const a2 = new Uint8Array(4);
      !(function(e3, t3, r3) {
        e3.setUint32(t3, r3, true);
      })(qt(a2), 0, t2);
      const i2 = n3 + s2;
      return await o2(n3) || await o2(Math.min(i2, r2));
      async function o2(t3) {
        const s3 = r2 - t3, i3 = await rt(e2, s3, t3);
        for (let e3 = i3.length - n3; e3 >= 0; e3--) if (i3[e3] == a2[0] && i3[e3 + 1] == a2[1] && i3[e3 + 2] == a2[2] && i3[e3 + 3] == a2[3]) return { offset: s3 + e3, buffer: i3.slice(e3, e3 + n3).buffer };
      }
    })(u2, 101010256, u2.size, i, 1048560);
    if (!f2) {
      throw Nt(qt(await rt(u2, 0, 4))) == r ? new Error(At) : new Error("End of central directory not found");
    }
    const h2 = qt(f2);
    let p2 = Nt(h2, 12), w2 = Nt(h2, 16);
    const g2 = f2.offset, m2 = Vt(h2, 20), y2 = g2 + i + m2;
    let b2 = Vt(h2, 4);
    const S2 = u2.lastDiskNumber || 0;
    let k2 = Vt(h2, 6), z2 = Vt(h2, 8), x2 = 0, U2 = 0;
    if (w2 == e || p2 == e || z2 == t || k2 == t) {
      const r2 = qt(await rt(u2, f2.offset - 20, 20));
      if (117853008 == Nt(r2, 0)) {
        w2 = Zt(r2, 8);
        let n3 = await rt(u2, w2, 56, -1), s2 = qt(n3);
        const i2 = f2.offset - 20 - 56;
        if (Nt(s2, 0) != a && w2 != i2) {
          const e2 = w2;
          w2 = i2, w2 > e2 && (x2 = w2 - e2), n3 = await rt(u2, w2, 56, -1), s2 = qt(n3);
        }
        if (Nt(s2, 0) != a) throw new Error("End of Zip64 central directory locator not found");
        b2 == t && (b2 = Nt(s2, 16)), k2 == t && (k2 = Nt(s2, 20)), z2 == t && (z2 = Zt(s2, 32)), p2 == e && (p2 = Zt(s2, 40)), w2 -= p2;
      }
    }
    if (w2 >= u2.size && (x2 = u2.size - w2 - p2 - i, w2 = u2.size - p2 - i), S2 != b2) throw new Error(At);
    if (w2 < 0) throw new Error(zt);
    let A2 = 0, v2 = await rt(u2, w2, p2, k2), D2 = qt(v2);
    if (p2) {
      const e2 = f2.offset - p2;
      if (Nt(D2, A2) != s && w2 != e2) {
        const t2 = w2;
        w2 = e2, w2 > t2 && (x2 += w2 - t2), v2 = await rt(u2, w2, p2, k2), D2 = qt(v2);
      }
    }
    const _2 = f2.offset - w2 - (u2.lastDiskOffset || 0);
    if (p2 != _2 && _2 >= 0 && (p2 = _2, v2 = await rt(u2, w2, p2, k2), D2 = qt(v2)), w2 < 0 || w2 >= u2.size) throw new Error(zt);
    const F2 = It(l2, n2, "filenameEncoding"), O2 = It(l2, n2, "commentEncoding");
    for (let e2 = 0; e2 < z2; e2++) {
      const r2 = new Tt(u2, d2, l2.options);
      if (Nt(D2, A2) != s) throw new Error("Central directory header not found");
      Ct(r2, D2, A2 + 6);
      const a2 = Boolean(r2.bitFlag.languageEncodingFlag), i2 = A2 + 46, f3 = i2 + r2.filenameLength, h3 = f3 + r2.extraFieldLength, p3 = Vt(D2, A2 + 4), w3 = !(p3 >> 8), g3 = p3 >> 8 == 3, m3 = v2.subarray(i2, f3), y3 = Vt(D2, A2 + 32), b3 = h3 + y3, S3 = v2.subarray(h3, b3), k3 = a2, _3 = a2, E3 = Nt(D2, A2 + 38), T3 = 255 & E3, C2 = { readOnly: Boolean(1 & T3), hidden: Boolean(2 & T3), system: Boolean(4 & T3), directory: Boolean(16 & T3), archive: Boolean(32 & T3) }, R2 = Nt(D2, A2 + 42) + x2, W2 = It(l2, n2, "decodeText") || at, M2 = k3 ? Dt : F2 || _t, j2 = _3 ? Dt : O2 || _t;
      let I2 = W2(m3, M2);
      I2 === c && (I2 = at(m3, M2));
      let B2 = W2(S3, j2);
      B2 === c && (B2 = at(S3, j2)), Object.assign(r2, { versionMadeBy: p3, msDosCompatible: w3, compressedSize: 0, uncompressedSize: 0, commentLength: y3, offset: R2, diskNumberStart: Vt(D2, A2 + 34), internalFileAttributes: Vt(D2, A2 + 36), externalFileAttributes: E3, msdosAttributesRaw: T3, msdosAttributes: C2, rawFilename: m3, filenameUTF8: k3, commentUTF8: _3, rawExtraField: v2.subarray(f3, h3), rawComment: S3, filename: I2, comment: B2 }), U2 = Math.max(R2, U2), Rt(r2, r2, D2, A2 + 6);
      const P2 = r2.externalFileAttributes >> 16 & t;
      r2.unixMode === c && 16877 & P2 && (r2.unixMode = P2);
      const L2 = Boolean(2048 & r2.unixMode), V2 = Boolean(1024 & r2.unixMode), N2 = Boolean(512 & r2.unixMode), Z2 = r2.unixMode !== c ? !!(73 & r2.unixMode) : g3 && !!(73 & P2), q2 = r2.unixMode !== c && (61440 & r2.unixMode) == o, H2 = (61440 & P2) == o;
      Object.assign(r2, { setuid: L2, setgid: V2, sticky: N2, unixExternalUpper: P2, internalFileAttribute: r2.internalFileAttributes, externalFileAttribute: r2.externalFileAttributes, executable: Z2, directory: q2 || H2 || w3 && C2.directory || I2.endsWith("/") && !r2.uncompressedSize, zipCrypto: r2.encrypted && !r2.extraFieldAES });
      const K2 = new kt(r2);
      K2.getData = (e3, t2) => r2.getData(e3, K2, l2.readRanges, t2), K2.arrayBuffer = async (e3) => {
        const t2 = new TransformStream(), [n3] = await Promise.all([new Response(t2.readable).arrayBuffer(), r2.getData(t2, K2, l2.readRanges, e3)]);
        return n3;
      }, A2 = b3;
      const { onprogress: G2 } = n2;
      if (G2) try {
        await G2(e2 + 1, z2, new kt(r2));
      } catch {
      }
      yield K2;
    }
    const E2 = It(l2, n2, "extractPrependedData"), T2 = It(l2, n2, "extractAppendedData");
    return E2 && (l2.prependedData = U2 > 0 ? await rt(u2, 0, U2) : new Uint8Array()), l2.comment = m2 ? await rt(u2, g2 + i, m2) : new Uint8Array(), T2 && (l2.appendedData = y2 < u2.size ? await rt(u2, y2, u2.size - y2) : new Uint8Array()), true;
  }
  async getEntries(e2 = {}) {
    const t2 = [];
    for await (const r2 of this.getEntriesGenerator(e2)) t2.push(r2);
    return t2;
  }
  async close() {
  }
}
class Tt {
  constructor(e2, t2, r2) {
    Object.assign(this, { reader: e2, config: t2, options: r2 });
  }
  async getData(e2, t2, r2, s2 = {}) {
    const a2 = this, { reader: i2, offset: o2, diskNumberStart: l2, extraFieldAES: u2, extraFieldZip64: d2, compressionMethod: f2, config: h2, bitFlag: p2, signature: w2, rawLastModDate: g2, uncompressedSize: m2, compressedSize: y2 } = a2, { dataDescriptor: b2 } = p2, S2 = t2.localDirectory = {}, k2 = qt(await rt(i2, o2, 30, l2));
    let z2 = It(a2, s2, "password"), x2 = It(a2, s2, "rawPassword");
    const U2 = It(a2, s2, "passThrough");
    if (z2 = z2 && z2.length && z2, x2 = x2 && x2.length && x2, u2 && 99 != u2.originalCompressionMethod) throw new Error(Ut);
    if (0 != f2 && 8 != f2 && 9 != f2 && !U2) throw new Error(Ut);
    if (67324752 != Nt(k2, 0)) throw new Error("Local file header not found");
    Ct(S2, k2, 4);
    const { extraFieldLength: A2, filenameLength: v2, lastAccessDate: D2, creationDate: _2 } = S2;
    S2.rawExtraField = A2 ? await rt(i2, o2 + 30 + v2, A2, l2) : new Uint8Array(), Rt(a2, S2, k2, 4, true), Object.assign(t2, { lastAccessDate: D2, creationDate: _2 });
    const F2 = a2.encrypted && S2.encrypted && !U2, E2 = F2 && !u2;
    if (U2 || (t2.zipCrypto = E2), F2) {
      if (!E2 && u2.strength === c) throw new Error("Encryption method not supported");
      if (!z2 && !x2) throw new Error("File contains encrypted entry");
    }
    const T2 = o2 + 30 + v2 + A2, C2 = y2, R2 = i2.readable;
    Object.assign(R2, { diskNumberStart: l2, offset: T2, size: C2 });
    const W2 = It(a2, s2, "signal"), M2 = It(a2, s2, "checkPasswordOnly");
    let j2 = It(a2, s2, "checkOverlappingEntry");
    const I2 = It(a2, s2, "checkOverlappingEntryOnly");
    I2 && (j2 = true);
    const { onstart: B2, onprogress: P2, onend: L2 } = s2, V2 = 9 == f2;
    let N2 = It(a2, s2, "useCompressionStream");
    V2 && (N2 = false);
    const Z2 = { options: { codecType: Ue, password: z2, rawPassword: x2, zipCrypto: E2, encryptionStrength: u2 && u2.strength, signed: It(a2, s2, "checkSignature") && !U2, passwordVerification: E2 && (b2 ? g2 >>> 8 & 255 : w2 >>> 24 & 255), outputSize: U2 ? y2 : m2, signature: w2, compressed: 0 != f2 && !U2, encrypted: a2.encrypted && !U2, useWebWorkers: It(a2, s2, "useWebWorkers"), useCompressionStream: N2, transferStreams: It(a2, s2, "transferStreams"), deflate64: V2, checkPasswordOnly: M2 }, config: h2, streamOptions: { signal: W2, size: C2, onstart: B2, onprogress: P2, onend: L2 } };
    let q2;
    j2 && await (async function({ reader: e3, fileEntry: t3, offset: r3, diskNumberStart: s3, signature: a3, compressedSize: i3, uncompressedSize: o3, dataOffset: c2, dataDescriptor: l3, extraFieldZip64: u3, readRanges: d3 }) {
      let f3 = 0;
      if (s3) for (let t4 = 0; t4 < s3; t4++) {
        f3 += e3.readers[t4].size;
      }
      let h3 = 0;
      l3 && (h3 = u3 ? 20 : 12);
      if (h3) {
        const r4 = await rt(e3, c2 + i3, h3 + 4, s3);
        if (Nt(qt(r4), 0) == n) {
          const e4 = Nt(qt(r4), 4);
          let n2, s4;
          u3 ? (n2 = Zt(qt(r4), 8), s4 = Zt(qt(r4), 16)) : (n2 = Nt(qt(r4), 8), s4 = Nt(qt(r4), 12));
          (t3.encrypted && !t3.zipCrypto || e4 == a3) && n2 == i3 && s4 == o3 && (h3 += 4);
        }
      }
      const p3 = { start: f3 + r3, end: f3 + c2 + i3 + h3, fileEntry: t3 };
      for (const e4 of d3) if (e4.fileEntry != t3 && p3.start >= e4.start && p3.start < e4.end) {
        const t4 = new Error(vt);
        throw t4.overlappingEntry = e4.fileEntry, t4;
      }
      d3.push(p3);
    })({ reader: i2, fileEntry: t2, offset: o2, diskNumberStart: l2, signature: w2, compressedSize: y2, uncompressedSize: m2, dataOffset: T2, dataDescriptor: b2 || S2.bitFlag.dataDescriptor, extraFieldZip64: d2 || S2.extraFieldZip64, readRanges: r2 });
    try {
      if (!I2) {
        M2 && (e2 = new WritableStream()), e2 = new et(e2), await tt(e2, U2 ? y2 : m2), { writable: q2 } = e2;
        const { outputSize: t3 } = await Ve({ readable: R2, writable: q2 }, Z2);
        if (e2.size += t3, t3 != (U2 ? y2 : m2)) throw new Error(pe);
      }
    } catch (t3) {
      if (t3.outputSize !== c && (e2.size += t3.outputSize), !M2 || t3.message != O) throw t3;
    } finally {
      It(a2, s2, "preventClose") || !q2 || q2.locked || await q2.getWriter().close();
    }
    return M2 || I2 ? c : e2.getData ? e2.getData() : q2;
  }
}
function Ct(e2, t2, r2) {
  const n2 = e2.rawBitFlag = Vt(t2, r2 + 2), s2 = !(1 & ~n2), a2 = Nt(t2, r2 + 6);
  Object.assign(e2, { encrypted: s2, version: Vt(t2, r2), bitFlag: { level: (6 & n2) >> 1, dataDescriptor: !(8 & ~n2), languageEncodingFlag: !(2048 & ~n2) }, rawLastModDate: a2, lastModDate: Bt(a2), filenameLength: Vt(t2, r2 + 22), extraFieldLength: Vt(t2, r2 + 24) });
}
function Rt(e2, t2, r2, n2, s2) {
  const { rawExtraField: a2 } = t2, i2 = t2.extraField = /* @__PURE__ */ new Map(), o2 = qt(new Uint8Array(a2));
  let c2 = 0;
  try {
    for (; c2 < a2.length; ) {
      const e3 = Vt(o2, c2), t3 = Vt(o2, c2 + 2);
      i2.set(e3, { type: e3, data: a2.slice(c2 + 4, c2 + 4 + t3) }), c2 += 4 + t3;
    }
  } catch {
  }
  const l2 = Vt(r2, n2 + 4);
  Object.assign(t2, { signature: Nt(r2, n2 + 10), compressedSize: Nt(r2, n2 + 14), uncompressedSize: Nt(r2, n2 + 18) });
  const u2 = i2.get(1);
  u2 && (!(function(e3, t3) {
    t3.zip64 = true;
    const r3 = qt(e3.data), n3 = Ft.filter(([e4, r4]) => t3[e4] == r4);
    for (let s3 = 0, a3 = 0; s3 < n3.length; s3++) {
      const [i3, o3] = n3[s3];
      if (t3[i3] == o3) {
        const n4 = Ot[o3];
        t3[i3] = e3[i3] = n4.getValue(r3, a3), a3 += n4.bytes;
      } else if (e3[i3]) throw new Error(xt);
    }
  })(u2, t2), t2.extraFieldZip64 = u2);
  const d2 = i2.get(28789);
  d2 && (Wt(d2, it, ot, t2, e2), t2.extraFieldUnicodePath = d2);
  const f2 = i2.get(25461);
  f2 && (Wt(f2, ct, lt, t2, e2), t2.extraFieldUnicodeComment = f2);
  const h2 = i2.get(39169);
  h2 ? (!(function(e3, t3, r3) {
    const n3 = qt(e3.data), s3 = Lt(n3, 4);
    Object.assign(e3, { vendorVersion: Lt(n3, 0), vendorId: Lt(n3, 2), strength: s3, originalCompressionMethod: r3, compressionMethod: Vt(n3, 5) }), t3.compressionMethod = e3.compressionMethod;
  })(h2, t2, l2), t2.extraFieldAES = h2) : t2.compressionMethod = l2;
  const p2 = i2.get(10);
  p2 && (!(function(e3, t3) {
    const r3 = qt(e3.data);
    let n3, s3 = 4;
    try {
      for (; s3 < e3.data.length && !n3; ) {
        const t4 = Vt(r3, s3), a3 = Vt(r3, s3 + 2);
        1 == t4 && (n3 = e3.data.slice(s3 + 4, s3 + 4 + a3)), s3 += 4 + a3;
      }
    } catch {
    }
    try {
      if (n3 && 24 == n3.length) {
        const r4 = qt(n3), s4 = r4.getBigUint64(0, true), a3 = r4.getBigUint64(8, true), i3 = r4.getBigUint64(16, true);
        Object.assign(e3, { rawLastModDate: s4, rawLastAccessDate: a3, rawCreationDate: i3 });
        const o3 = Pt(s4), c3 = Pt(a3), l3 = { lastModDate: o3, lastAccessDate: c3, creationDate: Pt(i3) };
        Object.assign(e3, l3), Object.assign(t3, l3);
      }
    } catch {
    }
  })(p2, t2), t2.extraFieldNTFS = p2);
  const w2 = i2.get(30805);
  if (w2) Mt(w2, t2, false), t2.extraFieldUnix = w2;
  else {
    const e3 = i2.get(30837);
    e3 && (Mt(e3, t2, true), t2.extraFieldInfoZip = e3);
  }
  const g2 = i2.get(21589);
  g2 && (!(function(e3, t3, r3) {
    const n3 = qt(e3.data), s3 = Lt(n3, 0), a3 = [], i3 = [];
    r3 ? (1 & ~s3 || (a3.push(pt), i3.push(wt)), 2 & ~s3 || (a3.push(gt), i3.push(mt)), 4 & ~s3 || (a3.push(yt), i3.push(bt))) : e3.data.length >= 5 && (a3.push(pt), i3.push(wt));
    let o3 = 1;
    a3.forEach((r4, s4) => {
      if (e3.data.length >= o3 + 4) {
        const a4 = Nt(n3, o3);
        t3[r4] = e3[r4] = new Date(1e3 * a4);
        const c3 = i3[s4];
        e3[c3] = a4;
      }
      o3 += 4;
    });
  })(g2, t2, s2), t2.extraFieldExtendedTimestamp = g2);
  const m2 = i2.get(6534);
  m2 && (t2.extraFieldUSDZ = m2);
}
function Wt(e2, t2, r2, n2, s2) {
  const a2 = qt(e2.data), i2 = new y();
  i2.append(s2[r2]);
  const o2 = qt(new Uint8Array(4));
  o2.setUint32(0, i2.get(), true);
  const c2 = Nt(a2, 1);
  Object.assign(e2, { version: Lt(a2, 0), [t2]: at(e2.data.subarray(5)), valid: !s2.bitFlag.languageEncodingFlag && c2 == Nt(o2, 0) }), e2.valid && (n2[t2] = e2[t2], n2[t2 + "UTF8"] = true);
}
function Mt(e2, t2, r2) {
  try {
    const n2 = qt(new Uint8Array(e2.data));
    let s2 = 0;
    const a2 = Lt(n2, s2++), i2 = Lt(n2, s2++), o2 = e2.data.subarray(s2, s2 + i2);
    s2 += i2;
    const l2 = jt(o2), u2 = Lt(n2, s2++), d2 = e2.data.subarray(s2, s2 + u2);
    s2 += u2;
    const f2 = jt(d2);
    let h2 = c;
    if (!r2 && s2 + 2 <= e2.data.length) {
      const t3 = e2.data;
      h2 = new DataView(t3.buffer, t3.byteOffset + s2, 2).getUint16(0, true);
    }
    Object.assign(e2, { version: a2, uid: l2, gid: f2, unixMode: h2 }), l2 !== c && (t2.uid = l2), f2 !== c && (t2.gid = f2), h2 !== c && (t2.unixMode = h2);
  } catch {
  }
}
function jt(e2) {
  const t2 = new Uint8Array(4);
  t2.set(e2, 0);
  return new DataView(t2.buffer, t2.byteOffset, 4).getUint32(0, true);
}
function It(e2, t2, r2) {
  return t2[r2] === c ? e2.options[r2] : t2[r2];
}
function Bt(e2) {
  const r2 = (4294901760 & e2) >> 16, n2 = e2 & t;
  try {
    return new Date(1980 + ((65024 & r2) >> 9), ((480 & r2) >> 5) - 1, 31 & r2, (63488 & n2) >> 11, (2016 & n2) >> 5, 2 * (31 & n2), 0);
  } catch {
  }
}
function Pt(e2) {
  return new Date(Number(e2 / BigInt(1e4) - BigInt(116444736e5)));
}
function Lt(e2, t2) {
  return e2.getUint8(t2);
}
function Vt(e2, t2) {
  return e2.getUint16(t2, true);
}
function Nt(e2, t2) {
  return e2.getUint32(t2, true);
}
function Zt(e2, t2) {
  return Number(e2.getBigUint64(t2, true));
}
function qt(e2) {
  return new DataView(e2.buffer);
}
try {
  w({ baseURI: import.meta.url });
} catch {
}
export { Ge as BlobReader, Je as BlobWriter, Qe as TextWriter, Et as ZipReader, w as configure };
