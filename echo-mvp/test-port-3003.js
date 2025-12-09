const http = require("http");

function test(port, message) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ message, accessToken: "mock", threadId: "test" });
    const req = http.request(
      {
        hostname: "localhost",
        port,
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

console.log("Testing port 3003 with @cal mention...\n");
test(3003, "@cal show schedule")
  .then((r) => {
    console.log("Response:", r.text);
    if (r.text.includes("coming soon")) {
      console.log("\n✅ SUCCESS! Port 3003 has the new @mention routing code!");
    } else {
      console.log("\n❌ FAIL: Port 3003 doesn't have the new code");
    }
  })
  .catch((e) => console.error("Error:", e.message));
