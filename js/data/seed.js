// One coherent MSP data set for the prototype. Source: both Figma boards as of 2026-11-12,
// plus the sample-data rules (cynet-copy-conventions/references/sample-data.md).
// Contradictions resolved here are listed in PLAN.md (sections 3 and 8).

export const NOW = '2025-09-30T12:35:12Z'; // board timestamp "30 SEP 2025 12:35:12 UTC"

export const msp = { id: 'brightpath', name: 'Brightpath IT' };

// Sites (MSP customers). Names come from the boards' Site container lists.
export const sites = [
  { id: 'hdg', name: 'Harbor Dental Group', code: 'HDG', domain: 'harbordental.com', tz: 'UTC' },
  { id: 'nsb', name: 'Northstar Bank', code: 'NSB', domain: 'northstarbank.com', tz: 'UTC' },
  { id: 'smh', name: 'Summit Health', code: 'SMH', domain: 'summithealth.org', tz: 'UTC' },
  { id: 'apx', name: 'Apex Logistics', code: 'APX', domain: 'apexlogistics.com', tz: 'UTC' },
  { id: 'vtx', name: 'Vertex Labs', code: 'VTX', domain: 'vertexlabs.io', tz: 'UTC' },
  { id: 'bsr', name: 'BlueSky Retail', code: 'BSR', domain: 'blueskyretail.com', tz: 'UTC' },
  { id: 'atl', name: 'Atlas Legal', code: 'ATL', domain: 'atlaslegal.com', tz: 'UTC' },
  { id: 'cdf', name: 'Cedar Finance', code: 'CDF', domain: 'cedarfinance.com', tz: 'UTC' },
  { id: 'nve', name: 'Nova Energy', code: 'NVE', domain: 'novaenergy.com', tz: 'UTC' },
  { id: 'pcg', name: 'Pinecrest Group', code: 'PCG', domain: 'pinecrestgroup.com', tz: 'UTC' },
  { id: 'orf', name: 'Orion Foods', code: 'ORF', domain: 'orionfoods.com', tz: 'UTC' },
  { id: 'bcm', name: 'Beacon Media', code: 'BCM', domain: 'beaconmedia.com', tz: 'UTC' },
  { id: 'evg', name: 'Evergreen Co', code: 'EVG', domain: 'evergreenco.com', tz: 'UTC' },
  { id: 'hbh', name: 'Harbor Hotels', code: 'HBH', domain: 'harborhotels.com', tz: 'UTC' },
  { id: 'mtd', name: 'Metro Dental', code: 'MTD', domain: 'metrodental.com', tz: 'UTC' },
  { id: 'slv', name: 'Silverline Inc', code: 'SLV', domain: 'silverlineinc.com', tz: 'UTC' },
  { id: 'lac', name: 'Lumière Aesthetic Clinic', code: 'LAC', domain: 'lumiereclinic.com', tz: 'UTC' },
  { id: 'nia', name: 'Northgate Insurance Agency', code: 'NIA', domain: 'northgateins.com', tz: 'UTC' },
];

export const demoSiteId = 'hdg';

