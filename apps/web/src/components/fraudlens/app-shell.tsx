import Image from "next/image";
import Link from "next/link";

export type AppMode = "lab" | "demo";

const NAV_ITEMS: { id: AppMode; href: string; label: string; hint: string; icon: string }[] = [
  { id: "lab", href: "/", label: "Laboratorio", hint: "API real", icon: "⚗" },
  { id: "demo", href: "/?modo=demo", label: "Vista previa", hint: "Próximas funciones", icon: "◇" },
];

export default function AppShell({ mode, simulated = false, children }: { mode: AppMode; simulated?: boolean; children: React.ReactNode }) {
  // Keep the simulated API selected while switching modes.
  const withApi = (href: string) => (simulated ? `${href}${href.includes("?") ? "&" : "?"}api=simulada` : href);
  return (
    <div className="app-shell">
      <aside className="rail">
        <Link className="brand" href={withApi("/")} aria-label="FraudLens, laboratorio">
          <Image className="brand-full logo-light" src="/brand/logo-completo-modo-claro.png" alt="" width={1471} height={370} priority />
          <Image className="brand-full logo-dark" src="/brand/logo-completo-modo-oscuro.png" alt="" width={1471} height={370} priority />
          <Image className="brand-mark" src="/brand/favicon.png" alt="" width={64} height={64} />
        </Link>
        <nav className="mode-nav" aria-label="Modo">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.id}
              href={withApi(item.href)}
              className="mode-link"
              aria-current={item.id === mode ? "page" : undefined}
              title={`${item.label}: ${item.id === "lab" && simulated ? "API simulada" : item.hint}`}
            >
              <span className="mode-icon" aria-hidden="true">{item.icon}</span>
              <span className="mode-text">
                <span className="mode-label">{item.label}</span>
                <span className="mode-hint">{item.id === "lab" && simulated ? "API simulada" : item.hint}</span>
              </span>
            </Link>
          ))}
        </nav>
        <p className="rail-footer">FraudLens · MVP</p>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
