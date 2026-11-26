// Deep links: every board frame -> the prototype route that recreates it.
// Open #/f/<frame-id> (e.g. #/f/20150-57869). `state` names the UI state built in later stages.
// R = RMM board (k3ygrH3igThD5q77knsOLE), A = AI board (XYasoC9jKgULWB8gOQACow).
const F = [];
const add = (board, route, state, ids) => ids.split(' ').forEach(id => F.push({ id, board, route, state }));

// ---- RMM Guard (Site) ----
add('R', '/rmm/policies', 'list', '20150:57869 20636:134010 20636:135027 20150:26977');
add('R', '/rmm/policies', 'list+more-popover', '20178:126780');
add('R', '/rmm/policies', 'list+sort-menu', '20467:354762');
add('R', '/rmm/policies', 'list+filter-panel', '20467:357193 20756:86199 20549:196379 20549:203792');
add('R', '/rmm/policies', 'list+row-actions', '20531:149407 20242:194528 20481:416963 20481:418080 20549:205404 20785:95295');
add('R', '/rmm/policies', 'drawer', '20531:181802 20531:182920 20467:370523 20471:406570 20471:409442 20481:419217 20785:95291');
add('R', '/rmm/policies', 'duplicate', '20549:206527 20868:100289 20549:207950');
add('R', '/rmm/policies', 'edit-page', '20481:425310 20481:525672 20549:218729 20549:219661 20798:119752 20798:120488 20942:76780');
add('R', '/rmm/policies', 'delete', '20471:409445 20471:412354 20471:415765');
add('R', '/rmm/policies', 'cant-delete', '20946:85195');
add('R', '/settings/groups', 'groups', '20774:93173 20774:93176');
add('R', '/settings/groups/front-desk', 'group-details', '20636:140196 20774:92053');
add('R', '/rmm/logs', 'logs', '20150:28461 20627:117811 20636:136537 20636:137375');
add('R', '/rmm/logs', 'logs+filter', '20545:190474 20636:124523 20636:127127 20636:128346 20636:130234 20636:132122');
add('R', '/rmm/logs', 'log-drawer', '20178:140874');
add('R', '/rmm/logs', 'empty', '20979:154823');
add('R', '/rmm/policies', 'empty', '20979:153642');
// ---- RMM Guard (Site container) ----
add('R', '/rmm/policies?scope=msp', 'list', '20549:220458');
add('R', '/rmm/policies?scope=msp', 'drawer', '20549:226979 20549:228579');

// ---- Applications (Site) ----
add('A', '/ai/policies', 'list', '20204:154284 22101:303893 22101:305085 20204:154282');
add('A', '/ai/policies', 'list+more-popover', '20204:154286');
add('A', '/ai/policies', 'list+sort-menu', '22068:56775');
add('A', '/ai/policies', 'list+filter-panel', '22071:68015 22073:70732 22073:72068 22073:73216');
add('A', '/ai/policies', 'list+row-actions', '20204:154464 22074:75029 22094:211091 22097:285374 22099:289001 22097:282684 22101:300451');
add('A', '/ai/policies', 'drawer', '22097:276891 22097:278042 22097:279204 22097:280691 22099:290187 22101:301674 22271:174452');
add('A', '/ai/policies', 'duplicate', '22094:213466 22094:216496 22156:333764');
add('A', '/ai/policies', 'edit-page', '22099:292975 22099:293782 22099:294505 22099:295257 22099:296953 22156:334526');
add('A', '/ai/policies', 'delete', '22097:283887 22101:297698 22101:299232');
add('A', '/ai/policies', 'cant-delete', '22274:398340');
add('A', '/settings/groups', 'groups', '22085:190467 22085:190469');
add('A', '/settings/groups/front-desk', 'group-details', '22085:190213 22309:177346 22204:120588 22204:121196');
add('A', '/settings/groups/front-desk', 'policy-modal:ai', '22085:190379');
add('A', '/ai/logs', 'logs', '20204:154782 22085:198217 22091:207129 22091:208096');
add('A', '/ai/logs', 'logs+filter', '22085:199223 22085:200184 22085:202097 22085:203385 22085:204673 22204:122125');
add('A', '/ai/logs', 'log-drawer', '20204:154784');
// ---- Applications (Site container) ----
add('A', '/ai/policies?scope=msp', 'list', '22113:306709');
add('A', '/ai/policies?scope=msp', 'drawer', '22113:311667 22113:313284');

