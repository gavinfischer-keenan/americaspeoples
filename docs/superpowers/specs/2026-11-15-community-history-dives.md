# Communities, connections and coercion: three topic histories

The user authorized merging/deploying PR8 and then choosing and building the next three dives. PR8 is deployed as v0.12.0. Use the first three requested queue entries: Haudenosaunee history and lacrosse; Amazonian peoples and languages; Caribbean Indigenous societies, forced African migration and enslavement. This continues the existing approved independent-topic approach without another design approval pause.

## Intent and scope

Teach these histories as inhabited, connected landscapes, with local places and supported events rather than one circle standing in for a people. Each movie needs substantive chapter explanations, source dates, geography and explicit evidence limits. Keep sport/social life, settlement, diplomacy, language, exchange, coercion, resistance and community continuity visible where supported. Avoid a narrative of inevitable disappearance.

Haudenosaunee communities must be distinguished from broader Iroquoian-language societies. Lacrosse's first surviving written observation is not its invention; a Wendat source is not automatically Haudenosaunee evidence. Confederacy founding traditions and archaeological coalescence need separate, qualified chronologies.

Amazonia must show diverse settlement and exchange histories rather than timeless isolation. Use public archaeological places, regional language evidence and documented colonial/rubber-era transformations. Do not equate artifacts, genes, languages and identity, or publish nonpublic locations of living isolated communities.

Caribbean history begins with existing Indigenous communities, then follows documented colonial transformations, forced crossings, labor, resistance, emancipation and continuing coercion. An authorization to transport people is not a completed voyage. Different colonies' abolition, apprenticeship and later freedom dates remain distinct. Do not turn people into undifferentiated trade cargo or assume voluntary movement.

## Architecture and approaches

Chosen implementation approach: reuse the current TopicDive registry, controller, evidence model, shared-history actions and related-topic links. Add a small community-topic registry and separately curated subject/context collections, with existing canonical records reused first. This preserves clocks, playback, geographic rendering and the recently fixed evidence-date limits.

A new standalone UI would duplicate working behavior; a narrative-only essay would fail to put known places and events on the map. Neither is needed for this batch. Tablet/computer remain primary targets, with simple phone fallback only.

Subject-only sport, interpretation and reconstruction evidence stays focused. Independently supported settlements, encounters, relocation and violence belong on the shared atlas and link reciprocally to topic evidence. A source date must not manufacture a town's lifespan. Existing records reused in scenes retain shared eligibility. Remove the three completed subjects from the planned queue; preserve incoming links, including old planned-topic URLs, and explain cross-topic relationships.

## Constraints and delivery

All three and the master atlas retain the 1934 endpoint. Only the already queued Hawaiʻi and conditional territorial-purchase exceptions may eventually extend it; they are not part of this batch. Use original atlas prose with underlying scholarly, community and institutional references. Keep raw Consensus output private. Consensus calls remain Deep only and below the cumulative100 cap; this batch starts at34. No new dependency or boundary dataset is needed.

Deliver a tested v0.13.0 candidate in a new PR. Approval to deploy PR8 does not pre-authorize merging/deploying this next PR. Retain the current live release plus exactly one previous atlas release. Keep unrelated hosted pages and applications intact.