// Computer groups at the demo site. rmm/ai = policy id + verdict.
// The first 7 + Finance Laptops are the names already on the boards.
export const groups = [
  { id: 'front-desk', name: 'Front Desk', os: 'Windows', endpoints: 9, rmm: ['workstation-support', 'Block'], ai: ['office-ai-assistants', 'Block'] },
  { id: 'clinicians', name: 'Clinicians', os: 'Windows', endpoints: 14, rmm: ['workstation-support', 'Block'], ai: ['office-ai-assistants', 'Track'] },
  { id: 'reception-kiosks', name: 'Reception Kiosks', os: 'Windows', endpoints: 4, rmm: ['finance-lockdown', 'Track'], ai: ['office-ai-assistants', 'Block'] },
  { id: 'executives', name: 'Executives', os: 'macOS', endpoints: 5, rmm: ['finance-lockdown', 'Track'], ai: ['office-ai-assistants', 'Track'] },
  { id: 'it-admins', name: 'IT Admins', os: 'Windows', endpoints: 3, rmm: ['server-admin-access', 'Track'], ai: ['office-ai-assistants', 'Track'] },
  { id: 'shared-workstations', name: 'Shared Workstations', os: 'Windows', endpoints: 6, rmm: ['finance-lockdown', 'Track'], ai: ['office-ai-assistants', 'Track'] },
  { id: 'remote-staff', name: 'Remote Staff', os: 'Windows', endpoints: 7, rmm: ['finance-lockdown', 'Track'], ai: ['office-ai-assistants', 'Block'] },
  { id: 'finance-laptops', name: 'Finance Laptops', os: 'Windows', endpoints: 5, rmm: ['finance-lockdown', 'Track'], ai: ['finance-team', 'Track'] },
  { id: 'windows-servers', name: 'Windows Servers', os: 'Windows Server', endpoints: 2, rmm: ['server-admin-access', 'Block'], ai: ['no-ai-on-servers', 'Block'] },
  { id: 'imaging-stations', name: 'Imaging Stations', os: 'Windows', endpoints: 4, rmm: ['vendor-support-access', 'Block'], ai: ['no-ai-on-servers', 'Track'] },
  { id: 'lab-workstations', name: 'Lab Workstations', os: 'Windows', endpoints: 3, rmm: ['vendor-support-access', 'Track'], ai: ['msp-ai-baseline', 'Track'] },
  { id: 'billing-office', name: 'Billing Office', os: 'Windows', endpoints: 4, rmm: ['msp-standard-rmm', 'Block'], ai: ['msp-ai-baseline', 'Block'] },
  { id: 'conference-rooms', name: 'Conference Rooms', os: 'Windows', endpoints: 3, rmm: ['msp-standard-rmm', 'Track'], ai: [null, 'Track'] },
  { id: 'training-room', name: 'Training Room', os: 'Windows', endpoints: 6, rmm: ['system-policy', 'Track'], ai: [null, 'Track'] },
  { id: 'exam-rooms', name: 'Exam Rooms', os: 'Windows', endpoints: 8, rmm: ['workstation-support', 'Block'], ai: ['clinical-workstations', 'Block'] },
  { id: 'hygiene-stations', name: 'Hygiene Stations', os: 'Windows', endpoints: 5, rmm: ['lab-workstations', 'Block'], ai: ['clinical-workstations', 'Track'] },
  { id: 'waiting-room-kiosk', name: 'Waiting Room Kiosk', os: 'Windows', endpoints: 2, rmm: ['lab-workstations', 'Block'], ai: ['front-desk-kiosks', 'Block'] },
  { id: 'patient-check-in', name: 'Patient Check-in', os: 'Windows', endpoints: 3, rmm: ['lab-workstations', 'Track'], ai: ['front-desk-kiosks', 'Track'] },
];

// Hosts follow <site code>-<role>-<nn>. Generated per group from a role code.
const roleCode = {
  'front-desk': 'FD', clinicians: 'CLIN', 'reception-kiosks': 'RK', executives: 'EXE', 'it-admins': 'ADM',
  'shared-workstations': 'SW', 'remote-staff': 'NB', 'finance-laptops': 'FIN', 'windows-servers': 'SRV',
  'imaging-stations': 'IMG', 'lab-workstations': 'LAB', 'billing-office': 'BIL', 'conference-rooms': 'CONF',
  'training-room': 'TRN', 'exam-rooms': 'EXM', 'hygiene-stations': 'HYG', 'waiting-room-kiosk': 'WRK', 'patient-check-in': 'PCI',
};
export const hosts = groups.flatMap(g => Array.from({ length: g.endpoints }, (_, i) => ({
  id: `HDG-${roleCode[g.id]}-${String(i + 1).padStart(2, '0')}`, groupId: g.id, os: g.os,
  ip: `192.0.2.${(Object.keys(roleCode).indexOf(g.id) * 12 + i + 10) % 250}`,
})));

// Users already on the boards, at the site's domain.
export const users = ['Alex Morgan', 'Jamie Chen', 'Taylor Reed', 'Jordan Lee', 'Casey Patel', 'Sam Rivera', 'Robin Kim', 'Avery Brooks']
  .map(n => ({ name: n, email: n.toLowerCase().replace(' ', '.') + '@harbordental.com' }));

