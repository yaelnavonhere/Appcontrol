// One config per App Control module. Every policy screen takes `mod` and reads its labels and rules from here.
// Both modules use the Under review model (boards 2026-11-24): each app is Under review / Approved / Not approved per policy.
// The list's Apps column shows RMM's Approved + Under review apps and Applications' Not approved + Under review apps.
export const MODULES = {
  rmm: {
    key: 'rmm', base: '/rmm', pk: 'rmmPolicies', category: 'RMM Guard', listed: 'Approved', other: 'Not approved',
    tableLabel: 'RMM Guard policies', colApps: 'Apps', colGroups: 'Groups', popTitle: 'Apps',
    showDesc: false, filterApp: 'RMM application', searchApps: 'Search RMM apps',
    appsTitle: 'RMM apps', appNoun: 'RMM app', otherRow: 'Any other RMM app',
    newApps: true, newAppsLabel: 'New apps from Cynet Research', newAppsHelp: 'The approval new catalog apps get in this policy.', newAppsOptions: ['Under review', 'Not approved'],
    editDesc: 'Set an approval for each RMM app.', editAppLabel: 'RMM app', editAppPh: 'Select apps',
    wizardTitle: 'New RMM Guard policy',
    step2: ['RMM apps', 'Set an approval for each app.'],
    head2: ['RMM apps', 'Set an approval for each app.'],
    emptyBody: "Create your first policy to control which RMM apps can run on your groups' endpoints.",
    logsEmptyBody: 'Events appear here when RMM apps run on endpoints in groups with an assigned policy.',
    logAppCol: 'RMM app', logSearch: 'Search user, host, app or domain', logFilterApps: 'RMM apps', logListTitle: 'Execution details',
    deep: { popover: 'server-admin-access', menu: 'workstation-support', drawer: 'finance-lockdown', dup: 'msp-standard-rmm', del: 'finance-lockdown', edit: 'finance-lockdown' },
  },
  ai: {
    key: 'ai', base: '/ai', pk: 'aiPolicies', category: 'Applications', listed: 'Not approved', other: 'Approved',
    tableLabel: 'Applications policies', colApps: 'Apps', colGroups: 'Groups', popTitle: 'Apps',
    showDesc: true, filterApp: 'App', searchApps: 'Search apps',
    appsTitle: 'Apps', appNoun: 'app', otherRow: 'All other apps',
    newApps: false, // RMM Guard only (Yael, overrides C3)
    editDesc: 'Set an approval for each app.', editAppLabel: 'App', editAppPh: 'Select apps',
    wizardTitle: 'New Applications policy',
    step2: ['Apps', 'Set an approval for each app.'],
    head2: ['Apps', 'Set an approval for each app.'],
    emptyBody: "Create your first policy to control which apps can run on your groups' endpoints.",
    logsEmptyBody: 'Events appear here when apps run on endpoints in groups with an assigned policy.',
    logAppCol: 'App', logSearch: 'Search user, host, app or action', logFilterApps: 'Apps', logListTitle: 'Connections',
    deep: { popover: 'no-ai-on-servers', menu: 'office-ai-assistants', drawer: 'office-ai-assistants', dup: 'office-ai-assistants', del: 'office-ai-assistants', edit: 'office-ai-assistants' },
  },
};
