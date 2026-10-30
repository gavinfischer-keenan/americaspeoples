# Hosted architecture

Use [DEPLOYMENT.md](../DEPLOYMENT.md) as the canonical operational runbook. See [developer-guide.md](developer-guide.md) for code/module invariants and [roadmap.md](roadmap.md) for future site deep dives.

The current atlas uses a versioned server database and read-only API. Its browser loads compact catalogs and fetches full reviews and dated ice geometry on demand. Spreadsheet/JSON files are exchange formats. Private visitor drafts are processed locally; server selection/search requests and hosting analytics are disclosed in the privacy notice.
