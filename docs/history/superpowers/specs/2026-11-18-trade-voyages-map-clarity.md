# Trade, voyage research and map clarity

The user has made pre-1200 CE trade the main research priority, including BCE evidence and explicit Chaco–California, California coastal and East Coast connections. Carry through the earlier requested voyage research, meaningful place tooltips and smoother ice retreat. Prior instructions authorize judgment and completion without a repeated approval menu.

## Research
Audit existing dated material transfers before adding records. Research major gaps across North America, Mesoamerica/Caribbean/South America, Pacific/Australia and Afro-Eurasia. Connect source regions to dated recipient contexts with explicitly schematic routes; add intermediate nodes only when evidenced. Separate trade, gifts and material movement from founding migration, and preserve contested provenance and context-date precision. Never project post-1200 networks into earlier periods. Voyage research finishes bounded selected major omissions, separate parties and seasonal phases, with remaining questions retained.

## Place tooltips
The supplied Fishing Bridge screenshot shows a density-group branch discarding descriptive catalog content in favor of record counts. Replace that lead with named places and brief material/activity/history descriptions. Show up to three representative places with their own dates, prioritize the selected period, and provide a compact continuation cue for larger groups. Earlier finds remain visibly earlier. Single-place previews also lead with the finding; technical dating/provenance explanations remain in the existing detailed view. Preserve safe text rendering, keyboard access and the one-tooltip dismissal behavior.

## Ice transitions
Current nearest-snapshot selection changes outlines abruptly and clears the layer while uncached outlines load. Interpolate between same-scenario bracketing NADI-1 geometries and prefetch nearby outlines with at most two requests. Retain the last same-scenario frame during loading, identified as retained, and clear it when disabled/outside source coverage. Use a bounded common geographic grid and signed boundary-distance interpolation, which handles polygon splits/holes without pairing unrelated vertices. Extract smooth contours; preserve exact source geometry on source dates. This is a display reconstruction, not a model of glacier dynamics. Label interpolated ice visibly on the map and in source details. MIN/MAX/OPTIMAL stay separate; no extrapolation or implication of ice absence outside coverage.

## Implementation choices
Reuse the current TypeScript/SVG/Python self-hosted app and checkout. Keep research handoffs isolated and centrally integrate. A simple crossfade would retain competing edges, and direct vertex morphing cannot safely handle changing polygon topology; use boundary-distance contours. Do not introduce a new hosting system. The new contour dependency must retain its license notice.
