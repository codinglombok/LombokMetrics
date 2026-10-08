import { writeFileSync } from "node:fs";
import { Registry, formatNumber } from "../typescript/src/index.ts";

type Def = { kind: "counter" | "gauge" | "histogram"; name: string; help?: string; labels?: string[]; buckets?: number[] };
type Op = { m: string; op: "inc" | "dec" | "set" | "observe"; labels?: Record<string, string>; v?: number | string };
const num = (v: number | string | undefined): number => (v === "inf" ? Infinity : v === "-inf" ? -Infinity : v === "nan" ? NaN : v === undefined ? 1 : (v as number));

function define(reg: Registry, d: Def): unknown {
  if (d.kind === "counter") return reg.counter(d.name, d.help ?? "", d.labels ?? []);
  if (d.kind === "gauge") return reg.gauge(d.name, d.help ?? "", d.labels ?? []);
  return reg.histogram(d.name, d.buckets ?? [], d.help ?? "", d.labels ?? []);
}
function apply(reg: Registry, h: Map<string, any>, o: Op): void {
  const m = h.get(o.m);
  const l = o.labels ?? {};
  if (o.op === "observe") m.observe(l, num(o.v));
  else if (o.op === "set") m.set(l, num(o.v));
  else if (o.op === "inc") m.inc(l, o.v === undefined ? 1 : num(o.v));
  else m.dec(l, o.v === undefined ? 1 : num(o.v));
}
function run(defs: Def[], ops: Op[]): string {
  const reg = new Registry();
  const h = new Map<string, any>();
  for (const d of defs) h.set(d.name, define(reg, d));
  for (const o of ops) apply(reg, h, o);
  return reg.render();
}

const scenarios: { defs: Def[]; ops: Op[] }[] = [
  { defs: [], ops: [] },
  { defs: [{ kind: "counter", name: "requests_total", help: "Total requests." }], ops: [] },
  { defs: [{ kind: "counter", name: "requests_total", help: "Total requests." }], ops: [{ m: "requests_total", op: "inc" }, { m: "requests_total", op: "inc", v: 2.5 }] },
  { defs: [{ kind: "counter", name: "c" }], ops: [{ m: "c", op: "inc", v: 0 }] },
  {
    defs: [{ kind: "counter", name: "http_requests_total", help: "Requests by code.", labels: ["code", "method"] }],
    ops: [
      { m: "http_requests_total", op: "inc", labels: { code: "500", method: "GET" } },
      { m: "http_requests_total", op: "inc", labels: { code: "200", method: "POST" }, v: 3 },
      { m: "http_requests_total", op: "inc", labels: { code: "200", method: "GET" }, v: 2 },
      { m: "http_requests_total", op: "inc", labels: { code: "200", method: "GET" } },
    ],
  },
  {
    defs: [{ kind: "gauge", name: "temperature", help: "Line1\nLine2 \\ end", labels: ["room"] }],
    ops: [
      { m: "temperature", op: "set", labels: { room: 'a "quoted"\nname\\x' }, v: -3.25 },
      { m: "temperature", op: "set", labels: { room: "b" }, v: "inf" },
      { m: "temperature", op: "set", labels: { room: "c" }, v: "-inf" },
      { m: "temperature", op: "set", labels: { room: "\u00e9" }, v: 1e21 },
      { m: "temperature", op: "set", labels: { room: "\ud83d\ude00" }, v: 1e-7 },
      { m: "temperature", op: "set", labels: { room: "\uffff" }, v: 0.30000000000000004 },
    ],
  },
  { defs: [{ kind: "gauge", name: "g" }], ops: [{ m: "g", op: "inc" }, { m: "g", op: "inc", v: 4 }, { m: "g", op: "dec", v: 0.5 }, { m: "g", op: "dec" }] },
  { defs: [{ kind: "gauge", name: "g", help: "" }], ops: [{ m: "g", op: "set", v: 123456789012345 }, { m: "g", op: "set", v: 1e15 }] },
  {
    defs: [{ kind: "histogram", name: "latency_seconds", help: "Latency.", buckets: [0.1, 0.5, 1, 5] }],
    ops: [0.05, 0.1, 0.3, 0.5, 0.51, 2, 5, 7, 100, 0].map((v): Op => ({ m: "latency_seconds", op: "observe", v })),
  },
  {
    defs: [{ kind: "histogram", name: "size_bytes", buckets: [10, 100], labels: ["route"] }],
    ops: [
      { m: "size_bytes", op: "observe", labels: { route: "/b" }, v: 5 },
      { m: "size_bytes", op: "observe", labels: { route: "/a" }, v: 50.5 },
      { m: "size_bytes", op: "observe", labels: { route: "/a" }, v: 1000 },
      { m: "size_bytes", op: "observe", labels: { route: "/b" }, v: -2 },
    ],
  },
  { defs: [{ kind: "histogram", name: "h", buckets: [1e-5, 1.5e-6, 1e15].sort((a, b) => a - b) }], ops: [{ m: "h", op: "observe", v: 1e-6 }] },
  {
    defs: [{ kind: "gauge", name: "zeta" }, { kind: "counter", name: "alpha_total" }, { kind: "gauge", name: "Mid" }, { kind: "counter", name: "_u" }, { kind: "counter", name: "a:b" }],
    ops: [{ m: "zeta", op: "set", v: 1 }, { m: "alpha_total", op: "inc", v: 7 }],
  },
  {
    defs: [{ kind: "counter", name: "k_total", labels: ["a"] }],
    ops: ["b", "a", "B", "\u00e9", "\ud83d\ude00", "\uffff", "", "ab", "a b"].map((a): Op => ({ m: "k_total", op: "inc", labels: { a } })),
  },
];

