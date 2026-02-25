# Biscuit

A real-time chat application built with [SpacetimeDB](https://spacetimedb.com), React, TypeScript, and Tailwind CSS.

## Features

- **Channels** — create, switch, and delete chat rooms
- **Threaded replies** — start threads on any message, with reply counts and a slide-out thread panel
- **Real-time messaging** — all messages sync instantly across clients via SpacetimeDB subscriptions
- **Typing indicators** — see who's typing in channels and threads
- **Message editing & deletion** — edit or remove your own messages inline
- **User presence** — online/offline status with colored avatar badges
- **Profile editing** — set your display name

## Tech Stack

| Layer | Tech |
|-------|------|
| Database & sync | [SpacetimeDB](https://spacetimedb.com) (TypeScript module) |
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS v4 |
| Icons | [@tabler/icons-react](https://tabler.io/icons) |

## Project Structure

```
biscuit/
├── spacetimedb/          # SpacetimeDB server module
│   └── src/index.ts      # Tables, reducers, lifecycle hooks
├── src/
│   ├── components/       # React UI components
│   ├── hooks/            # useDiscord hook (state + subscriptions)
│   ├── module_bindings/  # Generated SpacetimeDB client bindings
│   ├── main.tsx          # App entry, SpacetimeDB provider
│   └── index.css         # Tailwind config + Biscuit theme
└── .env.local            # SpacetimeDB connection config
```

## Getting Started

### Prerequisites

- Node.js 20+
- [SpacetimeDB CLI](https://spacetimedb.com/install) (`spacetime`)

### Install dependencies

```bash
npm install
cd spacetimedb && npm install && cd ..
```

### Publish the module

```bash
spacetime publish biscuitdb --module-path spacetimedb
```

To reset all data:

```bash
spacetime publish biscuitdb --clear-database -y --module-path spacetimedb
```

### Generate client bindings

```bash
spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb
```

### Run the dev server

```bash
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

### Environment

Connection settings live in `.env.local`:

```
VITE_SPACETIMEDB_HOST=https://maincloud.spacetimedb.com
VITE_SPACETIMEDB_DB_NAME=biscuitdb
```

Set `VITE_SPACETIMEDB_HOST=ws://localhost:3000` for local development with `spacetime start`.
