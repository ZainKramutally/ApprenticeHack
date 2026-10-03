# Off the Clock

**Meet other apprentices. Close your KSB gaps.**

A clickable front-end demo of a Luma-style events app just for UK apprentices. Tell it your apprenticeship standard and which KSBs are already signed off, and it recommends events that fill your gaps. After you attend, it writes up the OTJ log entries, KSB evidence, a progress summary, a PDF and a CSV, ready for OneFile or Aptem.

There is no backend. Everything is seeded from `src/data/` and saved in `localStorage` (key `otc:v1`).

## Run it

Requires Node 18+.

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173. Map tiles come from OpenStreetMap and need internet. Offline, the pins still show on a plain background.

Other scripts: `npm run build` (typecheck + production build), `npm run preview` (serve the build), `npm run typecheck`.

## Demo script (acceptance test)

1. Welcome → **Continue as Sam**.
2. **Profile**: 5 of 15 KSBs signed off, 410 / 1,022 OTJ hours, coach focus K11 and S8.
3. **Discover**: London map with pins in five colours. Recommended strip is led by **Cloud Security Lab** ("Covers 2 of your gaps: K11, S8", Coach focus tag).
4. Open **Cloud Security Lab**: green OTJ badge, K11 and S8 marked Coach focus, K5 Signed off. **RSVP** and **heart** it.
5. Back to Discover, tap **Hangouts**, open **Bowling Night**: grey "Social only" badge.
6. **Profile → To confirm → Threat Modelling 101 → Mark "I went"**, type notes, save. OTJ hours become 413; K3, K11 and S8 turn amber.
7. **Discover**: recommendations have re-ranked and the hackathon now leads.
8. **Generate report**: OTJ entry, KSB write-ups for K3, K11 and S8, progress summary. **Copy** a section, then **Download PDF** and **Download CSV**.
9. Switch persona to **Jordan**, **Create** a workshop tagged with DTSP KSBs and publish. Switch back to Sam: it's on the map and, if it hits his gaps, in his recommendations.
10. Switch to **Aisha** (Manchester, Project manager) and **Priya** (London, Finance) to show it works across standards.

Reset at any time from **Profile → Reset demo data**.

## More

- [GUIDE.md](GUIDE.md): presenter run-sheet, how the code fits together, and how to extend it.
- [CLAUDE.md](CLAUDE.md): the full build spec (product, domain rules, data model, seed data).
