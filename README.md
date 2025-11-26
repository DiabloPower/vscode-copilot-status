# Copilot Usage Widget

Displays your GitHub Copilot usage statistics directly in the VS Code status bar - just like in Rider IDE!

## Features

- 📊 Shows current Copilot usage percentage in the status bar
- 📅 Displays when your quota resets
- 🔄 Auto-refresh with configurable interval (default: every 60 seconds)
- ⚡ Click to open GitHub Copilot settings page
- 🔐 Cookie-based authentication (no manual data entry needed)

## Setup

### Quick Setup

1. **Run Setup Command**: Open Command Palette (Ctrl+Shift+P) → `Setup Copilot Cookie Authentication`
2. **Get Cookie**: 
   - Open GitHub in browser → Press F12
   - Go to: Application → Cookies → `https://github.com`
   - Find `user_session` and copy the **complete** cookie (name + value)
3. **Paste**: Paste the full cookie including `user_session=` prefix

### Automated Setup (Linux/macOS)

```bash
./scripts/extract-cookie.sh
```

This script automatically extracts your GitHub session cookie from browser databases.

### 4. Done!

The widget appears in the status bar:
```
✓ Copilot: 78.7%
```

- **Green checkmark (✓)**: Usage below 80%
- **Warning (⚠)**: Usage above 80%
- **Click** to open GitHub Copilot settings

## Commands

- `Copilot Usage: Refresh` - Manually refresh usage data
- `Copilot Usage: Setup Cookie Authentication` - Guided cookie setup
- `Copilot Usage: Open Dashboard` - Open GitHub Copilot settings page

## Configuration

- `copilotUsage.githubSessionCookie`: GitHub session cookie (format: `user_session=...`)
- `copilotUsage.refreshIntervalSeconds`: Auto-refresh interval in seconds (10-3600, default: 60)

## Development

```bash
# Install dependencies
npm install --no-bin-links

# Compile
npm run compile

# Watch mode
npm run watch

# Debug: Press F5 in VS Code
```

## Privacy

Your GitHub session cookie is stored locally in VS Code settings and is only used to fetch usage data from `https://github.com/github-copilot/chat/entitlement`. No data is sent to third parties.

MIT
