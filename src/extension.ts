import * as vscode from 'vscode';

interface CopilotUsageData {
  percentage: number;
  resetDate: string;
}

interface CopilotAPIResponse {
  quotas?: {
    limits?: {
      premiumInteractions?: number;
    };
    remaining?: {
      premiumInteractions?: number;
      chatPercentage?: number;
      premiumInteractionsPercentage?: number;
    };
    resetDate?: string;
    overagesEnabled?: boolean;
  };
}

export function activate(context: vscode.ExtensionContext) {
  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = 'copilotUsage.openDashboard';
  
  // Register command to open Copilot settings
  const openDashboardCommand = vscode.commands.registerCommand(
    'copilotUsage.openDashboard',
    () => {
      vscode.env.openExternal(
        vscode.Uri.parse('https://github.com/settings/copilot')
      );
    }
  );

  // Register refresh command
  const refreshCommand = vscode.commands.registerCommand(
    'copilotUsage.refresh',
    () => {
      updateStatusBar(statusBarItem);
      vscode.window.showInformationMessage('Copilot usage refreshed!');
    }
  );

  // Register command to show cookie setup instructions
  const setupCookieCommand = vscode.commands.registerCommand(
    'copilotUsage.setupCookie',
    async () => {
      const action = await vscode.window.showInformationMessage(
        'Setup GitHub Cookie Authentication',
        { modal: true, detail: 
          '1. Open GitHub in your browser (F12 for DevTools)\n' +
          '2. Go to Application → Cookies → https://github.com\n' +
          '3. Find "user_session" and copy its Value\n' +
          '4. Paste it in the settings when prompted'
        },
        'Open Settings',
        'Copy Value Here'
      );

      if (action === 'Open Settings') {
        vscode.commands.executeCommand('workbench.action.openSettings', 'copilotUsage');
      } else if (action === 'Copy Value Here') {
        const cookie = await vscode.window.showInputBox({
          prompt: 'Paste the FULL cookie here (including "user_session=")',
          placeHolder: 'user_session=tytuxP86eDDu8NLDk1KuWkT7Bel_d8...',
          password: true
        });
        
        if (cookie) {
          const config = vscode.workspace.getConfiguration('copilotUsage');
          const trimmedCookie = cookie.trim();
          
          // Validate cookie format
          if (!trimmedCookie.startsWith('user_session=')) {
            vscode.window.showErrorMessage('❌ Cookie must start with "user_session="');
            return;
          }
          
          await config.update('githubSessionCookie', trimmedCookie, true);
          vscode.window.showInformationMessage('✓ Cookie configured! Refreshing usage data...');
          updateStatusBar(statusBarItem);
        }
      }
    }
  );

  // Update status bar with usage data
  updateStatusBar(statusBarItem);

  // Show the status bar item
  statusBarItem.show();

  // Listen for configuration changes and restart timer if interval changed
  let updateInterval: NodeJS.Timeout | undefined;
  
  const startAutoRefresh = () => {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    const config = vscode.workspace.getConfiguration('copilotUsage');
    const intervalSeconds = config.get<number>('refreshIntervalSeconds', 60);
    updateInterval = setInterval(() => {
      updateStatusBar(statusBarItem);
    }, intervalSeconds * 1000);
  };

  const configChangeListener = vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('copilotUsage.githubSessionCookie')) {
      updateStatusBar(statusBarItem);
    }
    if (e.affectsConfiguration('copilotUsage.refreshIntervalSeconds')) {
      startAutoRefresh();
    }
  });

  // Start auto-refresh
  startAutoRefresh();

  // Add to subscriptions for cleanup
  context.subscriptions.push(
    statusBarItem,
    openDashboardCommand,
    refreshCommand,
    setupCookieCommand,
    configChangeListener,
    { dispose: () => { if (updateInterval) clearInterval(updateInterval); } }
  );
}

async function updateStatusBar(statusBarItem: vscode.StatusBarItem): Promise<void> {
  // Show loading state initially
  statusBarItem.text = '$(sync~spin) Copilot: Loading...';
  statusBarItem.tooltip = 'Loading Copilot usage data...';

  try {
    const usageData = await getCopilotUsageData();
    
    // Update status bar with usage percentage
    const icon = usageData.percentage > 80 ? '$(warning)' : '$(check)';
    statusBarItem.text = `${icon} Copilot: ${usageData.percentage.toFixed(1)}%`;
    statusBarItem.tooltip = `Copilot Usage: ${usageData.percentage.toFixed(1)}%\nResets on ${usageData.resetDate}\n\nClick to open Copilot settings`;
  } catch (error) {
    statusBarItem.text = '$(error) Copilot: Error';
    statusBarItem.tooltip = `Failed to load usage data: ${error}`;
  }
}

async function getCopilotUsageData(): Promise<CopilotUsageData> {
  try {
    console.log('Fetching Copilot usage from GitHub...');
    
    // Check if user has configured a GitHub session cookie
    const config = vscode.workspace.getConfiguration('copilotUsage');
    const sessionCookie = config.get<string>('githubSessionCookie', '');
    
    if (!sessionCookie) {
      console.log('No GitHub session cookie configured');
      vscode.window.showWarningMessage(
        'Please configure your GitHub session cookie in settings to auto-fetch usage data',
        'Open Settings'
      ).then(selection => {
        if (selection === 'Open Settings') {
          vscode.commands.executeCommand('workbench.action.openSettings', 'copilotUsage');
        }
      });
      throw new Error('No GitHub session cookie configured');
    }
    
    console.log('Using configured session cookie to fetch usage data...');
    
    // Fetch the entitlement endpoint using the session cookie
    const response = await fetch('https://github.com/github-copilot/chat/entitlement', {
      headers: {
        'Cookie': sessionCookie,
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://github.com/settings/copilot'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch usage data:', response.status, response.statusText);
      throw new Error(`GitHub returned ${response.status} - Cookie might be expired`);
    }

    const data = await response.json() as CopilotAPIResponse;
    console.log('Successfully fetched usage data from GitHub');
    
    // Extract quota information
    if (data.quotas && data.quotas.remaining && data.quotas.resetDate) {
      // Calculate percentage from absolute values for accuracy
      const remaining = data.quotas.remaining.premiumInteractions || 0;
      const total = data.quotas.limits?.premiumInteractions || 0;
      const usedPercentage = total > 0 ? ((total - remaining) / total) * 100 : 0;
      
      const resetDateISO = data.quotas.resetDate;
      const resetDate = new Date(resetDateISO).toLocaleDateString('de-DE');
      
      console.log(`Usage: ${usedPercentage.toFixed(1)}% (${remaining}/${total} remaining), Reset: ${resetDate}`);
      
      return { 
        percentage: usedPercentage,
        resetDate: resetDate
      };
    }
    
    throw new Error('Could not extract usage data from response');
    
  } catch (error) {
    console.error('Error fetching Copilot usage:', error);
    throw error;
  }
}

export function deactivate() {
  // Cleanup is handled by context.subscriptions
}
