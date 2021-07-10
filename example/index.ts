// @ts-ignore
import fs from "fs";
// @ts-ignore
import path from "path";
import xyz from "./hi";
const a: number = 3;
const b: number = 911;

console.log(a + b);
console.log(xyz);
// @ts-ignore
console.log(fs.readFileSync(path.join(__dirname, "hello.txt"), "utf-8"));
