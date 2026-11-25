/**
 * The suggestions workspace pages: #proposals (list, share, import a file) and
 * #import (review an incoming file before merging it). State lives in
 * suggestions-store.ts; these functions only render and bind the pages.
 */
import { $, downloadJSON } from "../dom";
import type { Proposal } from "../model";
import { MAX_PACKAGE_BYTES, inspectImport, makePackage, mergeImport, parsePackage } from "../proposals";
import { MAX_WORKBOOK_BYTES } from "../bulk-schema";
import { comparisonHTML } from "../review";
import { completeDataset } from "../client-data";
import { importWorkbook } from "../xlsx-import";
import { esc } from "../dom";
import { suggestions } from "../suggestions-store";

export interface SuggestionPageContext {
  /** The page container the router renders into. */
  main: HTMLElement;
  /** Show a short status message to the visitor. */
  announce(message: string): void;
  /** Persist suggestions and refresh the header count. */
  save(): void;
}

export function suggestionPages({ main, announce, save: saveLocal }: SuggestionPageContext) {
  function exportProposals(list: Proposal[]) {
    try {
      if (!list.length) {
        announce("Select at least one suggestion to share.");
        return;
      }
      const pack = makePackage(list);
      parsePackage(JSON.stringify(pack));
      downloadJSON("americas-peoples-suggestions.json", pack);
      announce(
        "File downloaded. Send it using your preferred email or file-sharing service.",
      );
    } catch (error) {
      announce((error as Error).message);
    }
  }
  function bindDeferredComparisons(container: Element, items: readonly Proposal[]) {
    container.addEventListener('toggle', event => {
      const details = event.target;
      if (!(details instanceof HTMLDetailsElement) || !details.open || !details.hasAttribute('data-comparison-pending')) return;
      const index = Number(details.closest<HTMLElement>('[data-proposal-index]')!.dataset.proposalIndex);
      const template = document.createElement('template');
      template.innerHTML = comparisonHTML(items[index]);
      // Keep the user's summary and focus; add the same body as an individual review.
      details.append(...Array.from(template.content.firstElementChild!.childNodes).slice(1));
      details.removeAttribute('data-comparison-pending');
    }, true);
  }
  function proposalsPage() {
    main.innerHTML = `<article class="proposals-page"><div class="page-heading"><div><div class="eyebrow">A LOCAL RESEARCH WORKSPACE</div><h2>Your suggestions</h2><p class="lead">Add evidence. Propose a correction. Share the supporting research.</p></div><a class="button primary" href="#new">+ Suggest new evidence</a></div><p id="storage-status" class="notice">${suggestions.storageAvailable ? "Browser storage is available as a convenience. Download your suggestions for a portable backup." : "Browser storage is unavailable. Download your suggestions before closing this page."}${suggestions.unreadableCollectionKept ? " An earlier saved collection could not be read by this version; it has been kept unchanged in browser storage and was not overwritten." : ""}</p><div class="actions"><button id="export-selected">Send to others</button><button id="select-all">Select all</button><label class="button file-button">Import suggestions<input type="file" id="import-file" aria-label="Import suggestions" accept=".json,.xlsx,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></label></div><p class="muted">Sharing downloads a file; nothing is uploaded or emailed. Imported suggestions remain unreviewed. Complete suggestions can be previewed on the map.</p><div class="actions"><a href="docs/bulk-import-guide.html">Bulk import guide</a><a href="templates/americas-peoples-import.xlsx" download>Download spreadsheet template</a></div><p class="muted">Bulk entry: use the XLSX template for records, claims, references and source mappings. Excel, LibreOffice, or a downloaded Google Sheets workbook can be used.</p><div id="import-error" role="alert"></div><div class="proposal-list">${suggestions.proposals.length ? suggestions.proposals.map((p, i) => `<section class="proposal-card" data-proposal-card data-proposal-index="${i}"><label class="check"><input type="checkbox" data-share="${i}" aria-label="Select proposal ${i + 1}"><span class="tag proposal-tag">${esc(p.state)} · ${esc(p.kind)} · v${p.version}</span></label><h3>${esc(p.record.title || "Untitled draft")}</h3><p>${esc(p.rationale || "No rationale yet.")}</p><div class="actions"><a href="#proposal/${i}">Detailed review</a><a href="#edit/${i}">Edit suggestion</a></div>${comparisonHTML(p, true)}</section>`).join("") : '<div class="empty large"><h3>A place for the next finding.</h3><p>Start a new evidence row or open a reviewed record and choose Suggest correction.</p></div>'}</div></article>`;
    bindDeferredComparisons(main.querySelector('.proposals-page')!, suggestions.proposals);
    $("#export-selected").addEventListener("click", () =>
      exportProposals(
        [...main.querySelectorAll<HTMLInputElement>("[data-share]:checked")].map(
          (el) => suggestions.proposals[Number(el.dataset.share)],
        ),
      ),
    );
    $("#select-all").addEventListener("click", () =>
      main
        .querySelectorAll<HTMLInputElement>("[data-share]")
        .forEach((el) => (el.checked = true)),
    );
    $<HTMLInputElement>("#import-file").addEventListener("change", async (e) => {
      const control = e.target as HTMLInputElement;
      const file = control.files?.[0];
      if (!file) return;
      control.disabled = true;
      $("#import-error").textContent = "Reading and validating the file…";
      try {
        const full = await completeDataset();
        if (file.name.toLowerCase().endsWith(".xlsx")) {
          if (file.size > MAX_WORKBOOK_BYTES)
            throw new Error(`Workbook exceeds the ${MAX_WORKBOOK_BYTES / 1_000_000} MB file limit.`);
          suggestions.pending = await importWorkbook(await file.arrayBuffer(), full.records);
        } else if (file.name.toLowerCase().endsWith(".json")) {
          if (file.size > MAX_PACKAGE_BYTES)
            throw new Error(`Package exceeds the ${MAX_PACKAGE_BYTES / 1_000_000} MB limit.`);
          suggestions.pending = parsePackage(await file.text());
        } else
          throw new Error(
            "Choose a .xlsx template workbook or a native .json proposal file.",
          );
        location.hash = "#import";
      } catch (error) {
        $("#import-error").textContent = (error as Error).message;
      } finally {
        control.disabled = false;
        control.value = "";
      }
    });
  }
  async function importPage() {
    if (!suggestions.pending) {
      location.hash = "#proposals";
      return;
    }
    const requested = suggestions.pending;
    const full = await completeDataset();
    if (location.hash !== "#import" || suggestions.pending !== requested) return;
    const report = inspectImport(suggestions.pending.proposals, suggestions.proposals, full.records);
    main.innerHTML = `<article class="proposals-page"><a href="#proposals" class="back-link">← Your suggestions</a><h2>Review import</h2><p class="lead">${report.length} suggestions. Nothing has been added yet.</p><p>Duplicate copies are skipped. Conflicting copies are retained separately for your review. No bundled evidence will change.</p>${report.map((item, index) => `<section class="proposal-card" data-proposal-index="${index}"><span class="tag">${item.status}</span><h3>${esc(item.proposal.record.title || "Untitled draft")}</h3><p>${esc(item.reason)}</p><p>${esc(item.proposal.rationale)}</p>${comparisonHTML(item.proposal, true)}<details data-incoming-index="${index}"><summary>Full incoming record and sources</summary><pre></pre></details></section>`).join("")}<div class="actions"><button id="confirm-import" class="primary">Add to local collection</button><a href="#proposals">Cancel</a></div></article>`;
    bindDeferredComparisons(main.querySelector('.proposals-page')!, report.map(item => item.proposal));
    // Keep the full batch reviewable without eagerly creating every source JSON block.
    // Capture toggle on this page only: the report and handler leave with its DOM.
    main.querySelector('.proposals-page')!.addEventListener('toggle', event => {
      const details = event.target;
      if (!(details instanceof HTMLDetailsElement) || !details.open || details.dataset.incomingIndex === undefined || details.dataset.loaded) return;
      const item = report[Number(details.dataset.incomingIndex)];
      details.querySelector('pre')!.textContent = JSON.stringify(item.proposal.record, null, 2);
      details.dataset.loaded = 'true';
    }, true);
    $("#confirm-import").addEventListener("click", () => {
      try {
        const next = mergeImport(suggestions.pending!.proposals, suggestions.proposals);
        suggestions.proposals = next;
        suggestions.pending = null;
        saveLocal();
        location.hash = "#proposals";
      } catch (error) {
        let message = main.querySelector<HTMLElement>("#import-confirm-error");
        if (!message) {
          message = document.createElement("p");
          message.id = "import-confirm-error";
          message.setAttribute("role", "alert");
          main.append(message);
        }
        message.textContent = (error as Error).message;
      }
    });
  }
  return { proposalsPage, importPage, exportProposals };
}
