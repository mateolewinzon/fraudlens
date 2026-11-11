import Image from "next/image";
import Link from "next/link";

export type AppMode = "lab" | "demo";

const NAV_ITEMS: { id: AppMode; href: string; label: string; hint: string; icon: string }[] = [
  { id: "lab", href: "/", label: "Laboratorio", hint: "API real", icon: "⚗" },
  { id: "demo", href: "/?modo=demo", label: "Vista previa", hint: "Próximas funciones", icon: "◇" },
];

export default function AppShell({ mode, children }: { mode: AppMode; children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="rail">
        <Link className="brand" href="/" aria-label="FraudLens, laboratorio">
          <Image className="brand-full logo-light" src="/brand/logo-completo-modo-claro.png" alt="" width={1471} height={370} priority />
          <Image className="brand-full logo-dark" src="/brand/logo-completo-modo-oscuro.png" alt="" width={1471} height={370} priority />
          <Image className="brand-mark" src="/brand/favicon.png" alt="" width={64} height={64} />
        </Link>
        <nav className="mode-nav" aria-label="Modo">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.id}
              href={item.href}
              className="mode-link"
              aria-current={item.id === mode ? "page" : undefined}
              title={`${item.label}: ${item.hint}`}
            >
              <span className="mode-icon" aria-hidden="true">{item.icon}</span>
              <span className="mode-text">
                <span className="mode-label">{item.label}</span>
                <span className="mode-hint">{item.hint}</span>
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
