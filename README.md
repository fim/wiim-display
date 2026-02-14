# WiiM Display

A "Now Playing" web interface for WiiM speakers. Shows album art, track info, progress, and transport controls. Discovers devices on your network via UPnP/SSDP — no configuration required.

![WiiM Now Playing](screenshot.png)

## Features

- Full-screen album art with blurred background
- Track title, artist, and progress bar
- Play/pause, next, and previous controls
- Multi-device support — switch between WiiM speakers from the UI
- Per-client device selection (stored in cookies)
- Auto-discovers the first available device on the network

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

By default the app connects to the first UPnP device it finds. To prefer a specific device by name, set the environment variable:

```bash
WIIM_DEVICE_NAME=living room
```

This can be added to `.env.local` or passed directly. Once a device is selected via the UI, the choice is saved per-browser and takes priority over this setting.

## Tech Stack

- **Next.js** (App Router, TypeScript)
- **node-ssdp** — SSDP device discovery
- **upnp-device-client** — UPnP/SOAP control
- **fast-xml-parser** — DIDL-Lite metadata parsing
