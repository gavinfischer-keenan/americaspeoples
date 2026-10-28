import { dataset as d } from "../src/published-data";
import { validateDataset } from "../src/validation";
const errors = validateDataset(d);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  `Validated ${d.records.length} complete evidence records in dataset ${d.version}.`,
);