// App catalogs. icon = file in assets/favicons (generic "app" where DS3 has no favicon yet).
export const aiApps = [
  { id: 'chatgpt', name: 'ChatGPT', vendor: 'OpenAI', category: 'GenAI Chatbot', kind: 'service', icon: 'chatgpt' },
  { id: 'claude-desktop', name: 'Claude Desktop', vendor: 'Anthropic', category: 'Desktop AI Assistant', kind: 'app', icon: 'claude-desktop' },
  { id: 'claude', name: 'Claude', vendor: 'Anthropic', category: 'Desktop AI Assistant', kind: 'app', icon: 'claude-desktop' },
  { id: 'claude-code', name: 'Claude Code', vendor: 'Anthropic', category: 'Coding CLI', kind: 'app', icon: 'claude-code' },
  { id: 'google-gemini', name: 'Google Gemini', vendor: 'Google', category: 'GenAI Chatbot', kind: 'service', icon: 'google-gemini' },
  { id: 'microsoft-copilot', name: 'Microsoft Copilot', vendor: 'Microsoft', category: 'GenAI Chatbot', kind: 'service', icon: 'microsoft-copilot' },
  { id: 'github-copilot', name: 'GitHub Copilot', vendor: 'GitHub (Microsoft)', category: 'Coding Assistant', kind: 'app', icon: 'github-copilot' },
  { id: 'perplexity', name: 'Perplexity', vendor: 'Perplexity AI', category: 'GenAI Chatbot', kind: 'service', icon: 'perplexity' },
  { id: 'cursor', name: 'Cursor', vendor: 'Anysphere', category: 'Agentic IDE', kind: 'app', icon: 'cursor' },
  { id: 'grammarly', name: 'Grammarly', vendor: 'Grammarly', category: 'Writing Assistant', kind: 'app', icon: 'grammarly' },
  { id: 'canva-ai', name: 'Canva AI', vendor: 'Canva', category: 'Design Assistant', kind: 'service', icon: 'canva-ai' },
  { id: 'deepseek', name: 'DeepSeek', vendor: 'DeepSeek', category: 'GenAI Chatbot', kind: 'service', icon: 'deepseek' },
  { id: 'lovable', name: 'Lovable', vendor: 'Lovable', category: 'App Builder', kind: 'service', icon: 'lovable' },
  { id: 'ollama', name: 'Ollama', vendor: 'Ollama', category: 'Local LLM Runtime', kind: 'app', icon: 'ollama' },
  { id: 'codex', name: 'Codex', vendor: 'OpenAI', category: 'Coding CLI', kind: 'app', icon: 'codex' },
  { id: 'openclaw', name: 'OpenClaw Agent', vendor: 'OpenClaw', category: 'GenAI Chatbot', kind: 'app', icon: 'openclaw' },
  { id: 'mistral', name: 'Mistral AI', vendor: 'Mistral AI', category: 'GenAI Chatbot', kind: 'service', icon: 'ai-app' },
  { id: 'grok', name: 'Grok', vendor: 'xAI', category: 'GenAI Chatbot', kind: 'service', icon: 'ai-app' },
  { id: 'notion-ai', name: 'Notion AI', vendor: 'Notion', category: 'Writing Assistant', kind: 'service', icon: 'ai-app' },
  { id: 'otter', name: 'Otter.ai', vendor: 'Otter.ai', category: 'Meeting Assistant', kind: 'service', icon: 'ai-app' },
  { id: 'unknown', name: 'Unknown', vendor: 'Unknown', category: 'Coding CLI', kind: 'app', icon: 'app' },
];

