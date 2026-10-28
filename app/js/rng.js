// Seeded RNG. Sessions are reproducible from a seed so tests and reloads agree.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(text) {
  let hash = 2166136261;
  for (let i = 0; i < String(text).length; i += 1) {
    hash ^= String(text).charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seed = Date.now()) {
  const next = mulberry32(typeof seed === "string" ? hashSeed(seed) : seed);
  return {
    next,
    int(max) {
      return Math.floor(next() * max);
    },
    pick(list) {
      return list[Math.floor(next() * list.length)];
    },
    shuffle(list) {
      const out = [...list];
      for (let i = out.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    weighted(list, weightOf) {
      const weights = list.map((item) => Math.max(0, weightOf(item)));
      const total = weights.reduce((sum, weight) => sum + weight, 0);
      if (total <= 0) return list[Math.floor(next() * list.length)];
      let roll = next() * total;
      for (let i = 0; i < list.length; i += 1) {
        roll -= weights[i];
        if (roll <= 0) return list[i];
      }
      return list[list.length - 1];
    },
  };
}
