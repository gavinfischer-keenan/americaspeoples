import { test } from "node:test";
import assert from "node:assert/strict";
import { tablesToPackage } from "../src/bulk-import";
import { BULK_HEADERS, type BulkTables } from "../src/bulk-schema";
import { inspectImport, mergeImport } from "../src/proposals";
import { formatReference } from "../src/citations";
import { fixture } from "./fixtures";
export function tables(): BulkTables {
  const blank = (name: keyof typeof BULK_HEADERS) =>
    Object.fromEntries(BULK_HEADERS[name].map((x) => [x, ""]));
  return {
    Evidence: [
      {
        ...blank("Evidence"),
        record_id: "synthetic-bulk",
        operation: "new",
        record_type: "occurrence",
        title: "Synthetic evidence, testing only",
        time_model: "occurrence",
        start_year: 2000,
        start_era: "BCE",
        end_year: 1990,
        end_era: "BCE",
        culture_id: "unknown",
        culture_name: "Unknown attribution",
        culture_kind: "unknown",
        culture_color: "#9babb5",
        original_dates: "Synthetic 2000–1990 BCE",
        dating_method: "Test fixture",
        date_interpretation:
          "A possible occurrence, not continuous settlement.",
        rationale: "Synthetic testing",
        proposal_state: "ready",
        source_check_date: "2026-10-28",
        review_provenance: "Test only",
        summary:
          "This synthetic explanation is intentionally long enough to pass validation.\n\nSecond paragraph.",
        limitations: "No real-world evidence is claimed.",
        discussion: "Testing only.",
      },
    ],
    Claims: [
      {
        record_id: "synthetic-bulk",
        claim_id: "presence",
        claim: "Synthetic claim",
        scholarly_status: "under discussion",
        status_explanation: "Test scenario",
      },
    ],
    References: [
      {
        ...blank("References"),
        reference_id: "test-ref",
        reference_type: "journal-article",
        authors: "Author, A.; Author, B.",
        year: 2020,
        title: "Synthetic source",
        venue: "Test journal",
        doi: "10.1234/test",
        volume: "12",
        issue: "3",
        pages: "10–20",
        access_notes: "Synthetic, not scholarly evidence.",
      },
    ],
    ClaimSources: [
      {
        record_id: "synthetic-bulk",
        claim_id: "presence",
        reference_id: "test-ref",
        stance: "supports",
        locator: "Page 12",
        support_note: "Synthetic test support",
      },
    ],
  };
}
test("bulk rows preserve narrative, calendar eras and structured citations", () => {
  const p = tablesToPackage(tables(), []).proposals[0];
  assert.equal(p.record.time.start, -1999);
  assert.equal(p.record.time.end, -1989);
  assert.match(p.record.review.summary, /\n\nSecond/);
  assert.equal(p.record.sources[0].url, "https://doi.org/10.1234/test");
  assert.equal(p.record.sources[0].volume, "12");
  assert.equal(p.state, "ready");
  assert.equal(p.record.claims[0].support[0].locator, "Page 12");
});
test("reimporting unchanged bulk data is idempotent across timestamps; changed evidence is preserved as conflict", () => {
  const a = tablesToPackage(tables(), [], "2026-10-28T12:00:00Z").proposals;
  const b = tablesToPackage(tables(), [], "2026-10-29T12:00:00Z").proposals;
  assert.equal(inspectImport(b, a, [])[0].status, "duplicate");
  assert.equal(mergeImport(b, a).length, 1);
  const t = tables();
  t.Evidence[0].summary =
    "A changed scientific explanation with sufficient text for this test.";
  const c = tablesToPackage(t, []).proposals;
  assert.equal(inspectImport(c, a, [])[0].status, "conflict");
  assert.equal(mergeImport(c, a).length, 2);
});
test("broken workbook relationships fail with the offending sheet and row", () => {
  const t = tables();
  t.ClaimSources[0].reference_id = "missing";
  assert.throws(() => tablesToPackage(t, []), /ClaimSources row 2.*missing/);
  const d = tables();
  d.Evidence.push({ ...d.Evidence[0] });
  assert.throws(() => tablesToPackage(d, []), /Evidence row 3.*[Dd]uplicate/);
  const o = tables();
  o.Claims[0].record_id = "orphan";
  assert.throws(() => tablesToPackage(o, []), /Claims row 2/);
});
test("corrections require a matching base and preserve the actual original", () => {
  const t = tables(),
    r = fixture();
  t.Evidence[0].operation = "correction";
  t.Evidence[0].base_revision = 1;
  r.id = "synthetic-bulk";
  assert.deepEqual(tablesToPackage(t, [r]).proposals[0].baseRecord, r);
  assert.throws(
    () => tablesToPackage(t, [{ ...r, revision: 2 }]),
    /base_revision/,
  );
  assert.throws(() => tablesToPackage(t, []), /not found/);
});
test("eras, blank dates, unplaced rows and false booleans are not silently coerced", () => {
  const t = tables();
  t.Evidence[0].start_year = 0;
  assert.throws(() => tablesToPackage(t, []), /positive/);
  t.Evidence[0].start_year = 2000;
  t.Evidence[0].start_era = "BP";
  assert.throws(() => tablesToPackage(t, []), /BCE or CE/);
  const u = tables();
  u.Evidence[0].time_model = "unplaced";
  assert.throws(() => tablesToPackage(u, []), /blank/);
  for (const key of ["start_year", "start_era", "end_year", "end_era"])
    u.Evidence[0][key] = "";
  assert.equal(tablesToPackage(u, []).proposals[0].record.time.start, null);
  const f = tables();
  f.Evidence[0].approximate = "FALSE";
  assert.equal(
    tablesToPackage(f, []).proposals[0].record.time.approximate,
    false,
  );
});
test("bibliography formatting preserves type-specific metadata and does not invent dates", () => {
  const p = tablesToPackage(tables(), []).proposals[0];
  const s = p.record.sources[0];
  const text = formatReference(s);
  assert.match(text, /12\(3\)/);
  assert.match(text, /10–20/);
  assert.match(text, /10.1234\/test/);
  const archive = formatReference({
    ...s,
    referenceType: "archival-document",
    year: null,
    archive: "Public archive",
    collection: "Collection A",
    identifier: "MS 17",
    doi: "",
  });
  assert.match(archive, /n\.d\./);
  assert.match(archive, /Public archive/);
  assert.match(archive, /MS 17/);
  assert.ok(!archive.includes("null"));
});
test("ready references enforce type-specific metadata while drafts keep incomplete research", () => {
  const t = tables();
  t.References[0].reference_type = "book-chapter";
  assert.throws(() => tablesToPackage(t, []), /publisher|editors|pages/);
  t.Evidence[0].proposal_state = "draft";
  assert.equal(tablesToPackage(t, []).proposals[0].state, "draft");
});
test("books avoid duplicated publishers and dataset versions are not called editions", () => {
  const s = tablesToPackage(tables(), []).proposals[0].record.sources[0];
  const book = formatReference({
    ...s,
    referenceType: "book",
    venue: "Example Press",
    publisher: "Example Press",
    edition: "2nd",
    volume: "",
    issue: "",
    pages: "",
  });
  assert.equal(book.split("Example Press").length - 1, 1);
  const dataset = formatReference({
    ...s,
    referenceType: "dataset",
    edition: "Version 1",
  });
  assert.ok(!dataset.includes("Version 1 edition"));
});
