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

/**
 * Chỉ lấy hoặc tạo visit ID.
 * Không cập nhật thời gian hoạt động nếu ID đã tồn tại.
 * Dùng cho axiosClient và các request API.
 */
export function getVisitId() {
    let visitId = sessionStorage.getItem(VISIT_ID_KEY);

    if (!visitId) {
        visitId = createVisitId();
        sessionStorage.setItem(VISIT_ID_KEY, visitId);
        sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    }

    return visitId;
}

/**
 * Ghi nhận hoạt động thực tế của người dùng.
 * Nếu đã quá 30 phút không hoạt động thì tạo visit ID mới.
 */
export function recordVisitActivity() {
    const now = Date.now();

    const visitId = sessionStorage.getItem(VISIT_ID_KEY);
    const lastActivity = Number(sessionStorage.getItem(LAST_ACTIVITY_KEY));

    const isExpired =
        !visitId ||
        !lastActivity ||
        now - lastActivity >= INACTIVITY_TIMEOUT;

    if (isExpired) {
        const newVisitId = createVisitId();
        sessionStorage.setItem(VISIT_ID_KEY, newVisitId);
    }

    sessionStorage.setItem(LAST_ACTIVITY_KEY, String(now));

    return sessionStorage.getItem(VISIT_ID_KEY);
}