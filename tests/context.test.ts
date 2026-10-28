import { test } from "node:test";
import assert from "node:assert/strict";
import { contextHTML } from "../src/context";
import { fixture } from "./fixtures";
test("context distinguishes comparisons from mapped evidence and escapes source text", () => {
  const r = fixture();
  r.id = "context-test";
  r.title = "Comparative context — <test>";
  r.overlay = {
    kind: "environment",
    basis: "unmapped",
    geometry: null,
    precision: "Unmapped comparison",
    provenance: "Synthetic",
  };
  const html = contextHTML([r]);
  assert.ok(html.includes("Comparative context"));
  assert.ok(html.includes("&lt;test&gt;"));
  assert.ok(html.includes("not proof"));
  assert.ok(html.includes("docs/intake/index.html"));
});
