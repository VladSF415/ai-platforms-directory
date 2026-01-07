# Healthcare AI Content Review Checklist

⚠️ **CRITICAL**: All AI-generated content MUST be reviewed before publishing!

## Generated Content
- Alternatives Pages: 7
- Comparison Pages: 3
- Blog Posts: 3
- Total Files: 13

## Review Checklist

### 1. Platform Verification
- [ ] All platform names exist in platforms.json database
- [ ] All URLs are correct and working (test each link)
- [ ] No fabricated or invented platforms included

### 2. Medical Claims Review
- [ ] Remove any fabricated FDA approvals
- [ ] Remove invented clinical trial results
- [ ] Remove made-up statistics or percentages
- [ ] Verify any medical efficacy claims

### 3. References & Citations
- [ ] Remove citations to non-existent peer-reviewed studies
- [ ] Remove references to invented medical journals
- [ ] Replace specific false claims with general statements
- [ ] Add disclaimer if clinical validation status unknown

### 4. Content Quality
- [ ] Replace generic placeholders with real information
- [ ] Ensure all features mentioned are accurate
- [ ] Verify pricing information if mentioned
- [ ] Check that specialty focus is correct

### 5. Legal & Compliance
- [ ] No false medical claims (FDA violations)
- [ ] HIPAA compliance mentioned accurately
- [ ] No unsubstantiated health claims
- [ ] Professional medical disclaimers where needed

### 6. Brand Safety
- [ ] No negative false information about competitors
- [ ] Comparisons are fair and balanced
- [ ] No trademark issues
- [ ] Attribution and sources are legitimate

## High-Risk Terms to Verify

If content includes these terms, verify they are accurate:
- "FDA approved" / "FDA cleared"
- "Clinical trial" / "Clinical study"
- "Peer-reviewed" / "Published in [journal]"
- Specific percentages (e.g., "30% improvement")
- "Proven to" / "Guaranteed"
- Specific dollar amounts for pricing

## Recommended Actions

1. **Review all generated JSON files** in:
   - alternatives-content/
   - comparison-content/
   - blog-posts/

2. **Remove or edit** any:
   - Fabricated platforms
   - Invented clinical data
   - False FDA claims
   - Made-up statistics

3. **Add disclaimers** where appropriate:
   - "Clinical validation status may vary"
   - "Consult official FDA database for approval status"
   - "Features and capabilities subject to change"

4. **Fact-check** using:
   - Official platform websites
   - FDA device database
   - PubMed for actual studies
   - Platform documentation

---

**Generated:** 2026-01-03T20:41:47.281Z
**Content Generator:** generate-healthcare-content.mjs
