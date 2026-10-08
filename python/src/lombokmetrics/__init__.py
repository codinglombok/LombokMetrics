from __future__ import annotations

import math
import re
from decimal import Decimal
from typing import Optional

_NAME = re.compile(r"[a-zA-Z_:][a-zA-Z0-9_:]*")
_LABEL = re.compile(r"[a-zA-Z_][a-zA-Z0-9_]*")


def format_number(x: float) -> str:
    if math.isnan(x):
        return "NaN"
    if x == math.inf:
        return "+Inf"
    if x == -math.inf:
        return "-Inf"
    if x == 0:
        return "0"
    t = Decimal(repr(abs(float(x)))).as_tuple()
    digs = "".join(map(str, t.digits))
    e10 = t.exponent
    while len(digs) > 1 and digs.endswith("0"):
        digs = digs[:-1]
        e10 += 1
    exp = e10 + len(digs) - 1
    if -5 <= exp < 15:
        if exp >= 0:
            out = digs + "0" * (exp + 1 - len(digs)) if len(digs) <= exp + 1 else digs[: exp + 1] + "." + digs[exp + 1 :]
        else:
            out = "0." + "0" * (-exp - 1) + digs
    else:
        ae = abs(exp)
        out = digs[0] + ("." + digs[1:] if len(digs) > 1 else "") + "e" + ("-" if exp < 0 else "+") + ("0" if ae < 10 else "") + str(ae)
    return "-" + out if x < 0 else out


def _esc_help(s: str) -> str:
    return s.replace("\\", "\\\\").replace("\n", "\\n")


def _esc_val(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")


class _Series:
    __slots__ = ("values", "v", "buckets", "sum", "count")

    def __init__(self, values: list[str], nb: int) -> None:
        self.values = values
        self.v = 0.0
        self.buckets = [0] * nb
        self.sum = 0.0
        self.count = 0


class _Metric:
    def __init__(self, kind: str, name: str, help_: str, label_names: list[str], bounds: list[float]) -> None:
        self.kind, self.name, self.help, self.label_names, self.bounds = kind, name, help_, label_names, bounds
        self._series: dict[tuple, _Series] = {}
        if not label_names:
            self._get({})

    def _get(self, labels: dict[str, str]) -> _Series:
        if set(labels.keys()) != set(self.label_names) or len(labels) != len(self.label_names):
            raise ValueError("labels must match label names exactly")
        values = [labels[n] for n in self.label_names]
        if not all(isinstance(v, str) for v in values):
            raise ValueError("label values must be strings")
        key = tuple(values)
        s = self._series.get(key)
        if s is None:
            s = self._series[key] = _Series(values, len(self.bounds))
        return s

    def lines(self) -> list[str]:
        out: list[str] = []
        if self.help != "":
            out.append(f"# HELP {self.name} {_esc_help(self.help)}")
        out.append(f"# TYPE {self.name} {self.kind}")

        def lab(s: _Series, le: Optional[str] = None) -> str:
            parts = [f'{n}="{_esc_val(s.values[i])}"' for i, n in enumerate(self.label_names)]
            if le is not None:
                parts.append(f'le="{le}"')
            return "{" + ",".join(parts) + "}" if parts else ""

        for s in sorted(self._series.values(), key=lambda s: s.values):
            if self.kind == "histogram":
                cum = 0
                for i, b in enumerate(self.bounds):
                    cum += s.buckets[i]
                    out.append(f"{self.name}_bucket{lab(s, format_number(b))} {cum}")
                out.append(f'{self.name}_bucket{lab(s, "+Inf")} {s.count}')
                out.append(f"{self.name}_sum{lab(s)} {format_number(s.sum)}")
                out.append(f"{self.name}_count{lab(s)} {s.count}")
            else:
                out.append(f"{self.name}{lab(s)} {format_number(s.v)}")
        return out


class Counter(_Metric):
    def inc(self, labels: Optional[dict[str, str]] = None, v: float = 1) -> None:
        if not math.isfinite(v) or v < 0:
            raise ValueError("counter increment must be finite and >= 0")
        self._get(labels or {}).v += v


class Gauge(_Metric):
    def set(self, labels: dict[str, str], v: float) -> None:
        if math.isnan(v):
            raise ValueError("NaN not allowed")
        self._get(labels).v = v

    def inc(self, labels: Optional[dict[str, str]] = None, v: float = 1) -> None:
        if not math.isfinite(v):
            raise ValueError("increment must be finite")
        self._get(labels or {}).v += v

    def dec(self, labels: Optional[dict[str, str]] = None, v: float = 1) -> None:
        self.inc(labels, -v)


class Histogram(_Metric):
    def observe(self, labels: dict[str, str], v: float) -> None:
        if not math.isfinite(v):
            raise ValueError("observation must be finite")
        s = self._get(labels)
        for i, b in enumerate(self.bounds):
            if v <= b:
                s.buckets[i] += 1
                break
        s.sum += v
        s.count += 1


class Registry:
    def __init__(self) -> None:
        self._m: dict[str, _Metric] = {}

    def _add(self, m: _Metric) -> _Metric:
        if _NAME.fullmatch(m.name) is None:
            raise ValueError("invalid metric name")
        if m.name in self._m:
            raise ValueError("duplicate metric name")
        self._m[m.name] = m
        return m

    @staticmethod
    def _labels(names: list[str], histogram: bool) -> list[str]:
        seen: set[str] = set()
        for n in names:
            if _LABEL.fullmatch(n) is None or n.startswith("__") or n in seen or (histogram and n == "le"):
                raise ValueError("invalid label name")
            seen.add(n)
        return list(names)

    def counter(self, name: str, help: str = "", label_names: Optional[list[str]] = None) -> Counter:
        return self._add(Counter("counter", name, help, self._labels(label_names or [], False), []))  # type: ignore[return-value]

    def gauge(self, name: str, help: str = "", label_names: Optional[list[str]] = None) -> Gauge:
        return self._add(Gauge("gauge", name, help, self._labels(label_names or [], False), []))  # type: ignore[return-value]

    def histogram(self, name: str, buckets: list[float], help: str = "", label_names: Optional[list[str]] = None) -> Histogram:
        if not buckets or any(not math.isfinite(b) or (i > 0 and b <= buckets[i - 1]) for i, b in enumerate(buckets)):
            raise ValueError("buckets must be finite and strictly increasing")
        return self._add(Histogram("histogram", name, help, self._labels(label_names or [], True), list(buckets)))  # type: ignore[return-value]

    def render(self) -> str:
        lines: list[str] = []
        for n in sorted(self._m):
            lines.extend(self._m[n].lines())
        return "\n".join(lines) + "\n" if lines else ""
