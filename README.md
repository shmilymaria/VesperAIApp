<h1 align="center">VesperAI App</h1>

<p align="center">
  Mobile AI chat app built with Expo, React Native, and Convex.
</p>

<p align="center">
  <img alt="expo" src="https://img.shields.io/badge/Expo-54-111111?logo=expo&logoColor=white" />
  <img alt="react-native" src="https://img.shields.io/badge/React_Native-0.81-20232A?logo=react&logoColor=61DAFB" />
  <img alt="convex" src="https://img.shields.io/badge/Convex-Backend-EE342F" />
  <img alt="license" src="https://img.shields.io/badge/License-MIT-green.svg" />
</p>

---

## Overview

VesperAI App is the client application for Vesper AI. It handles authentication,
chat interaction, conversation history, model selection, and account usage views.

## Features

- WorkOS authentication (Google and Apple).
- Real-time streaming chat responses.
- Conversation history with drawer navigation.
- Edit latest user message and regenerate response.
- Credit-aware usage flow and account page.

## App Preview

<p align="center">
  <img src="https://files.catbox.moe/yl808z.png" alt="VesperAI login view" width="30%" />
  <img src="https://files.catbox.moe/ybxevh.png" alt="VesperAI chat view" width="30%" />
  <img src="https://files.catbox.moe/02ksqr.png" alt="VesperAI account view" width="30%" />
</p>

<p align="center">
  Login View • Chat View • Account View
</p>

## Tech Stack

- Expo Router + React Native.
- NativeWind + Tailwind config for styling.
- Convex for data sync and persistence.
- WorkOS for auth session flow.

## Getting Started

1. Install dependencies:

```bash
bun install
```

2. Configure environment variables from `.env.example`.

3. Start the app:

```bash
bun run start
```

## Contributing

Contributions are welcome.

- Open an issue for ideas or bugs.
- Submit a pull request with clear changes.

## License

This project is licensed under the MIT License. See `LICENSE` for details.
