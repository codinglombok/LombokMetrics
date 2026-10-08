import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))
from lombokmetrics import Registry, format_number  # noqa: E402

V = json.loads((pathlib.Path(__file__).resolve().parents[2] / "vectors" / "lombokmetrics-vectors-v1.json").read_text("utf-8"))


def num(x):
    return {"inf": float("inf"), "-inf": float("-inf"), "nan": float("nan")}.get(x, 1 if x is None else x) if isinstance(x, str) or x is None else x


def define(reg, d):
    labels = d.get("labels") or []
    if d["kind"] == "counter":
        return reg.counter(d["name"], d.get("help", ""), labels)
    if d["kind"] == "gauge":
        return reg.gauge(d["name"], d.get("help", ""), labels)
    return reg.histogram(d["name"], [num(b) for b in d.get("buckets", [])], d.get("help", ""), labels)


def apply(h, o):
    m, l = h[o["m"]], o.get("labels") or {}
    if o["op"] == "observe":
        m.observe(l, num(o.get("v")))
    elif o["op"] == "set":
        m.set(l, num(o.get("v")))
    elif o["op"] == "inc":
        m.inc(l, num(o.get("v")))
    else:
        m.dec(l, num(o.get("v")))


def throws(f):
    try:
        f()
        return False
    except ValueError:
        return True


def test_count():
    assert V["caseCount"] >= 100


def test_numbers():
    for c in V["numbers"]:
        assert format_number(c["x"]) == c["out"], c
    for c in V["specials"]:
        assert format_number(num(c["x"])) == c["out"]


def test_scenarios():
    for s in V["scenarios"]:
        reg, h = Registry(), {}
        for d in s["defs"]:
            h[d["name"]] = define(reg, d)
        for o in s["ops"]:
            apply(h, o)
        assert reg.render() == s["render"], s["defs"]


def test_invalid_defs():
    for c in V["invalidDefs"]:
        reg = Registry()
        for d in c["setup"]:
            define(reg, d)
        assert throws(lambda: define(reg, c["def"])) == c["error"], c["def"]


def test_invalid_ops():
    for c in V["invalidOps"]:
        reg, h = Registry(), {}
        for d in c["defs"]:
            h[d["name"]] = define(reg, d)
        assert throws(lambda: apply(h, c["op"])) == c["error"], c["op"]
