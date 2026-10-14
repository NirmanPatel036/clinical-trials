"use client";

// Workbench navigation: one link per route, collapsible to icons (remembered per device), account and sign-out.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useRef } from "react";

import { A } from "@/lib/assets";
import { s } from "@/lib/s";

import { ICON, Icon } from "./ui";

export const TABS = [
  { href: "/workbench/search", label: "Find trials", icon: ICON.search },
  { href: "/workbench/ask", label: "Ask", icon: ICON.chat },
  { href: "/workbench/saved", label: "Saved trials", icon: ICON.bookmark },
  { href: "/workbench/profile", label: "My profile", icon: ICON.user },
  { href: "/workbench/match", label: "Patient match", icon: ICON.match },
  { href: "/workbench/details", label: "How we searched", icon: ICON.plan },
  { href: "/workbench/data", label: "About the data", icon: ICON.data },
];

const RESULTS = "/workbench/match/results";

export function Sidebar({ collapsed, onToggle, hasResults, name, email, onSignOut }:
  { collapsed: boolean; onToggle: () => void; hasResults: boolean; name: string; email: string; onSignOut: () => void }) {
  const path = usePathname();
  const confirm = useRef<HTMLDialogElement>(null);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [path]);

  return (
    <aside className="wb-side">
      <div className="wb-brand" style={s("display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 4px 0 12px")}>
        <a href="/" className="wb-brand-word"><img src={A["orvant-wordmark-light.png"]} alt="orvant" style={s("height:22px;width:auto;display:block")} /></a>
        <a href="/" className="wb-brand-mark"><img src={A["orvant-mark-light.png"]} alt="orvant" style={s("width:28px;height:auto;display:block")} /></a>
        <button type="button" className="wb-collapse" onClick={onToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <Icon d={ICON.panel} size={18} width={1.6} />
        </button>
      </div>
      <nav className="wb-tabs" aria-label="Workbench">
        {TABS.map((t) => (
          <Fragment key={t.href}>
            <Link href={t.href} className="wb-tab" aria-current={path.startsWith(t.href) && !path.startsWith(RESULTS) ? "page" : undefined} title={collapsed ? t.label : undefined}>
              <Icon d={t.icon} size={18} width={1.6} /><span className="wb-label">{t.label}</span>
            </Link>
            {/* Match results are a sub-page of Patient match, listed once there is a result to show. */}
            {t.href === "/workbench/match" && (hasResults || path.startsWith(RESULTS)) && (
              <Link href={RESULTS} className="wb-tab wb-subtab" aria-current={path.startsWith(RESULTS) ? "page" : undefined} title={collapsed ? "Match results" : undefined}>
                <Icon d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" size={16} width={1.8} /><span className="wb-label">Results</span>
              </Link>
            )}
          </Fragment>
        ))}
      </nav>
      <div className="wb-user" style={s("display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:rgba(247,246,242,.05)")}>
        <span style={s("width:32px;height:32px;border-radius:50%;background:#0045FD;color:#FFFFFF;display:flex;align-items:center;justify-content:center;font-size:14px;flex:none")}>
          {(name || email || "?").charAt(0).toUpperCase()}
        </span>
        <div className="wb-user-name" style={s("min-width:0;flex:1")}>
          <div style={s("font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>{name || "Your account"}</div>
          <div style={s("font-size:12px;color:#9AA3B5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>{email}</div>
        </div>
        <button type="button" onClick={() => confirm.current?.showModal()} aria-label="Sign out" title="Sign out" style={s("border:0;background:none;padding:6px;color:#B5BDCC;display:flex")}>
          <Icon d={ICON.signOut} size={18} width={1.6} />
        </button>
      </div>

      <dialog ref={confirm} className="wb-dialog" aria-labelledby="sign-out-title">
        <form method="dialog" style={s("display:flex;flex-direction:column;gap:16px")}>
          <div style={s("width:44px;height:44px;border-radius:50%;background:#F8E2DC;color:#C8442F;display:flex;align-items:center;justify-content:center")}><Icon d={ICON.signOut} size={20} /></div>
          <h2 id="sign-out-title" style={s("margin:0;font-weight:400;font-size:22px;letter-spacing:-.01em")}>Sign out of Orvant?</h2>
          <p style={s("margin:0;font-size:14px;color:#4B5568")}>Your search results will be cleared. To come back you'll need your email code or fingerprint, and your authenticator code.</p>
          <div style={s("display:flex;justify-content:flex-end;gap:8px;margin-top:4px")}>
            <button value="cancel" autoFocus className="btn-line" style={s("font-size:14px;border:1px solid #D6D2C6;border-radius:999px;padding:10px 18px;background:#FFFFFF;color:#142237")}>Cancel</button>
            <button type="button" onClick={onSignOut} className="btn-ink" style={s("font-size:14px;border:0;border-radius:999px;padding:10px 18px;background:#C8442F;color:#FFFFFF")}>Sign out</button>
          </div>
        </form>
      </dialog>
    </aside>
  );
}
