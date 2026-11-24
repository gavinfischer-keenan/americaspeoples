# Implementation record

Plan: docs/superpowers/plans/2026-10-28-offline-atlas.md

All five implementation tasks completed. 16 unit tests, typecheck, data validation, and both file-URL browser suites passed. Browser tests used the extracted ZIP with network access disabled, in Edge 156.0.4314.42 and Chrome 156.0.8078.73.

Rulings:
- Fresh empty repository cloned into the task workspace; reuse that isolated checkout on feat/offline-atlas rather than create another worktree. No existing user code was overwritten.
- Proceed inline under the explicit implementation brief without another approval gate.
- Initial scholarly scope is eight checked examples. No unsupported migration arrow is seeded. Full coverage requires further editorial research.
- Route geometry is schematic only in v1; importing supported geometry is rejected rather than falsely labeling an invented curve.
- Approximate reference years are visibly approximate without fabricating uncertainty bounds. Playback holds briefly at date boundaries to make short events visible.
- JSON source/claim editors preserve precise mappings in v1; a richer bibliography editor can be added later.
- Keep the source branch local, with no push, merge or deployment.

Independent reviewer found three important issues, each reproduced then fixed: unexportable drafts could save; conflicting new culture colors could disagree with the legend; generated route curves could be marked supported. Regression tests pass. The reviewer did not audit publications or browser runs; source-access limits remain in each record. No deferred critical or important issue remains from that review.
