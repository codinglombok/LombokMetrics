export type Labels = Record<string, string>;

const NAME_RE = /^[a-zA-Z_:][a-zA-Z0-9_:]*$/;
const LABEL_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/** Format angka kanonik: tanpa pembulatan, desimal untuk 1e-5 <= |x| < 1e15, selain itu notasi ilmiah d.ddde+XX. */
export function formatNumber(x: number): string {
  if (Number.isNaN(x)) return "NaN";
  if (x === Infinity) return "+Inf";
  if (x === -Infinity) return "-Inf";
  if (x === 0) return "0";
  const neg = x < 0;
  const [m, e] = Math.abs(x).toExponential().split("e");
  const digits = m.replace(".", "");
  const exp = parseInt(e, 10);
  let out: string;
  if (exp >= -5 && exp < 15) {
    if (exp >= 0) {
      out = digits.length <= exp + 1 ? digits + "0".repeat(exp + 1 - digits.length) : digits.slice(0, exp + 1) + "." + digits.slice(exp + 1);
    } else {
      out = "0." + "0".repeat(-exp - 1) + digits;
    }
  } else {
    const ae = Math.abs(exp);
    out = digits[0] + (digits.length > 1 ? "." + digits.slice(1) : "") + "e" + (exp < 0 ? "-" : "+") + (ae < 10 ? "0" : "") + ae;
  }
  return neg ? "-" + out : out;
}

function cmpStr(a: string, b: string): number {
  const x = Array.from(a, (c) => c.codePointAt(0) as number);
  const y = Array.from(b, (c) => c.codePointAt(0) as number);
  const n = Math.min(x.length, y.length);
  for (let i = 0; i < n; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  return x.length === y.length ? 0 : x.length < y.length ? -1 : 1;
}
function cmpVals(a: string[], b: string[]): number {
  for (let i = 0; i < a.length; i++) {
    const c = cmpStr(a[i], b[i]);
    if (c !== 0) return c;
  }
  return 0;
}
const escHelp = (s: string): string => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n");
const escVal = (s: string): string => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");

type Kind = "counter" | "gauge" | "histogram";
interface Series {
  values: string[];
  v: number;
  buckets: number[];
  sum: number;
  count: number;
}

class Metric {
  protected series = new Map<string, Series>();
  readonly kind: Kind;
  readonly name: string;
  readonly help: string;
  readonly labelNames: string[];
  readonly bounds: number[];
  constructor(kind: Kind, name: string, help: string, labelNames: string[], bounds: number[]) {
    this.kind = kind;
    this.name = name;
    this.help = help;
    this.labelNames = labelNames;
    this.bounds = bounds;
    if (labelNames.length === 0) this.get({});
  }
  protected get(labels: Labels): Series {
    const keys = Object.keys(labels);
    if (keys.length !== this.labelNames.length || !this.labelNames.every((n) => Object.prototype.hasOwnProperty.call(labels, n))) {
      throw new RangeError("labels must match label names exactly");
    }
    const values = this.labelNames.map((n) => labels[n]);
    for (const v of values) if (typeof v !== "string") throw new RangeError("label values must be strings");
    const key = JSON.stringify(values);
    let s = this.series.get(key);
    if (!s) {
      s = { values, v: 0, buckets: this.bounds.map(() => 0), sum: 0, count: 0 };
      this.series.set(key, s);
    }
    return s;
  }
  lines(): string[] {
    const out: string[] = [];
    if (this.help !== "") out.push(`# HELP ${this.name} ${escHelp(this.help)}`);
    out.push(`# TYPE ${this.name} ${this.kind}`);
    const all = [...this.series.values()].sort((a, b) => cmpVals(a.values, b.values));
    const lab = (s: Series, le?: string): string => {
      const parts = this.labelNames.map((n, i) => `${n}="${escVal(s.values[i])}"`);
      if (le !== undefined) parts.push(`le="${le}"`);
      return parts.length ? "{" + parts.join(",") + "}" : "";
    };
    for (const s of all) {
      if (this.kind === "histogram") {
        let cum = 0;
        this.bounds.forEach((b, i) => {
          cum += s.buckets[i];
          out.push(`${this.name}_bucket${lab(s, formatNumber(b))} ${cum}`);
        });
        out.push(`${this.name}_bucket${lab(s, "+Inf")} ${s.count}`);
        out.push(`${this.name}_sum${lab(s)} ${formatNumber(s.sum)}`);
        out.push(`${this.name}_count${lab(s)} ${s.count}`);
      } else {
        out.push(`${this.name}${lab(s)} ${formatNumber(s.v)}`);
      }
    }
    return out;
  }
}

export class Counter extends Metric {
  inc(labels: Labels = {}, v = 1): void {
    if (!Number.isFinite(v) || v < 0) throw new RangeError("counter increment must be finite and >= 0");
    this.get(labels).v += v;
  }
}
export class Gauge extends Metric {
  set(labels: Labels, v: number): void {
    if (Number.isNaN(v)) throw new RangeError("NaN not allowed");
    this.get(labels).v = v;
  }
  inc(labels: Labels = {}, v = 1): void {
    if (!Number.isFinite(v)) throw new RangeError("increment must be finite");
    this.get(labels).v += v;
  }
  dec(labels: Labels = {}, v = 1): void {
    this.inc(labels, -v);
  }
}
export class Histogram extends Metric {
  observe(labels: Labels, v: number): void {
    if (!Number.isFinite(v)) throw new RangeError("observation must be finite");
    const s = this.get(labels);
    for (let i = 0; i < this.bounds.length; i++) {
      if (v <= this.bounds[i]) {
        s.buckets[i]++;
        break;
      }
    }
    s.sum += v;
    s.count++;
  }
}

export class Registry {
  private metrics = new Map<string, Metric>();
  private add<T extends Metric>(m: T): T {
    if (!NAME_RE.test(m.name)) throw new RangeError("invalid metric name");
    if (this.metrics.has(m.name)) throw new RangeError("duplicate metric name");
    this.metrics.set(m.name, m);
    return m;
  }
  private static labelNames(names: string[], histogram: boolean): string[] {
    const seen = new Set<string>();
    for (const n of names) {
      if (!LABEL_RE.test(n) || n.startsWith("__") || seen.has(n) || (histogram && n === "le")) throw new RangeError("invalid label name");
      seen.add(n);
    }
    return [...names];
  }
  counter(name: string, help = "", labelNames: string[] = []): Counter {
    return this.add(new Counter("counter", name, help, Registry.labelNames(labelNames, false), []));
  }
  gauge(name: string, help = "", labelNames: string[] = []): Gauge {
    return this.add(new Gauge("gauge", name, help, Registry.labelNames(labelNames, false), []));
  }
  histogram(name: string, buckets: number[], help = "", labelNames: string[] = []): Histogram {
    if (buckets.length === 0 || buckets.some((b, i) => !Number.isFinite(b) || (i > 0 && b <= buckets[i - 1]))) {
      throw new RangeError("buckets must be finite and strictly increasing");
    }
    return this.add(new Histogram("histogram", name, help, Registry.labelNames(labelNames, true), [...buckets]));
  }
  /** Teks eksposisi Prometheus 0.0.4; metrik diurutkan menurut nama (code point), tiap baris diakhiri LF. */
  render(): string {
    const names = [...this.metrics.keys()].sort(cmpStr);
    const lines: string[] = [];
    for (const n of names) lines.push(...(this.metrics.get(n) as Metric).lines());
    return lines.length ? lines.join("\n") + "\n" : "";
  }
}
