var express = require("express");
var path = require("path");
var app = express();
var port = process.env.PORT || 3000;

app.use(express.static(__dirname + "/public"));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "public/js/app.js"));
});

app.listen(port, () => {
  console.log(`Server Up and running on ${port} port`);
});
