import fs from "fs";

const s = fs.readFileSync("prisma/seed.ts", "utf8");
const quotes = [];
const regex = /quotationNumber:\s*"([^"]+)",[\s\S]*?totalValue:\s*"([^"]+)",/g;
let m;
while ((m = regex.exec(s)) !== null) {
  quotes.push({ quote: m[1], total: m[2] });
}
console.log("Total quotes found:", quotes.length);
console.log(JSON.stringify(quotes, null, 2));
