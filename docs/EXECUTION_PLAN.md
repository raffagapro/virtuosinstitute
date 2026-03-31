# Virtuós Institute — Execution Plan

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Done

## Related Docs
- [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)
- [DATA_MODEL.md](DATA_MODEL.md)
- [CONTRIBUTING_GUIDE.md](CONTRIBUTING_GUIDE.md)

---

## Phase 1 — Foundation

- [~] Write execution plan
- [ ] Install dependencies (clsx, lucide-react, jest, storybook)
- [ ] Port UI primitives from `D:\projects\alchemist`
- [ ] Set up i18n (LocaleProvider, translate(), EN + ES message files)
- [ ] Set up jest + test structure

## Phase 2 — Marketing Site (pixel-faithful recreation of virtuosinstitute.com.mx)

### Layout
- [ ] Navbar (logo, anchor links)
- [ ] Footer (logo, social links, contact info)

### Page Sections (top → bottom)
- [ ] Hero — headline, subtitle, CTA button, decorative images
- [ ] Sobre Nosotros — school description, 8 values grid
- [ ] Beneficios — 8 differentiator cards (image + icon + title + description)
- [ ] Enfoque — 3 numbered pillars (Académica, Artística, Socioemocional)
- [ ] CTA Banner — "¡Fomentamos el aprendizaje significativo!"
- [ ] Oferta Educativa — Kinder & Primaria program cards
- [ ] Testimonios — family testimonial(s)
- [ ] Contact / Lead Form — enrollment form + address + social icons

### Wire-up
- [x] Compose all sections in `app/page.tsx`
- [x] Add modular section registry (`components/marketing/sectionModules.ts`) to support easy add/remove/reorder
- [ ] i18n keys complete (EN + ES, no missing keys)
- [ ] Static export verified (`next build`)

## Phase 3 — Companion App (parent ↔ school communication)
> Details TBD — scope to be defined after marketing site MVP.

---

## Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| UI primitive layer | Build fresh, follow alchemist architecture | Same patterns, clean ownership, no cross-project coupling |
| Styling | Tailwind v4 | Matches existing setup |
| i18n | Custom (LocaleProvider + translate()) | Ported from alchemist, type-safe |
| Asset hosting (dev) | `/public` folder | Simplest for now |
| Asset hosting (prod) | Supabase Storage | Single platform with companion app |
| Deployment | Vercel or AWS | Decide at MVP — both compatible |
| Component naming | `App` prefix for UI primitives | Consistent with alchemist |

---

## Component Architecture

```
components/
  ui/              ← Pure primitives (built fresh, same architecture as alchemist)
                     AppButton, AppCard, AppInput, AppLabel, AppSelect,
                     AppTextarea, AppModal, AppNotice, AppDisclosure,
                     AppTable, AppPageShell, cn.ts
  layout/          ← Shared layout wrappers
                     Navbar, Footer
  marketing/       ← Marketing-site composites (not reused in companion app)
                     HeroSection, ValuesGrid, BenefitCard, EnfoqueSection,
                     ProgramCard, TestimonialCard, LeadForm
lib/
  i18n.ts          ← resolveLocale, translate (ported from alchemist)
  i18n/messages/
    en-US.ts
    es-MX.ts
tests/
  components/      ← Component unit tests
  lib/             ← Utility unit tests
```
