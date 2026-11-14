import { useEffect, useRef } from 'react';
import Swal from 'sweetalert2';

// Panel revision: an idle session ends automatically.
export const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const WARNING_MS = 60 * 1000; // warn one minute before signing out
const ACTIVITY_KEY = 'civicare:lastActivity';
export const IDLE_FLAG_KEY = 'civicare:idleLogout';
const EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel'];

const readLastActivity = () => {
  try {
    return Number(localStorage.getItem(ACTIVITY_KEY)) || 0;
  } catch {
    return 0;
  }
};

export const markActivity = () => {
  try {
    localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
  } catch {
    // storage unavailable: the timer still runs on this tab's own clock
  }
};

export const clearActivity = () => {
  try {
    localStorage.removeItem(ACTIVITY_KEY);
  } catch {
    // nothing to clear
  }
};

/** True when a remembered session has been idle past the limit (e.g. the browser was left closed). */
export const sessionExpiredWhileAway = () => {
  const last = readLastActivity();
  return last > 0 && Date.now() - last >= IDLE_TIMEOUT_MS;
};

/**
 * Calls onTimeout('idle') after IDLE_TIMEOUT_MS without mouse, keyboard, scroll or touch activity.
 * Activity is shared through localStorage, so working in one tab keeps every tab signed in.
 * "Log out now" on the warning calls onTimeout('manual').
 */
const useIdleLogout = (active, onTimeout) => {
  const warningOpen = useRef(false);
  const lastWrite = useRef(0);
  const timeoutRef = useRef(onTimeout);
  timeoutRef.current = onTimeout;

  useEffect(() => {
    if (!active) return undefined;
    markActivity();

    const onActivity = () => {
      // While the warning is up only its button counts, so a stray mouse move doesn't dismiss it.
      if (warningOpen.current) return;
      const now = Date.now();
      if (now - lastWrite.current > 5000) {
        lastWrite.current = now;
        markActivity();
      }
    };
    EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    // Ends the session once; the timer stops so the warning can't reappear while signing out.
    let ended = false;
    const end = (reason) => {
      if (ended) return;
      ended = true;
      clearInterval(tick);
      timeoutRef.current(reason);
    };

    const tick = setInterval(() => {
      const idle = Date.now() - (readLastActivity() || Date.now());
      if (idle >= IDLE_TIMEOUT_MS) {
        const wasOpen = warningOpen.current;
        warningOpen.current = false;
        if (wasOpen) Swal.close();
        end('idle');
        return;
      }
      if (warningOpen.current && idle < IDLE_TIMEOUT_MS - WARNING_MS) {
        // Activity in another tab kept the session alive.
        warningOpen.current = false;
        Swal.close();
        return;
      }
      if (!warningOpen.current && idle >= IDLE_TIMEOUT_MS - WARNING_MS) {
        warningOpen.current = true;
        const endsAt = readLastActivity() + IDLE_TIMEOUT_MS;
        Swal.fire({
          icon: 'warning',
          title: 'Are you still there?',
          html: 'You will be signed out in <b>60</b> seconds because of inactivity.',
          showCancelButton: true,
          confirmButtonText: 'Stay signed in',
          cancelButtonText: 'Log out now',
          confirmButtonColor: '#0b7a3e',
          cancelButtonColor: '#6b7280',
          allowOutsideClick: false,
          didOpen: () => {
            const count = Swal.getHtmlContainer()?.querySelector('b');
            const update = () => {
              if (count) count.textContent = String(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
            };
            update();
            Swal.getPopup().dataset.timer = String(setInterval(update, 1000));
          },
          willClose: () => clearInterval(Number(Swal.getPopup()?.dataset.timer)),
        }).then((result) => {
          if (!warningOpen.current) return; // closed by a timeout or by activity elsewhere
          warningOpen.current = false;
          if (result.isConfirmed) markActivity();
          else if (result.dismiss === Swal.DismissReason.cancel) end('manual');
        });
      }
    }, 1000);

    return () => {
      clearInterval(tick);
      EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      if (warningOpen.current) {
        warningOpen.current = false;
        Swal.close();
      }
    };
  }, [active]);
};

export default useIdleLogout;