export const rmmApps = [
  { id: 'screenconnect', name: 'ScreenConnect', vendor: 'ConnectWise', icon: 'connectwise' },
  { id: 'anydesk', name: 'AnyDesk', vendor: 'AnyDesk', icon: 'anydesk' },
  { id: 'teamviewer', name: 'TeamViewer', vendor: 'TeamViewer', icon: 'teamviewer' },
  { id: 'ninjaone', name: 'NinjaOne', vendor: 'NinjaOne', icon: 'ninjaone' },
  { id: 'atera', name: 'Atera', vendor: 'Atera', icon: 'atera' },
  { id: 'datto-rmm', name: 'Datto RMM', vendor: 'Kaseya', icon: 'datto' },
  { id: 'n-central', name: 'N-able N-central', vendor: 'N-able', icon: 'n-central' },
  { id: 'kaseya-vsa', name: 'Kaseya VSA', vendor: 'Kaseya', icon: 'kaseya' },
  { id: 'splashtop', name: 'Splashtop', vendor: 'Splashtop', icon: 'app' },
  { id: 'goto-resolve', name: 'GoTo Resolve', vendor: 'GoTo', icon: 'app' },
  { id: 'cw-automate', name: 'ConnectWise Automate', vendor: 'ConnectWise', icon: 'connectwise' },
  { id: 'n-sight', name: 'N-able N-sight', vendor: 'N-able', icon: 'app' },
  { id: 'syncro', name: 'Syncro', vendor: 'Syncro', icon: 'app' },
  { id: 'pulseway', name: 'Pulseway', vendor: 'Pulseway', icon: 'app' },
  { id: 'action1', name: 'Action1', vendor: 'Action1', icon: 'app' },
  { id: 'level', name: 'Level', vendor: 'Level', icon: 'app' },
  { id: 'barracuda-rmm', name: 'Barracuda RMM', vendor: 'Barracuda', icon: 'app' },
  { id: 'domotz', name: 'Domotz', vendor: 'Domotz', icon: 'app' },
  { id: 'tactical-rmm', name: 'Tactical RMM', vendor: 'AmidaWare', icon: 'app' },
  { id: 'manageengine', name: 'ManageEngine RMM Central', vendor: 'Zoho', icon: 'app' },
  { id: 'superops', name: 'SuperOps', vendor: 'SuperOps', icon: 'app' },
];

const meta = { modified: NOW, by: 'Cynet admin', notify: true };

// Every app has one approval per policy: Under review / Approved / Not approved (2026-11-24 boards).
// `base` = the approval of every app not named in `states`. New apps start Under review.
const S = (approved = [], notApproved = [], underReview = []) => Object.fromEntries([
  ...approved.map(id => [id, 'Approved']), ...notApproved.map(id => [id, 'Not approved']), ...underReview.map(id => [id, 'Under review'])]);

// RMM Guard policies. The System policy: every app Not approved, every group starts in Track (Yael, 2026-11-24).
export const rmmPolicies = [
  { id: 'system-policy', name: 'System policy', type: 'System', description: 'All RMM apps are Not approved. New groups get this policy in Track.', base: 'Not approved', states: {}, newApps: 'Not approved', sites: ['hdg', 'nsb'], ...meta },
  { id: 'msp-standard-rmm', name: 'MSP standard RMM', type: 'Inherited', description: 'Approves only the RMM apps our MSP uses.', base: 'Not approved', states: S(['ninjaone', 'screenconnect']), newApps: 'Not approved', sites: ['smh', 'apx'], ...meta },
  { id: 'server-admin-access', name: 'Server admin access', type: 'Inherited', description: '', base: 'Not approved', states: S(['kaseya-vsa', 'datto-rmm', 'anydesk', 'teamviewer', 'splashtop', 'goto-resolve'], [], ['atera', 'ninjaone', 'screenconnect', 'n-central', 'n-sight', 'syncro']), newApps: 'Under review', sites: ['vtx', 'bsr'], ...meta },
  { id: 'workstation-support', name: 'Workstation support', type: 'Local', description: '', base: 'Not approved', states: S(['teamviewer', 'atera', 'ninjaone']), newApps: 'Not approved', sites: ['atl', 'cdf'], ...meta },
  { id: 'remote-support', name: 'Remote support', type: 'Inherited', description: '', base: 'Not approved', states: S(['screenconnect', 'n-central', 'kaseya-vsa', 'datto-rmm', 'ninjaone', 'atera']), newApps: 'Not approved', sites: ['nve', 'pcg'], ...meta },
  { id: 'finance-lockdown', name: 'Finance lockdown', type: 'Local', description: '', base: 'Approved', states: {}, newApps: 'Not approved', sites: ['orf', 'bcm'], ...meta },
  { id: 'vendor-support-access', name: 'Vendor support access', type: 'Inherited', description: '', base: 'Not approved', states: {}, newApps: 'Not approved', sites: ['evg', 'hbh'], ...meta },
  { id: 'lab-workstations', name: 'Lab workstations', type: 'Local', description: 'Executive devices', base: 'Under review', states: S(['ninjaone', 'datto-rmm', 'kaseya-vsa'], ['anydesk']), newApps: 'Under review', sites: ['mtd', 'slv'], ...meta },
];

