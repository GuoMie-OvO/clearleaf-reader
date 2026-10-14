var r = Uint8Array, n = Uint16Array, a = Int32Array, e = new r([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0]), i = new r([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0]), t = new r([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), f = function(r2, e2) {
  for (var i2 = new n(31), t2 = 0; t2 < 31; ++t2) i2[t2] = e2 += 1 << r2[t2 - 1];
  var f2 = new a(i2[30]);
  for (t2 = 1; t2 < 30; ++t2) for (var o2 = i2[t2]; o2 < i2[t2 + 1]; ++o2) f2[o2] = o2 - i2[t2] << 5 | t2;
  return { b: i2, r: f2 };
}, o = f(e, 2), v = o.b, l = o.r;
v[28] = 258, l[258] = 28;
for (var u = f(i, 0).b, c = new n(32768), d = 0; d < 32768; ++d) {
  var w = (43690 & d) >> 1 | (21845 & d) << 1;
  w = (61680 & (w = (52428 & w) >> 2 | (13107 & w) << 2)) >> 4 | (3855 & w) << 4, c[d] = ((65280 & w) >> 8 | (255 & w) << 8) >> 1;
}
var b = function(r2, a2, e2) {
  for (var i2 = r2.length, t2 = 0, f2 = new n(a2); t2 < i2; ++t2) r2[t2] && ++f2[r2[t2] - 1];
  var o2, v2 = new n(a2);
  for (t2 = 1; t2 < a2; ++t2) v2[t2] = v2[t2 - 1] + f2[t2 - 1] << 1;
  if (e2) {
    o2 = new n(1 << a2);
    var l2 = 15 - a2;
    for (t2 = 0; t2 < i2; ++t2) if (r2[t2]) for (var u2 = t2 << 4 | r2[t2], d2 = a2 - r2[t2], w2 = v2[r2[t2] - 1]++ << d2, b2 = w2 | (1 << d2) - 1; w2 <= b2; ++w2) o2[c[w2] >> l2] = u2;
  } else for (o2 = new n(i2), t2 = 0; t2 < i2; ++t2) r2[t2] && (o2[t2] = c[v2[r2[t2] - 1]++] >> 15 - r2[t2]);
  return o2;
}, s = new r(288);
for (d = 0; d < 144; ++d) s[d] = 8;
for (d = 144; d < 256; ++d) s[d] = 9;
for (d = 256; d < 280; ++d) s[d] = 7;
for (d = 280; d < 288; ++d) s[d] = 8;
var h = new r(32);
for (d = 0; d < 32; ++d) h[d] = 5;
var y = b(s, 9, 1), g = b(h, 5, 1), p = function(r2) {
  for (var n2 = r2[0], a2 = 1; a2 < r2.length; ++a2) r2[a2] > n2 && (n2 = r2[a2]);
  return n2;
}, k = function(r2, n2, a2) {
  var e2 = n2 / 8 | 0;
  return (r2[e2] | r2[e2 + 1] << 8) >> (7 & n2) & a2;
}, m = function(r2, n2) {
  var a2 = n2 / 8 | 0;
  return (r2[a2] | r2[a2 + 1] << 8 | r2[a2 + 2] << 16) >> (7 & n2);
}, x = function(r2) {
  return (r2 + 7) / 8 | 0;
}, T = ["unexpected EOF", "invalid block type", "invalid length/literal", "invalid distance", "stream finished", "no stream handler", , "no callback", "invalid UTF-8 data", "extra field too long", "date not in range 1980-2099", "filename too long", "stream finishing", "invalid zip data"], E = function(r2, n2, a2) {
  var e2 = new Error(n2 || T[r2]);
  if (e2.code = r2, Error.captureStackTrace && Error.captureStackTrace(e2, E), !a2) throw e2;
  return e2;
}, z = function(n2, a2, f2, o2) {
  var l2 = n2.length, c2 = o2 ? o2.length : 0;
  if (!l2 || a2.f && !a2.l) return f2 || new r(0);
  var d2 = !f2, w2 = d2 || 2 != a2.i, s2 = a2.i;
  d2 && (f2 = new r(3 * l2));
  var h2 = function(n3) {
    var a3 = f2.length;
    if (n3 > a3) {
      var e2 = new r(Math.max(2 * a3, n3));
      e2.set(f2), f2 = e2;
    }
  }, T2 = a2.f || 0, z2 = a2.p || 0, A2 = a2.b || 0, U2 = a2.l, D2 = a2.d, F = a2.m, M = a2.n, S = 8 * l2;
  do {
    if (!U2) {
      T2 = k(n2, z2, 1);
      var I = k(n2, z2 + 1, 3);
      if (z2 += 3, !I) {
        var O = n2[(P = x(z2) + 4) - 4] | n2[P - 3] << 8, j = P + O;
        if (j > l2) {
          s2 && E(0);
          break;
        }
        w2 && h2(A2 + O), f2.set(n2.subarray(P, j), A2), a2.b = A2 += O, a2.p = z2 = 8 * j, a2.f = T2;
        continue;
      }
      if (1 == I) U2 = y, D2 = g, F = 9, M = 5;
      else if (2 == I) {
        var q = k(n2, z2, 31) + 257, B = k(n2, z2 + 10, 15) + 4, C = q + k(n2, z2 + 5, 31) + 1;
        z2 += 14;
        for (var G = new r(C), H = new r(19), J = 0; J < B; ++J) H[t[J]] = k(n2, z2 + 3 * J, 7);
        z2 += 3 * B;
        var K = p(H), L = (1 << K) - 1, N = b(H, K, 1);
        for (J = 0; J < C; ) {
          var P, Q = N[k(n2, z2, L)];
          if (z2 += 15 & Q, (P = Q >> 4) < 16) G[J++] = P;
          else {
            var R = 0, V = 0;
            for (16 == P ? (V = 3 + k(n2, z2, 3), z2 += 2, R = G[J - 1]) : 17 == P ? (V = 3 + k(n2, z2, 7), z2 += 3) : 18 == P && (V = 11 + k(n2, z2, 127), z2 += 7); V--; ) G[J++] = R;
          }
        }
        var W = G.subarray(0, q), X = G.subarray(q);
        F = p(W), M = p(X), U2 = b(W, F, 1), D2 = b(X, M, 1);
      } else E(1);
      if (z2 > S) {
        s2 && E(0);
        break;
      }
    }
    w2 && h2(A2 + 131072);
    for (var Y = (1 << F) - 1, Z = (1 << M) - 1, $ = z2; ; $ = z2) {
      var _ = (R = U2[m(n2, z2) & Y]) >> 4;
      if ((z2 += 15 & R) > S) {
        s2 && E(0);
        break;
      }
      if (R || E(2), _ < 256) f2[A2++] = _;
      else {
        if (256 == _) {
          $ = z2, U2 = null;
          break;
        }
        var rr = _ - 254;
        if (_ > 264) {
          var nr = e[J = _ - 257];
          rr = k(n2, z2, (1 << nr) - 1) + v[J], z2 += nr;
        }
        var ar = D2[m(n2, z2) & Z], er = ar >> 4;
        ar || E(3), z2 += 15 & ar;
        X = u[er];
        if (er > 3) {
          nr = i[er];
          X += m(n2, z2) & (1 << nr) - 1, z2 += nr;
        }
        if (z2 > S) {
          s2 && E(0);
          break;
        }
        w2 && h2(A2 + 131072);
        var ir = A2 + rr;
        if (A2 < X) {
          var tr = c2 - X, fr = Math.min(X, ir);
          for (tr + A2 < 0 && E(3); A2 < fr; ++A2) f2[A2] = o2[tr + A2];
        }
        for (; A2 < ir; ++A2) f2[A2] = f2[A2 - X];
      }
    }
    a2.l = U2, a2.p = $, a2.b = A2, a2.f = T2, U2 && (T2 = 1, a2.m = F, a2.d = D2, a2.n = M);
  } while (!T2);
  return A2 != f2.length && d2 ? (function(n3, a3, e2) {
    return (null == e2 || e2 > n3.length) && (e2 = n3.length), new r(n3.subarray(a3, e2));
  })(f2, 0, A2) : f2.subarray(0, A2);
}, A = new r(0);
function U(r2, n2) {
  return z(r2.subarray((a2 = r2, e2 = n2 && n2.dictionary, (8 != (15 & a2[0]) || a2[0] >> 4 > 7 || (a2[0] << 8 | a2[1]) % 31) && E(6, "invalid zlib data"), (a2[1] >> 5 & 1) == +!e2 && E(6, "invalid zlib data: " + (32 & a2[1] ? "need" : "unexpected") + " dictionary"), 2 + (a2[1] >> 3 & 4)), -4), { i: 2 }, n2 && n2.out, n2 && n2.dictionary);
  var a2, e2;
}
var D = "undefined" != typeof TextDecoder && new TextDecoder();
try {
  D.decode(A, { stream: true });
} catch (r2) {
}
export { U as unzlibSync };