const invalidDefs: { setup: Def[]; def: Def }[] = [
  { setup: [], def: { kind: "counter", name: "" } },
  { setup: [], def: { kind: "counter", name: "1abc" } },
  { setup: [], def: { kind: "counter", name: "a-b" } },
  { setup: [], def: { kind: "counter", name: "a b" } },
  { setup: [{ kind: "counter", name: "dup" }], def: { kind: "gauge", name: "dup" } },
  { setup: [], def: { kind: "counter", name: "x", labels: ["__reserved"] } },
  { setup: [], def: { kind: "counter", name: "x", labels: ["a", "a"] } },
  { setup: [], def: { kind: "counter", name: "x", labels: ["1a"] } },
  { setup: [], def: { kind: "counter", name: "x", labels: ["a-b"] } },
  { setup: [], def: { kind: "histogram", name: "x", buckets: [1], labels: ["le"] } },
  { setup: [], def: { kind: "histogram", name: "x", buckets: [] } },
  { setup: [], def: { kind: "histogram", name: "x", buckets: [1, 1] } },
  { setup: [], def: { kind: "histogram", name: "x", buckets: [2, 1] } },
  { setup: [], def: { kind: "histogram", name: "x", buckets: [1, Number.POSITIVE_INFINITY] } },
  { setup: [], def: { kind: "counter", name: "ok_name:with:colons" } },
  { setup: [], def: { kind: "counter", name: "x", labels: ["le"] } },
  { setup: [], def: { kind: "gauge", name: "x", labels: ["le"] } },
];
const invalidOps: { defs: Def[]; op: Op }[] = [
  { defs: [{ kind: "counter", name: "c" }], op: { m: "c", op: "inc", v: -1 } },
  { defs: [{ kind: "counter", name: "c" }], op: { m: "c", op: "inc", v: "nan" } },
  { defs: [{ kind: "counter", name: "c" }], op: { m: "c", op: "inc", v: "inf" } },
  { defs: [{ kind: "counter", name: "c" }], op: { m: "c", op: "inc", labels: { x: "1" } } },
  { defs: [{ kind: "counter", name: "c", labels: ["a"] }], op: { m: "c", op: "inc" } },
  { defs: [{ kind: "counter", name: "c", labels: ["a"] }], op: { m: "c", op: "inc", labels: { a: "1", b: "2" } } },
  { defs: [{ kind: "counter", name: "c", labels: ["a", "b"] }], op: { m: "c", op: "inc", labels: { a: "1", c: "2" } } },
  { defs: [{ kind: "gauge", name: "g" }], op: { m: "g", op: "set", v: "nan" } },
  { defs: [{ kind: "gauge", name: "g" }], op: { m: "g", op: "inc", v: "inf" } },
  { defs: [{ kind: "histogram", name: "h", buckets: [1] }], op: { m: "h", op: "observe", v: "inf" } },
  { defs: [{ kind: "histogram", name: "h", buckets: [1] }], op: { m: "h", op: "observe", v: "nan" } },
];
const jd = (d: Def) => JSON.parse(JSON.stringify(d, (_k, v) => (v === Infinity ? "inf" : v)));
const throws = (f: () => void): boolean => {
  try { f(); return false; } catch { return true; }
};
const idefs = invalidDefs.map((c) => {
  const reg = new Registry();
  for (const d of c.setup) define(reg, d);
  const error = throws(() => define(reg, c.def));
  return { setup: c.setup, def: jd(c.def), error };
});
const iops = invalidOps.map((c) => {
  const reg = new Registry();
  const h = new Map<string, any>();
  for (const d of c.defs) h.set(d.name, define(reg, d));
  return { defs: c.defs, op: c.op, error: throws(() => apply(reg, h, c.op)) };
});

const nums = [0, 1, -1, 0.1, 0.5, 1.5, 100, 1000, 12345.6789, 123456789012345, 999999999999999, 1e15, 1e16, 1.5e15, 1e21, 1.234e22, 1e-4, 1e-5, 1.5e-5, 9.99e-6, 1e-6, 1.5e-6, 1e-7, 5e-324, 2.2250738585072014e-308,
  1.7976931348623157e308, 0.30000000000000004, 0.1 + 0.7, 1 / 3, 2 / 3, 100.5, -0.001, -1e21, -1e-7, 1e14, 99999999999999.9, 123456.7, 4.35, 8.41, 1e300, 12e-5, 3e-5,
  ...Array.from({ length: 30 }, (_, i) => Number(`1.${i + 1}e${i * 2 - 20}`))];
const numCases = nums.map((x) => ({ x, out: formatNumber(x) }));
const specials = [["nan", "NaN"], ["inf", "+Inf"], ["-inf", "-Inf"]].map(([x, out]) => ({ x, out }));
const scn = scenarios.map((s) => ({ ...s, render: run(s.defs, s.ops) }));
const caseCount = numCases.length + specials.length + scn.length + idefs.length + iops.length;
writeFileSync(new URL("../vectors/lombokmetrics-vectors-v1.json", import.meta.url), JSON.stringify({ version: 1, caseCount, numbers: numCases, specials, scenarios: scn, invalidDefs: idefs, invalidOps: iops }, null, 1) + "\n");
console.log("cases", caseCount, "errors ok:", idefs.every((c) => c.error || c.def.name === "ok_name:with:colons" || c.def.labels?.[0] === "le"), iops.every((c) => c.error));
