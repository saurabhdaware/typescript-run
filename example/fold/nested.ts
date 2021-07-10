import fs from "fs";
import path from "path";

console.log(fs.readFileSync(path.join(__dirname, "hello.txt"), "utf8"));
