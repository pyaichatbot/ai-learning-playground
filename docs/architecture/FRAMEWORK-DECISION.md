# Framework Decision: Vite vs Next.js

## Document Control
| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.0 | 2026-01 | Engineering Team | Final Decision |

---

## Decision: **Vite + React (SPA)**

**Status**: ✅ **FINAL - Proceeding with Vite**

---

## Executive Summary

After analysis of project requirements, team capabilities, and long-term goals, we have decided to **proceed with Vite + React (SPA)** instead of Next.js.

**Current State**: Project is already configured with Vite and working.

---

## Comparison Analysis

### Vite + React (SPA) ✅ **SELECTED**

**Advantages**:
- ✅ **Faster Development**: Instant HMR, faster builds
- ✅ **Simpler Architecture**: Client-side only, no server complexity
- ✅ **Better for Learning Platform**: All processing in browser (embeddings via Transformers.js)
- ✅ **Smaller Bundle**: More efficient for educational demos
- ✅ **Easier Onboarding**: Less concepts to learn (no App Router, server components)
- ✅ **Already Configured**: Project is set up and working with Vite
- ✅ **Cost Effective**: No backend infrastructure needed initially

**Disadvantages**:
- ❌ No SSR (not needed for learning platform)
- ❌ No API routes (can add later if needed)
- ❌ SEO limitations (not critical for learning tool)

**Best For**:
- Interactive learning platforms
- Client-side heavy applications
- Rapid prototyping
- Educational tools

---

### Next.js (Alternative)

**Advantages**:
- ✅ Server-side rendering
- ✅ API routes built-in
- ✅ Better SEO
- ✅ Edge functions

**Disadvantages**:
- ❌ More complex setup
- ❌ Requires understanding of App Router
- ❌ Server components add complexity
- ❌ Overkill for client-side learning platform
- ❌ Would require migration from current Vite setup

**Best For**:
- Content-heavy websites
- E-commerce
- Marketing sites
- Applications requiring SSR

---

## Decision Factors

### 1. Project Requirements ✅
- **Learning Platform**: Client-side interactivity is primary need
- **Visualizations**: Heavy client-side rendering (D3.js, Three.js)
- **No Backend Initially**: All processing in browser
- **Educational Focus**: Simplicity > complexity

**Verdict**: Vite aligns perfectly ✅

### 2. Current State ✅
- Project already configured with Vite
- All components working
- Build system functional
- Development workflow established

**Verdict**: Migration would be unnecessary effort ❌

### 3. Team & Timeline ✅
- Faster development with Vite
- Less learning curve
- Quicker iteration
- 12-week timeline benefits from simplicity

**Verdict**: Vite supports faster delivery ✅

### 4. Future Considerations
- Can add backend later if needed
- Can migrate to Next.js if requirements change
- Current architecture allows flexibility

**Verdict**: Vite doesn't lock us in ✅

---

## Migration Path (If Needed Later)

If we need Next.js features in the future:

1. **Phase 1**: Keep Vite, add API routes via separate backend
2. **Phase 2**: Migrate to Next.js if SSR/SEO becomes critical
3. **Phase 3**: Hybrid approach (Next.js for marketing, Vite for app)

**Current Recommendation**: Stay with Vite ✅

---

## Architecture Alignment

Our vision document (`docs/vision/VISION.md`) mentions Next.js, but the **architectural principles remain valid**:

- ✅ Three-module structure (RAG Studio, Agent Lab, Multi-Agent Arena)
- ✅ Component organization
- ✅ State management patterns
- ✅ Visualization approach
- ✅ Progressive learning path

**Only difference**: Implementation uses Vite instead of Next.js App Router.

---

## Implementation Notes

### Current Vite Setup
```typescript
// vite.config.ts - Already configured
- React 18.3
- TypeScript 5.5
- Path aliases (@/components, @/lib, etc.)
- Code splitting
- Test configuration (Vitest)
```

### What We Keep
- ✅ All architectural patterns
- ✅ Component structure
- ✅ State management (Zustand)
- ✅ Visualization libraries
- ✅ Development workflow

### What We Don't Need
- ❌ Server components
- ❌ API routes (initially)
- ❌ SSR
- ❌ Edge functions

---

## Recommendation

**✅ PROCEED WITH VITE**

**Rationale**:
1. Project is already working with Vite
2. Requirements align with SPA architecture
3. Faster development and iteration
4. Simpler for learning platform use case
5. Can add backend/Next.js later if needed

**Action Items**:
- [x] Document decision (this file)
- [x] Update architecture docs to reflect Vite
- [x] Note in STARTER-KIT.md about framework difference
- [ ] Update vision doc references (optional)

---

## References

- [Vite Documentation](https://vitejs.dev/)
- [Next.js Documentation](https://nextjs.org/)
- [SYSTEM-ARCHITECTURE.md](./SYSTEM-ARCHITECTURE.md) - Current architecture
- [VISION.md](../vision/VISION.md) - Original vision (mentions Next.js)

---

**Decision Date**: 2026-01  
**Decision Maker**: Engineering Team  
**Review Date**: End of Phase 1 (if requirements change)  
**Status**: ✅ FINAL

