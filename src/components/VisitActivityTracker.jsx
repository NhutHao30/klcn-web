import { useEffect } from 'react';
import { recordVisitActivity } from '../utils/visitSession';

export default function VisitActivityTracker() {
  useEffect(() => {
    let lastRecordedAt = 0;

    const handleActivity = () => {
      const now = Date.now();

      // Giới hạn ghi sessionStorage tối đa một lần mỗi 10 giây
      if (now - lastRecordedAt < 10000) {
        return;
      }

      lastRecordedAt = now;
      recordVisitActivity();
    };

    const events = [
      'pointerdown',
      'keydown',
      'scroll',
      'touchstart',
      'wheel',
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, {
        passive: true,
      });
    });

    // Khi người dùng quay lại tab, kiểm tra timeout
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        recordVisitActivity();
      }
    };

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    // Ghi nhận thời điểm bắt đầu hoạt động
    recordVisitActivity();

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );
    };
  }, []);

  return null;
}