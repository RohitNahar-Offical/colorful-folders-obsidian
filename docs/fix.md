The analysis is complete and the comprehensive implementation plan has been delivered above. Here is a summary of the key findings and the plan structure:

---

### Two Root Causes Identified

**Issue 1 — Generic file icons instead of contextually relevant ones:**
The auto-icon pipeline (`IconRepository._computeAutoIconData`) classifies items using **name-only matching** through 5 tiers. It has no content awareness for non-markdown files, no file extension semantics, and the `STOP_WORDS`/`GENERIC_SUFFIX_WORDS` filters only apply to Tier 4 (fuzzy matching), not Tier 3 (category regex matching). This means broad regexes like `/source|origin|root|base|data|lib|bib/i` and `/document|doc|word|report|text/i` catch many items that should get more specific icons.

**Issue 2 — Date-like names (e.g., "2030") get folder icons:**
There is zero numeric/date pattern detection in `AUTO_ICON_CATEGORIES`. The `CategoryTrie` indexes by first character of regex sources (almost always letters), so "2030" starting with "2" falls through to the full lookup array where no regex matches. When `getAutoIconData()` returns `null`, `StyleGenerator` renders the default `lucide-folder` icon at line 902-946.

### Plan Structure (6 Phases)

| Phase | Focus | Key Changes |
|-------|-------|------------|
| **1** | Date/Numeric Detection | Add date/year/percent regex categories to `AUTO_ICON_CATEGORIES`; add numeric indexing to `CategoryTrie`; add a dedicated date tier in `IconRepository` |
| **2** | Extension Awareness | Add extension-to-icon mapping; integrate as Tier 0.7 in `_computeAutoIconData()` |
| **3** | Semantic Disambiguation | Expand `STOP_WORDS`/`GENERIC_SUFFIX_WORDS`; add generic-term penalty in Tier 3; improve `CategoryTrie` scoring; add parent folder context |
| **4** | AI Classifier Improvements | Extend to non-markdown files; improve system prompt; add post-processing validation for generic/non-existent icons |
| **5** | Content-Aware Classification | Add keyword extraction utility; add content-based classification tier (Tier 3.5) that matches file content keywords against categories |
| **6** | Testing & Validation | Unit tests for date/numeric matching, extension mapping, AI post-processing; regression tests for existing behavior |

The full plan with detailed steps, file-level modifications, risk assessment, and success criteria is in the response above.