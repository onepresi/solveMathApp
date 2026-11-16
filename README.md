# solveMath — Math Homework Helper (frontend prototype)

React Native + Expo **SDK 54** app using Expo Router. Photo scanning and solving is powered by OpenAI, and solved scans can be saved on the device. There is no placeholder data; Learn and Quiz show "coming soon" states.

## Setup

```bash
npm install
cp .env.example .env   # then set OPENAI_API_KEY (the OpenAI account needs API credits)
npx expo start         # then press i (iOS), a (Android), or w (web), or scan the QR code with Expo Go
```

Restart `npx expo start` after changing `.env`.

## How scanning works

1. Dashboard: take or upload a photo, then tap **Solve**.
2. The app downscales the photo and POSTs it to its own API route, `/api/solve` ([app/api/solve+api.ts](app/api/solve+api.ts)).
3. That route runs on the server, reads `OPENAI_API_KEY` from the environment, and calls the OpenAI Responses API with a math-tutor prompt and a strict JSON schema ([server/math-solver.ts](server/math-solver.ts)).
4. The Solution screen ([app/solution.tsx](app/solution.tsx)) shows each problem: the question, the answer, the approach, numbered steps, a check of the answer, key concepts, and common mistakes.
5. Tap **Save to Saved** (or the bookmark in the header) to keep the photo and full solution in the **Saved** tab.

## Saved problems

Saved scans live only on the device, nothing is uploaded ([lib/saved-store.ts](lib/saved-store.ts)):

- **iOS / Android:** photos are JPEGs in the app's document folder, listed in `saved-scans/index.json` (`expo-file-system`). The OS does not clear this folder.
- **Web:** IndexedDB in the browser. Clearing site data or using a private window removes them.

The Saved tab supports search (questions, answers, concepts) and topic filters. Tap a scan to see the full solution; delete it from there, by pressing and holding it in the list, or all at once in Settings.

**The API key never ships in the app.** It is only read inside the API route, which Expo keeps out of client bundles. Never rename it with an `EXPO_PUBLIC_` prefix.

Optional `.env` settings: `OPENAI_MODEL` (default `gpt-6-astra`) and `OPENAI_REASONING_EFFORT` (default `medium`).

### Production builds

In development the app reaches `/api/solve` through the Expo dev server automatically. For a standalone iOS/Android build, deploy the server (`npx expo export --platform web`, then deploy with EAS Hosting or a similar host), set `OPENAI_API_KEY` on that host, and point the app at it in `app.json`:

```json
["expo-router", { "origin": "https://your-deployed-server.example" }]
```

## Structure

```
app/
  _layout.tsx            Root stack + navigation theme
  solution.tsx           Solution screen (loading, error, full breakdown, save)
  saved/[id].tsx         A saved scan: photo + full solution, delete
  api/solve+api.ts       Server-only API route → OpenAI
  (tabs)/
    _layout.tsx          Bottom tab bar (5 tabs)
    index.tsx            Dashboard — scan widget, quick actions, saved stats, recently saved, topics
    saved.tsx            Saved — search, topic filters, saved scan list, empty states
    learn.tsx            Learn — coming soon + concepts from saved solutions
    quiz.tsx             Quiz — coming soon
    settings.tsx         Settings — saved data (delete all), preferences, support
components/
  photo-capture-widget.tsx  Dashboard take/upload + preview card
  solution/              Solution breakdown UI
  saved-scan-card.tsx    Saved scan row (Dashboard + Saved)
  empty-state.tsx        Empty / coming-soon card
  ui/                    Screen wrapper, AppText, and primitives (Card, Chip, Tag, ProgressBar, Button…)
constants/theme.ts       Light/dark palettes, topic accent colors, spacing, radii
constants/topics.ts      Topic names, icons, colors
hooks/                   Color scheme, theme, and photo picker hooks
lib/                     Client helpers: image prep, /api/solve client, scan hand-off, saved store + storage, dialogs
server/                  Server-only code (OpenAI prompt + schema). Never import from screens
types/                   Solution types (shared with server) and saved scan types
```

Light and dark mode follow the system setting.
