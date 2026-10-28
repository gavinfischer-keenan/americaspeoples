import { readFile } from "node:fs/promises";
import { validateDataset } from "../src/validation";
const d = JSON.parse(await readFile("data/evidence.json", "utf8"));
const errors = validateDataset(d);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  `Validated ${d.records.length} complete evidence records in dataset ${d.version}.`,
);
