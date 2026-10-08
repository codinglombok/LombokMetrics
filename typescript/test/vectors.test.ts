import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Registry, formatNumber } from "../src/index.ts";

const v = JSON.parse(readFileSync(new URL("../../vectors/lombokmetrics-vectors-v1.json", import.meta.url), "utf8"));
const num = (x: unknown): number => (x === "inf" ? Infinity : x === "-inf" ? -Infinity : x === "nan" ? NaN : x === undefined ? 1 : (x as number));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const define = (reg: Registry, d: any): any =>
  d.kind === "counter" ? reg.counter(d.name, d.help ?? "", d.labels ?? [])
    : d.kind === "gauge" ? reg.gauge(d.name, d.help ?? "", d.labels ?? [])
      : reg.histogram(d.name, (d.buckets ?? []).map(num), d.help ?? "", d.labels ?? []);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apply = (h: Map<string, any>, o: any): void => {
  const m = h.get(o.m);
  const l = o.labels ?? {};
  if (o.op === "observe") m.observe(l, num(o.v));
  else if (o.op === "set") m.set(l, num(o.v));
  else if (o.op === "inc") m.inc(l, num(o.v));
  else m.dec(l, num(o.v));
};

test("vector count >= 100", () => assert.ok(v.caseCount >= 100));
test("formatNumber", () => {
  for (const c of v.numbers) assert.equal(formatNumber(c.x), c.out, String(c.x));
  for (const c of v.specials) assert.equal(formatNumber(num(c.x)), c.out);
});
test("scenarios", () => {
  for (const s of v.scenarios) {
    const reg = new Registry();
    const h = new Map();
    for (const d of s.defs) h.set(d.name, define(reg, d));
    for (const o of s.ops) apply(h, o);
    assert.equal(reg.render(), s.render);
  }
});
test("invalid definitions throw", () => {
  for (const c of v.invalidDefs) {
    const reg = new Registry();
    for (const d of c.setup) define(reg, d);
    assert.equal(throws(() => define(reg, c.def)), c.error, JSON.stringify(c.def));
  }
});
test("invalid operations throw", () => {
  for (const c of v.invalidOps) {
    const reg = new Registry();
    const h = new Map();
    for (const d of c.defs) h.set(d.name, define(reg, d));
    assert.equal(throws(() => apply(h, c.op)), c.error, JSON.stringify(c.op));
  }
});
function throws(f: () => void): boolean {
  try { f(); return false; } catch { return true; }
}
