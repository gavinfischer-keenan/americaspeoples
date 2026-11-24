# TripoFisch deployment handoff

The user explicitly assigned hosting, DNS, routing, landing-page integration and public deployment to the website deployment agent. This task prepares the application repository and pushes a verified handoff. No server or website configuration will be changed.

Design: preserve the fully static browser application and hash routing. Ship the same build for HTTPS hosting and the downloadable offline ZIP. Export a complete appendix in JSON and readable HTML with eight bundled records clearly separated from 51 optional research proposals. Keep proposal storage and review status unchanged. No new PWA, backend or authentication is needed.

- [x] Validate and generate the appendix from the same source records and research package; retain full claims, references and status labels.
- [x] Produce a clean allowlisted dist build, release manifest and SHA-256 checksums; document branding placeholders and deployment requirements.
- [x] Verify a local HTTP root deployment with production-like headers, hash deep links, real workbook import, download/export, refresh persistence and no unexpected network requests.
- [x] Recheck offline operation and unsupported-feature messaging, document actual results and prepare the repository handoff. The final delivery records the pushed SHA and handoff, without claiming public deployment.

Review focus: appendix must not promote optional proposals to reviewed evidence; origin changes cannot silently promise storage migration; a web visit is not an offline installation; hosting headers must permit required inline styles without permitting inline scripts; only deployable static files belong in dist.
