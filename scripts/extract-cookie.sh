#!/bin/bash
# Extract GitHub session cookie and configure VS Code extension

set -e

echo "🔍 GitHub Copilot Usage Widget - Cookie Setup"
echo "=============================================="
echo ""

# Function to extract cookie from Firefox
extract_from_firefox() {
    local firefox_profile=$(find ~/.mozilla/firefox -name "*.default*" -type d | head -1)
    
    if [ -z "$firefox_profile" ]; then
        return 1
    fi
    
    local cookies_db="$firefox_profile/cookies.sqlite"
    
    if [ ! -f "$cookies_db" ]; then
        return 1
    fi
    
    # Copy to temp to avoid locking issues
    local temp_db="/tmp/firefox_cookies_copy.sqlite"
    cp "$cookies_db" "$temp_db"
    
    # Extract user_session cookie for github.com
    local cookie=$(sqlite3 "$temp_db" "SELECT value FROM moz_cookies WHERE host LIKE '%github.com%' AND name='user_session' ORDER BY lastAccessed DESC LIMIT 1;" 2>/dev/null)
    
    rm "$temp_db"
    
    if [ -n "$cookie" ]; then
        echo "$cookie"
        return 0
    fi
    
    return 1
}

# Function to extract cookie from Chrome/Chromium/Edge
extract_from_chrome() {
    local chrome_paths=(
        "$HOME/.config/google-chrome/Default/Cookies"
        "$HOME/.config/chromium/Default/Cookies"
        "$HOME/.config/microsoft-edge/Default/Cookies"
        "$HOME/snap/chromium/common/chromium/Default/Cookies"
    )
    
    for cookies_db in "${chrome_paths[@]}"; do
        if [ -f "$cookies_db" ]; then
            # Copy to temp to avoid locking issues
            local temp_db="/tmp/chrome_cookies_copy.sqlite"
            cp "$cookies_db" "$temp_db"
            
            # Extract user_session cookie for github.com
            local cookie=$(sqlite3 "$temp_db" "SELECT value FROM cookies WHERE host_key LIKE '%github.com%' AND name='user_session' ORDER BY last_access_utc DESC LIMIT 1;" 2>/dev/null | strings)
            
            rm "$temp_db"
            
            if [ -n "$cookie" ]; then
                echo "$cookie"
                return 0
            fi
        fi
    done
    
    return 1
}

# Check if sqlite3 is installed
if ! command -v sqlite3 &> /dev/null; then
    echo "❌ Error: sqlite3 is not installed"
    echo "   Install it with: sudo apt install sqlite3"
    exit 1
fi

# Try to extract cookie
echo "🔎 Looking for GitHub session cookie in browsers..."
echo ""

COOKIE=""

# Try Firefox first
if COOKIE=$(extract_from_firefox 2>/dev/null); then
    echo "✅ Found cookie in Firefox!"
elif COOKIE=$(extract_from_chrome 2>/dev/null); then
    echo "✅ Found cookie in Chrome/Chromium/Edge!"
else
    echo "❌ Could not find GitHub session cookie in any browser"
    echo ""
    echo "Please make sure you are logged in to GitHub in your browser, then try again."
    echo ""
    echo "Alternatively, follow the manual setup in SETUP.md"
    exit 1
fi

if [ -z "$COOKIE" ]; then
    echo "❌ Cookie is empty - something went wrong"
    exit 1
fi

# Find VS Code settings file
VSCODE_SETTINGS="$HOME/.config/Code/User/settings.json"

if [ ! -f "$VSCODE_SETTINGS" ]; then
    echo "⚠️  VS Code settings file not found at: $VSCODE_SETTINGS"
    echo "   Creating new settings file..."
    mkdir -p "$(dirname "$VSCODE_SETTINGS")"
    echo "{}" > "$VSCODE_SETTINGS"
fi

echo ""
echo "📝 Updating VS Code settings..."

# Use jq to update settings if available, otherwise use sed
if command -v jq &> /dev/null; then
    # Backup settings
    cp "$VSCODE_SETTINGS" "$VSCODE_SETTINGS.backup"
    
    # Update with jq
    jq ". + {\"copilotUsage.githubSessionCookie\": \"user_session=$COOKIE\"}" "$VSCODE_SETTINGS" > "$VSCODE_SETTINGS.tmp"
    mv "$VSCODE_SETTINGS.tmp" "$VSCODE_SETTINGS"
    
    echo "✅ VS Code settings updated!"
    echo "   Backup saved to: $VSCODE_SETTINGS.backup"
else
    echo ""
    echo "⚠️  jq is not installed - showing cookie for manual setup:"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "user_session=$COOKIE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Copy this value and paste it in VS Code settings:"
    echo "1. Open Settings (Ctrl+,)"
    echo "2. Search for: copilotUsage.githubSessionCookie"
    echo "3. Paste the value above"
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Setup complete!"
echo ""
echo "The Copilot Usage Widget is now configured."
echo "Reload VS Code or press F5 to debug the extension."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
