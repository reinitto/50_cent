var express = require("express");
var app = express();
var port = 3000 || process.env.PORT;

app.use(express.static(__dirname + "/public"));

app.listen(port, () => {
  console.log(`Server Up and running on ${port} port`);
});
