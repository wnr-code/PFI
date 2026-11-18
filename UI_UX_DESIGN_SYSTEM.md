# PFI UI/UX Design System

## Acuan visual
The uploaded PFI concept board is the visual north star: premium Islamic astronomy, night-sky atmosphere, crescent moon and observatory imagery, deep navy surfaces, restrained gold accents, and compact mobile-first cards.

## Brand tokens
- Night navy: `#08162B` (hero/background)
- PFI navy: `#101D36` (app shell)
- Raised navy: `#1B2A47` (cards and controls)
- Gold: `#D6AE62` (primary action, active navigation, key data)
- Warm gold: `#E6C182` (hover/highlight)
- Text: `#F4F6FA`
- Muted text: `#9FB0C4`
- Border: `#2C3E5A`
- Verified: green used only for verified states; pending: muted gold.

## Layout rules
1. Mobile-first. Primary content should fit a 360px-wide viewport without horizontal scrolling.
2. Keep a persistent five-item bottom navigation on mobile: Beranda, Hisab, Astronomi, Komunitas, Profil. Secondary tools (Kalender, Peta, Laporan) live in the home quick actions and secondary navigation.
3. Use a clear page hierarchy: small uppercase gold eyebrow, concise title, one-sentence description, then content.
4. Cards use 12–16px radius, subtle navy gradient, thin blue-grey border, and restrained shadow. Avoid excessive nested cards.
5. Gold is an accent, not a large background everywhere. Use it for primary actions, selected tabs, active icons, and important numerical highlights.
6. Data screens prioritize legibility and trust: show units, timezone, location, method, data timestamp, and verification state where relevant.
7. Use real API data for reports and community. Never render fabricated field observations or fake engagement counts.
8. Use loading, empty, offline, and error states. Empty states explain the next action.
9. Astronomy visuals must be labelled as simulation/illustration unless they are generated from the actual calculation output.
10. Keep touch targets at least 44px high and controls keyboard accessible.

## Screen patterns
- Dashboard: welcome header, lunar phase hero, next astronomy event, quick-action grid, latest verified field activity.
- Hisab: month/location/method controls, one prominent calculate action, result summary, detailed values, source/method notes, export/share.
- Astronomy: large sky/simulation canvas, date/time/location controls, phase and position metrics.
- Community: feed tabs, readable report cards, compose action, verified/pending labels.
- Calendar: monthly grid, selected-day detail, astronomy agenda list, clear note that official Hijri dates follow authorized announcements.
- Observation map: location/report filters, map/list switch, actual report pins only, status legend.
- Report centre: filters, report history, export, report detail and verification trail.
- Profile: identity and organization, role/verification, preferences, notification settings, sign-out.
- Admin/reviewer: moderation queue, report detail, evidence, decision and audit trail; never expose this screen to non-authorized roles.

## Content and trust
- Never label a calculated visibility estimate as an official decision.
- Distinguish hisab, rukyat observations, and government/organizational announcement.
- Show WIB/WITA/WIT or explicit UTC offset alongside observation times.
- Explain that final start-of-month determination follows the competent authority's announcement.
