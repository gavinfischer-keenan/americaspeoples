# Smart timeline implementation plan

Goal: default adaptive playback and a separately selectable logarithmic date slider, preserving every source date and disputed record.

Design: add a pure timeline module for reversible linear/logarithmic position mapping and evidence-density speed. Use a shifted log of age relative to the fixed 1934 endpoint with a 1,000-year offset, which is finite through BCE/CE. Smart pace depends on enabled dated records, nearby boundaries and interval support; long uncertain intervals have capped weight. Existing boundary stops remain, so brief events are never skipped. Sparse evidence is not a claim of human absence or scholarly certainty. Scale and pace remain independent controls. No content integration or deployment during this open batch.

Architecture: src/timeline.ts owns mapping and speed; src/main.ts connects existing controls; CSS provides labeled ticks and responsive controls. Existing exact-year form and local timeline windows continue to work.

- [x] Write and run failing tests for monotonic/inverse mapping, BCE/CE, endpoints, dense/sparse speed, long intervals, unplaced records and boundary preservation.
- [x] Implement pure helpers and connect Smart/log defaults, labeled ticks, manual alternatives and keyboard exact-year navigation.
- [x] Run unit tests and typecheck; browser-check playback, drag, scale switching, windows and mobile layout.
- [x] Review changes; leave tested implementation staged for the next authorized batch deployment.

Verification: 78 unit tests, TypeScript, dedicated timeline browser checks at1440/1100/768/390px, map-panel regression checks and screenshot inspection passed. Deployment held for open round7 intake.