// Applications policies. No default policy (Yael, 2026-11-24): a group may have no Applications policy ([null, verdict]).
export const aiPolicies = [
  { id: 'msp-ai-baseline', name: 'MSP AI baseline', type: 'Inherited', description: "Blocks AI apps the MSP hasn't vetted.", base: 'Under review', states: S(['microsoft-copilot'], ['deepseek', 'grok']), sites: ['smh', 'apx'], ...meta },
  { id: 'no-ai-on-servers', name: 'No AI on servers', type: 'Inherited', description: 'Blocks AI apps on servers.', base: 'Under review', states: S([], ['claude-desktop', 'canva-ai', 'chatgpt', 'codex', 'deepseek', 'ollama']), sites: ['vtx', 'bsr'], ...meta },
  { id: 'office-ai-assistants', name: 'Office AI assistants', type: 'Local', description: 'Approves Copilot and ChatGPT for office staff.', base: 'Under review', states: S(['microsoft-copilot', 'chatgpt'], ['perplexity', 'deepseek', 'grammarly', 'canva-ai', 'cursor', 'codex']), sites: ['atl', 'cdf'], ...meta },
  { id: 'developer-ai-assistants', name: 'Developer AI assistants', type: 'Inherited', description: 'Approves coding assistants for developers.', base: 'Under review', states: S(['github-copilot', 'cursor', 'claude-code', 'codex'], ['deepseek', 'grok', 'ollama']), sites: ['nve', 'pcg'], ...meta },
  { id: 'finance-team', name: 'Finance team', type: 'Local', description: 'Blocks unapproved AI apps for finance staff.', base: 'Under review', states: S(['microsoft-copilot'], ['canva-ai', 'codex']), sites: ['orf', 'bcm'], ...meta },
  { id: 'clinical-workstations', name: 'Clinical workstations', type: 'Inherited', description: 'Blocks GenAI chatbots on clinical workstations.', base: 'Under review', states: S([], ['claude-desktop', 'canva-ai', 'chatgpt', 'google-gemini', 'perplexity', 'deepseek']), sites: ['evg', 'hbh'], ...meta },
  { id: 'front-desk-kiosks', name: 'Front desk kiosks', type: 'Local', description: 'Blocks all AI apps on shared kiosks.', base: 'Not approved', states: {}, sites: ['lac', 'nia'], ...meta },
];

// Demo-flow objects created by the wizards (board deep links prefill them).
export const demoCreates = {
  rmm: { name: 'Help desk remote access', description: 'Approves the remote access apps the help desk uses.', states: S(['ninjaone', 'datto-rmm', 'teamviewer', 'anydesk', 'screenconnect'], ['atera']) },
  ai: { name: 'Clinic AI guardrails', description: 'Tracks Gemini, Claude Desktop and Cursor, and blocks them for remote staff.', states: S([], ['google-gemini', 'claude-desktop', 'cursor']) },
};

// AI Security inventory (site level). State follows the policies; "Under review" = no decision yet.
export const aiInventory = [
  { appId: 'openclaw', domains: 14, services: ['claude-desktop', 'ollama', 'google-gemini'], usage: 'High', users: 12, hosts: 15 },
  { appId: 'cursor', domains: 9, services: ['microsoft-copilot', 'openclaw', 'chatgpt', 'claude-code'], usage: 'Medium', users: 6, hosts: 7 },
  { appId: 'claude', domains: 6, services: ['claude-desktop', 'microsoft-copilot'], usage: 'Low', users: 4, hosts: 4 },
  { appId: 'unknown', domains: 3, services: ['claude-desktop', 'microsoft-copilot', 'google-gemini'], usage: 'Low', users: 2, hosts: 2 },
];
export const genAiServices = ['chatgpt', 'google-gemini', 'microsoft-copilot', 'perplexity'];

export const logDomains = {
  rmm: ['relay-7f2a.net.anydesk.com', 'instance-k4m2pq-relay.screenconnect.com', 'router14.teamviewer.com', 'app.ninjarmm.com', 'agent.atera.com', 'concord.centrastage.net'],
  ai: ['chat.openai.com', 'gemini.google.com', 'api.anthropic.com', 'claude.ai', 'api.perplexity.ai', 'api2.cursor.sh', 'copilot.microsoft.com'],
};
