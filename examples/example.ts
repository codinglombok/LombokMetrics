import { Registry } from "../typescript/src/index.ts";

const reg = new Registry();
const req = reg.counter("http_requests_total", "Total requests.", ["code"]);
const lat = reg.histogram("request_seconds", [0.1, 0.5, 1], "Request latency.");
req.inc({ code: "200" }, 2);
req.inc({ code: "500" });
lat.observe({}, 0.07);
lat.observe({}, 0.6);
process.stdout.write(reg.render());