// ---- AI Security ----
add('A', '/ai-security/inventory', 'inventory', '22068:51387 22068:57949 22068:59791');
add('A', '/ai-security/inventory', 'approve', '22134:319740 22134:319600 22068:58869 22068:62401 22068:63493');
add('A', '/ai-security/inventory', 'not-approve', '22134:321498 22134:316866 22134:317828 22068:64413 22134:323792 22134:324811');
add('A', '/ai-security/inventory', 'app-drawer', '22355:113775');
add('A', '/ai-security/users-hosts', 'user-drawer', '22310:181200');


// ---- 2026-11-24 boards: Under review model, 5-step wizards (Site) / 4-step (Site Manager level) ----
const W = (board, route, step, ids) => add(board, route, 'wizard:' + step, ids);
W('R', '/rmm/policies', 0, '20150:27167 20150:27341');
W('R', '/rmm/policies', 1, '20150:27515 20531:142429 20531:144242 20531:145538 21276:223007 20462:292832 20462:294162 21381:192806');
W('R', '/rmm/policies', 2, '21358:98263');
W('R', '/rmm/policies', 3, '20460:246000 20460:247844 20545:189040 20460:249967 20460:251610 20460:253174 20449:182632 20454:193992 20460:260733');
W('R', '/rmm/policies', 4, '20150:28059 21371:114731 21371:112794');
add('R', '/rmm/policies', 'list', '20208:277893');
add('R', '/rmm/policies', 'drawer', '21218:191379 21218:194505 21218:196067');
add('R', '/rmm/policies', 'drawer:system-policy', '21218:186054');
add('R', '/rmm/policies', 'list+row-actions', '21218:184859');
add('R', '/rmm/policies', 'edit-page', '21221:206156 21223:206964 21223:208416 21221:203050 21221:204795 21285:440447 21285:446963 21285:453539');
W('R', '/rmm/policies?scope=msp', 0, '20549:230351');
W('R', '/rmm/policies?scope=msp', 1, '21359:99403');
W('R', '/rmm/policies?scope=msp', 2, '21359:99570');
W('R', '/rmm/policies?scope=msp', 3, '21359:99725');
add('R', '/rmm/policies?scope=msp', 'edit-page:msp-standard-rmm', '21486:134281');
W('A', '/ai/policies', 0, '20204:154620 20204:154629');
W('A', '/ai/policies', 1, '20265:217771 22600:153030 22600:136002 22600:138795 22611:156073 22611:157931');
W('A', '/ai/policies', 2, '22600:121649');
W('A', '/ai/policies', 3, '22693:249028 20204:154725 20271:248787 20271:250454 22078:102103 22078:113471 22078:123220 22081:126387 22531:163371');
W('A', '/ai/policies', 4, '20204:155279 22702:250622 22654:123058');
add('A', '/ai/policies', 'list', '22081:165075 22068:50231');
add('A', '/ai/policies', 'drawer', '22693:246456 22717:153983');
add('A', '/ai/policies', 'list+row-actions', '22693:243125');
add('A', '/ai/policies', 'edit-page', '22783:129551 22783:157961 22783:169479 22798:194930 22798:204035 22798:192089 22798:192786 22798:193513 22798:194210');
W('A', '/ai/policies?scope=msp', 0, '22113:315387');
W('A', '/ai/policies?scope=msp', 1, '22842:125891');
W('A', '/ai/policies?scope=msp', 2, '22842:126054');
W('A', '/ai/policies?scope=msp', 3, '22842:126211');
add('A', '/ai/policies?scope=msp', 'edit-page:msp-ai-baseline', '22310:183901');
add('A', '/ai-security/inventory', 'not-approve-one', '22842:192807');
add('A', '/ai-security/inventory', 'under-review', '22842:195040');
add('A', '/ai-security/inventory', 'app-drawer', '22835:233354');

// Frames whose drawer shows a specific policy.
const OVERRIDE = { '20467:370523': 'drawer:system-policy', '22271:174452': 'drawer:office-ai-assistants' };
F.forEach(f => { if (OVERRIDE[f.id]) f.state = OVERRIDE[f.id]; });

export const frames = F;
export const frameById = Object.fromEntries(F.map(f => [f.id.replace(':', '-'), f]));
export const figmaUrl = f => `https://www.figma.com/design/${f.board === 'R' ? 'k3ygrH3igThD5q77knsOLE' : 'XYasoC9jKgULWB8gOQACow'}/?node-id=${f.id.replace(':', '-')}`;
