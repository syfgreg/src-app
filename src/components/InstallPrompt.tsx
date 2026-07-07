import { useState } from "react";
import { Icon } from "./Icon";

const KEY = "src-install-dismissed";

/**
 * True only when the app is running in iOS Safari, is not already installed to
 * the home screen, and the user hasn't dismissed the tip. iOS never fires an
 * install prompt, so we nudge users toward Share → Add to Home Screen (also the
 * only way to enable Web Push on iOS).
 *
 * Append `?installtip=1` to force it (for previews / walking someone through it).
 */
function eligible(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (new URLSearchParams(window.location.search).get("installtip") === "1") return true;
  } catch {
    /* ignore */
  }
  try {
    if (localStorage.getItem(KEY) === "1") return false;
  } catch {
    /* ignore */
  }

  const nav = navigator as unknown as { standalone?: boolean };
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches || nav.standalone === true;
  if (standalone) return false; // already installed

  const ua = navigator.userAgent || "";
  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // iPadOS reports as Mac
  if (!isIOS) return false;

  // Add to Home Screen only exists in real Safari — not Chrome/Firefox/Edge/Opera
  // on iOS, nor most in-app webviews.
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|opios|mercury|brave/i.test(ua);
  return isSafari;
}

export function InstallPrompt() {
  const [show, setShow] = useState(eligible);
  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return (
    <div className="install-tip" role="note">
      <div className="install-ico">
        <Icon name="fish" size={22} strokeWidth={1.7} />
      </div>
      <div className="install-body">
        <div className="install-title">Add Sea Robin to your Home Screen</div>
        <p className="install-steps">
          Tap <Icon name="share" size={15} className="inline-ico" /> <b>Share</b> below, then{" "}
          <b>Add to Home Screen</b> — for the full-screen app and live catch alerts.
        </p>
      </div>
      <button className="install-close" onClick={dismiss} aria-label="Dismiss install tip">
        <Icon name="x" size={18} />
      </button>
    </div>
  );
}
