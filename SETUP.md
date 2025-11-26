# 🚀 Setup: GitHub Copilot Usage Widget

## Quick Setup (Recommended)

**Use the built-in setup command:**

1. Open Command Palette: **Ctrl+Shift+P**
2. Run: **"Setup Copilot Cookie Authentication"**
3. Follow the guided steps to paste your cookie
4. Done! The widget will appear automatically.

---

## Automated Setup (Linux/macOS)

**Script-based extraction:**

```bash
./scripts/extract-cookie.sh
```

The script will:
- 🔍 Search for GitHub session cookie in Firefox/Chrome/Edge
- 📝 Automatically update your VS Code settings
- ✅ No manual copy-paste needed!

**Requirements:** `sqlite3` (install with: `sudo apt install sqlite3`)

---

## Manual Setup (All Platforms)

If you prefer manual configuration:

### 1. Get Cookie from Browser

1. Open **GitHub** in your browser (where you're logged in)
2. Press **F12** (Developer Tools)
3. Go to **Application** tab
4. Left side: **Cookies** → `https://github.com`
5. Find **`user_session`** in the list
6. Copy the **complete cookie** including the name (e.g., `user_session=tytuxP...`)

### 2. Add Cookie to VS Code

**Option A:** Via Command (Recommended)
1. Open Command Palette: **Ctrl+Shift+P**
2. Run: **"Setup Copilot Cookie Authentication"**
3. Paste the complete cookie: `user_session=YOUR_VALUE`

**Option B:** Via Settings
1. Open VS Code Settings: **Ctrl+,**
2. Search for: `copilotUsage`
3. Find `Github Session Cookie` field
4. Paste in format: `user_session=YOUR_COOKIE_VALUE`

**Example:**
```
user_session=tytuxP86eDDu8NLDk1KuWkT7Bel_d8-YNdCsy37cuJd23hKC
```

### 3. Configure Auto-Refresh (Optional)

Adjust the update interval:
1. Settings: Search `copilotUsage.refreshIntervalSeconds`
2. Set value: 10-3600 seconds (default: 60)

## Troubleshooting

**"Cookie might be expired"** → Get new cookie from browser

**Widget shows Error** → Verify cookie starts with `user_session=`

**No display** → Reload VS Code window (Ctrl+Shift+P → "Reload Window")

## How It Works

The extension:
1. Reads your cookie from VS Code settings
2. Makes a request to `https://github.com/github-copilot/chat/entitlement`
3. Displays the data (percentage + reset date) in the status bar
4. Updates automatically at the configured interval (default: 60 seconds)

**Privacy:** The cookie is stored locally only and used exclusively for GitHub API requests!
