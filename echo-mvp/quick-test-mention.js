const http = require("http");

function test(message) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ message, accessToken: "mock", threadId: "test" });
    const req = http.request(
      {
        hostname: "localhost",
        port: 3002,
        path: "/api/chat",
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": data.length },
      },
      (res) => {
        let body = "";
        res.on("data", (d) => (body += d));
        res.on("end", () => resolve(JSON.parse(body)));
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

test("@cal show schedule")
  .then((r) => console.log("@cal:", r.text))
  .catch((e) => console.error(e));
