// tracker.js
import axios from "axios";

export function getSessionId() {
  let sid = sessionStorage.getItem("sid");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("sid", sid);
  }
  return sid;
}

// Gắn session id vào mọi request gửi lên Laravel
axios.defaults.headers.common["X-Session-Id"] = getSessionId();

export function trackEvent(event_type, extra = {}) {
  axios.post("/api/track", { event_type, path: window.location.pathname, ...extra });
}