# Project workflow

- Use this checkout at `/Users/wenchanyuan/Code/japan-autumn-2026` for website work.
- The owner authorizes local edits, preview, commit and direct push to `main`. Do not require a pull request or browser merge for routine changes.
- Start with `git pull --ff-only` when the checkout is clean. Preserve unrelated local edits and remote changes.
- Run `npm run check`, preview the affected UI, then commit only task files and `git push origin main`.
- Verify GitHub Actions deployment and the published result. Use CLI for repository operations; browser work is for UI previews or one-time authentication.
- Keep CNAME, existing itinerary and BOS photo URLs unless requested. Use the current city design language.
- Do not copy authentication secrets into the repository or command output.
