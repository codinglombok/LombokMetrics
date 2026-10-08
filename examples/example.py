import pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "python" / "src"))
from lombokmetrics import Registry

reg = Registry()
req = reg.counter("http_requests_total", "Total requests.", ["code"])
lat = reg.histogram("request_seconds", [0.1, 0.5, 1], "Request latency.")
req.inc({"code": "200"}, 2)
req.inc({"code": "500"})
lat.observe({}, 0.07)
lat.observe({}, 0.6)
sys.stdout.write(reg.render())
