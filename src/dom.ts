export const esc = (value: unknown): string =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export const $ = <T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T => {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
};
export function downloadJSON(name: string, value: unknown): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
export const input = (
  name: string,
  label: string,
  value: unknown,
  type = "text",
) =>
  `<label>${esc(label)}<input name="${name}" aria-label="${esc(label)}" type="${type}" value="${esc(value)}" ${type === "number" ? 'step="any"' : ""}></label>`;
export const area = (name: string, label: string, value: unknown, rows = 4) =>
  `<label>${esc(label)}<textarea name="${name}" aria-label="${esc(label)}" rows="${rows}">${esc(value)}</textarea></label>`;
