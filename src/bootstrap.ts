const supported =
  typeof structuredClone === "function" &&
  typeof Object.hasOwn === "function" &&
  typeof String.prototype.replaceAll === "function" &&
  typeof URL.createObjectURL === "function";

function startupMessage(message: string) {
  const app = document.getElementById("app")!;
  const heading = document.createElement("h1");
  heading.textContent = "Americas Peoples";
  const note = document.createElement("p");
  note.setAttribute("role", "alert");
  note.textContent = message;
  app.replaceChildren(heading, note);
}

if (!supported) {
  startupMessage(
    "This browser is missing features required by Americas Peoples. Open it in a current version of Chrome, Edge, Firefox or Safari. Your saved suggestions have not been changed.",
  );
} else {
  import("./main").catch(() =>
    startupMessage(
      "Americas Peoples could not start. Reload the page, or extract the complete download and keep its files together. Your browser's saved suggestions have not been deleted.",
    ),
  );
}
