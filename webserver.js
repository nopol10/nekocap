const express = require("express");
const app = express();
const path = require("path");
const port = 12341;

app.use(express.static("webdist"));

app.get("*", function (request, response) {
  response.sendFile(path.resolve(__dirname, "webdist", "index.html"));
});

app.listen(port, () => {
  console.log(`Websubs website running at http://localhost:${port}`);
});
