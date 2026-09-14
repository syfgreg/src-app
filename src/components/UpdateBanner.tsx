import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Icon } from "./Icon";

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * A phone left open for a whole tournament weekend won't otherwise notice a
 * new deploy — browsers mainly check for service worker updates on
 * navigation, which a single-page app kept open never does. Polls for one
 * periodically and, when found, waits for an explicit tap rather than
 * reloading out from under someone mid-ruling.
 */
export function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => registration.update(), CHECK_INTERVAL_MS);
    },
  });

  // Also check the moment a backgrounded tab comes back to the foreground —
  // catches the common case of the app being reopened after a while away.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") navigator.serviceWorker?.getRegistration()?.then((r) => r?.update());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  if (!needRefresh) return null;

  return (
    <div className="update-banner" role="alert">
      <div className="update-ico">
        <Icon name="sparkle" size={20} strokeWidth={1.7} />
      </div>
      <div className="update-body">
        <div className="update-title">A new version is ready</div>
        <p className="update-steps">Tap to update — this only takes a second.</p>
      </div>
      <button className="btn small seafoam" onClick={() => updateServiceWorker(true)}>
        Update
      </button>
    </div>
  );
}
