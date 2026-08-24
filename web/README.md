# Workout Tracker Web App

This is a web application designed to help you track your workouts, create custom routines, and monitor your gym progress over time.

## Features

- **Workout Tracking:** Log your daily workouts and exercises.
- **Routine Creation:** Build and manage custom workout routines.
- **Progress Monitoring:** Visualize your progress with stats and history.
- **User Authentication:** Secure login to keep your data private.
- **Responsive UI:** Works seamlessly on desktop and mobile devices.
- **AI Coach:** An in-app assistant ("REPLO AI") in a global chat drawer that streams answers about your training and renders them as markdown.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd web_app
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Running the App

Start the development server:

```bash
npm run start
# or
yarn start
```

The app will be available at [http://localhost:5173](http://localhost:5173) (default Vite port).

## Project Structure

- `src/` — Main source code
  - `components/` — Reusable UI components
  - `views/` — App views/pages
  - `utility/` — Utility functions and helpers
  - `assets/` — Static assets and dummy data

## Technologies Used

- React + TypeScript
- Vite
- Tailwind CSS
- Zustand (client state, incl. the AI coach store)
- react-markdown + remark-gfm (assistant message rendering)

## AI Coach (REPLO AI)

A global chat assistant available on every authenticated page via a floating launcher
(bottom-right). It streams replies token by token and renders them as markdown.

- **Launcher + drawer:** `components/ui/CoachFab.tsx` (a floating button with an animated
  accent sweep) opens `components/ui/CoachDrawer.tsx`, a slide-in panel that mirrors the mobile
  nav sheet (portal, backdrop, Escape to close, scroll-lock).
- **State:** `stores/coach-store.tsx` (Zustand) holds the conversation and streaming status
  globally, so the chat survives navigation between pages.
- **Streaming client:** `api/assistant.ts` calls `POST /api/assistant/chat` with a raw `fetch`
  (not the axios client — axios can't read a response stream), attaches the bearer token
  manually, and parses the Server-Sent Events (`token` / `done` / `error`).
- **Rendering:** `components/ui/CoachMarkdown.tsx` renders assistant messages with
  `react-markdown` + `remark-gfm`, styling elements through a `components` map (links open in a
  new tab; wide tables scroll within the drawer).

The backend streaming endpoint and its tools are documented in
[`../api/README.md`](../api/README.md#assistant-module-ai-coach).

## License

This project is licensed under the MIT License.
