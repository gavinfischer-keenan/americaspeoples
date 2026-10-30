import type { MapRecord, Proposal, DisplayRecord, Culture } from "./model";
import { validateRecord } from "./validation";

/** Published catalog is immutable. Only a proposal revision or preview toggle
 * can change validated preview rows; pan/zoom/year changes reuse the result. */
export class RecordView {
  private ids: Set<string>;
  private baseCultures: Map<string, Culture>;
  private key = "";
  private all: DisplayRecord[] = [];
  private cultureList: Culture[] = [];
  private hiddenKey = "";
  private visible: DisplayRecord[] = [];
  constructor(private base: readonly MapRecord[]) {
    this.ids = new Set(base.map((r) => r.id));
    this.baseCultures = new Map(base.map((r) => [r.culture.id, r.culture]));
  }
  private prepare(
    proposals: readonly Proposal[],
    preview: boolean,
    revision: number,
  ) {
    const key = revision + "|" + preview;
    if (key === this.key) return;
    this.key = key;
    this.hiddenKey = "";
    this.all = [...this.base];
    const cultures = new Map(this.baseCultures);
    if (preview) {
      for (const p of proposals)
        if (!cultures.has(p.record.culture.id))
          cultures.set(p.record.culture.id, p.record.culture);
      proposals.forEach((p, index) => {
        if (p.kind === "new" && this.ids.has(p.record.id)) return;
        if (p.state === "ready" && !validateRecord(p.record).length)
          this.all.push({
            ...p.record,
            culture: cultures.get(p.record.culture.id) ?? p.record.culture,
            proposalKey: String(index),
          });
      });
    }
    this.cultureList = [...cultures.values()];
  }
  get(
    proposals: readonly Proposal[],
    preview: boolean,
    hidden: ReadonlySet<string>,
    revision: number,
  ) {
    this.prepare(proposals, preview, revision);
    const key = this.key + "|" + [...hidden].sort().join(",");
    if (key !== this.hiddenKey) {
      this.hiddenKey = key;
      this.visible = this.all.filter((r) => !hidden.has(r.culture.id));
    }
    return this.visible;
  }
  cultures(proposals: readonly Proposal[], preview: boolean, revision: number) {
    this.prepare(proposals, preview, revision);
    return this.cultureList;
  }
}
