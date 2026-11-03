const VISIT_ID_KEY = 'website_visit_id';
const LAST_ACTIVITY_KEY = 'website_last_activity';
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 phút

function createVisitId() {
if (typeof crypto !== 'undefined' && crypto.randomUUID) {
return crypto.randomUUID();
}

return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
const r = Math.random() * 16 | 0;
const v = c === 'x' ? r : (r & 0x3 | 0x8);
return v.toString(16);
});
}

export function getVisitId() {
const now = Date.now();

let visitId = sessionStorage.getItem(VISIT_ID_KEY);
const lastActivity = Number(sessionStorage.getItem(LAST_ACTIVITY_KEY));

const isExpired =
!visitId ||
!lastActivity ||
now - lastActivity >= INACTIVITY_TIMEOUT;

if (isExpired) {
visitId = createVisitId();
sessionStorage.setItem(VISIT_ID_KEY, visitId);
}

sessionStorage.setItem(LAST_ACTIVITY_KEY, String(now));

return visitId;
}

export function recordVisitActivity() {
return getVisitId();
}
