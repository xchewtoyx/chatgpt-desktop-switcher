# Downloading a macOS build

The macOS build workflow runs on pull requests, on pushes to `main`, and on demand through **Actions → Build macOS app → Run workflow**. Select a successful run and download the `ChatGPT-Desktop-Switcher-macOS` artifact. Extract the downloaded artifact, open the DMG inside it, and drag the app to Applications.

The workflow builds for Apple Silicon on GitHub's macOS runner. The app is not signed with an Apple Developer ID or notarized, so macOS Gatekeeper may block it. If you trust the build, follow the macOS instructions for opening an app from an unidentified developer.

ChatGPT.app must already be installed at `/Applications/ChatGPT.app`. The upstream project notes that login callbacks with multiple running instances still need verification with real accounts.
