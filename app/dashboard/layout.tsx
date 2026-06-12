"use client";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Logo from "../components/Logo";

interface SidebarUser {
  discord_username: string;
  discord_avatar: string | null;
}

interface SidebarSub {
  status: string;
  plans: { name: string };
}

const NAV = [
  { icon: "◈", label: "Dashboard",  href: "/dashboard" },
  { icon: "◎", label: "Meu Bot",    href: "/dashboard/bot" },
  { icon: "◐", label: "Produtos",   href: "/dashboard/produtos" },
  { icon: "◑", label: "Vendas",     href: "/dashboard/vendas" },
  { icon: "◬", label: "Tickets",    href: "/dashboard/tickets" },
  { icon: "◉", label: "Analytics",  href: "/dashboard/analytics" },
  { icon: "⬡", label: "Automações", href: "/dashboard/automacoes" },
  { icon: "⬢", label: "Backup",     href: "/dashboard/backup" },
  { icon: "⬣", label: "Wallet",     href: "/dashboard/wallet" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SidebarUser | null>(null);
  const [activeSub, setActiveSub] = useState<SidebarSub | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:3001/auth/me", { credentials: "include" }),
      fetch("http://localhost:3001/subscriptions/status", { credentials: "include" }),
    ])
      .then(async ([meRes, subRes]) => {
        if (!meRes.ok) throw new Error("unauth");
        const [me, subs] = await Promise.all([meRes.json(), subRes.json()]);
        setUser(me.user);
        setActiveSub(
          (subs.subscriptions as SidebarSub[])?.find(s => s.status === "active") ?? null
        );
      })
      .catch(() => router.push("/login"));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#04040a", fontFamily: "'Inter', system-ui, sans-serif", display: "flex" }}>

      {/* Sidebar */}
      <aside style={{
        width: 248, flexShrink: 0,
        background: "rgba(255,255,255,0.018)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, bottom: 0,
        backdropFilter: "blur(20px)", zIndex: 50,
      }}>
        <div style={{ padding: "20px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <Logo size={16} />
        </div>

        <nav style={{ padding: "10px 10px 0", flex: 1, overflowY: "auto" }}>
          {NAV.map(item => {
            const active = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 8, marginBottom: 2,
                  fontSize: 13, textDecoration: "none",
                  color: active ? "#a78bfa" : "rgba(240,240,248,0.32)",
                  background: active ? "rgba(124,58,237,0.1)" : "transparent",
                  border: active ? "1px solid rgba(124,58,237,0.14)" : "1px solid transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  if (!active) {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.color = "rgba(240,240,248,0.65)";
                    el.style.background = "rgba(255,255,255,0.03)";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.color = "rgba(240,240,248,0.32)";
                    el.style.background = "transparent";
                  }
                }}
              >
                <span style={{ fontSize: 13, filter: active ? "drop-shadow(0 0 4px #8b5cf6)" : "none" }}>
                  {item.icon}
                </span>
                {item.label}
              </a>
            );
          })}
        </nav>

        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {user?.discord_avatar
              ? <img src={user.discord_avatar} alt="" style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.25)", flexShrink: 0 }} />
              : <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(124,58,237,0.12)", border: "2px solid rgba(124,58,237,0.2)", flexShrink: 0 }} />
            }
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.discord_username ?? "..."}
              </div>
              <div style={{ fontSize: 10, color: "#8b5cf6", fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>
                {activeSub?.plans?.name?.toUpperCase() ?? "SEM PLANO"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Page content */}
      <main style={{ marginLeft: 248, flex: 1, padding: "40px", color: "#f0f0f8", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
