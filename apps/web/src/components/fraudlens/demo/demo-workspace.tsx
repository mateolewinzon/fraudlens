"use client";

import { useEffect, useRef, useState } from "react";
import { DEMO_TRANSACTIONS, INCOMING_TEMPLATES } from "@/lib/demo/data";
import {
  EXAMPLE_CONFIG, buildAlerts, evaluateIncoming, recordConfigChange, type ConfigChange, type DemoConfig, type DemoTransaction,
} from "@/lib/demo/rules";
import AlertsPanel from "./alerts-panel";
import ConfigPanel from "./config-panel";
import TransactionDetail from "./transaction-detail";
import TransactionMonitor from "./transaction-monitor";

const ARRIVAL_EVERY_MS = 7000;
const MAX_ROWS = 40;

type TabId = "monitor" | "config" | "alerts";
const TABS: { id: TabId; label: string; scope: string; stage: string }[] = [
  { id: "monitor", label: "Monitor", scope: "CU-05 · CU-06", stage: "MVP" },
  { id: "config", label: "Configuración", scope: "CU-07 · CU-02", stage: "MVP simplificado" },
  { id: "alerts", label: "Alertas", scope: "Líneas futuras", stage: "Fuera del MVP" },
];

/** Preview mode: everything lives in client state and nothing calls the API. */
export default function DemoWorkspace() {
  const [tab, setTab] = useState<TabId>("monitor");
  const [config, setConfig] = useState<DemoConfig>(EXAMPLE_CONFIG);
  const [changes, setChanges] = useState<ConfigChange[]>([]);
  const [transactions, setTransactions] = useState<DemoTransaction[]>([...DEMO_TRANSACTIONS]);
  const [live, setLive] = useState(true);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(() => new Set());
  const arrivals = useRef(0);

  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => {
      const index = arrivals.current++;
      const template = INCOMING_TEMPLATES[index % INCOMING_TEMPLATES.length];
      const item = evaluateIncoming(template, config, new Date(), `TX-N${String(index + 1).padStart(3, "0")}`);
      setTransactions(current => [item, ...current].slice(0, MAX_ROWS));
      setFreshId(item.id);
    }, ARRIVAL_EVERY_MS);
    return () => clearInterval(timer);
  }, [live, config]);

  function saveConfig(next: DemoConfig) {
    setChanges(log => recordConfigChange(log, config, next, "Administrador (demo)", new Date()));
    setConfig(next);
  }

  const selected = transactions.find(item => item.id === selectedId) ?? null;
  const alerts = buildAlerts(transactions);
  const unread = alerts.filter(alert => !readIds.has(alert.id)).length;

  function markRead(ids: string[]) {
    setReadIds(current => new Set([...current, ...ids]));
  }

  function openTransaction(id: string) {
    setSelectedId(id);
    setTab("monitor");
  }

  return (
    <div className="demo">
      <header className="page-head">
        <div>
          <p className="eyebrow">Vista previa · datos ilustrativos</p>
          <h1>Próximas funciones de FraudLens</h1>
        </div>
        <p className="page-note">No llama a la API. Los umbrales son los de ejemplo del documento de requerimientos.</p>
      </header>

      <div className="demo-tabs" role="tablist" aria-label="Funciones en vista previa">
        {TABS.map(item => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`panel-${item.id}`}
            className="demo-tab"
            onClick={() => setTab(item.id)}
          >
            <span className="demo-tab-label">
              {item.label}
              {item.id === "alerts" && unread > 0 && <span className="count-badge" aria-label={`${unread} sin leer`}>{unread}</span>}
            </span>
            <span className="demo-tab-meta">{item.scope} · {item.stage}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "monitor" && (
          <div className="monitor-layout" data-detail={selected ? "open" : undefined}>
            <TransactionMonitor
              transactions={transactions}
              config={config}
              live={live}
              onToggleLive={() => setLive(value => !value)}
              freshId={freshId}
              selectedId={selectedId}
              onSelect={item => setSelectedId(item.id)}
            />
            {selected && <TransactionDetail item={selected} onClose={() => setSelectedId(null)} />}
          </div>
        )}
        {tab === "config" && <ConfigPanel config={config} changes={changes} onSave={saveConfig} />}
        {tab === "alerts" && <AlertsPanel alerts={alerts} readIds={readIds} onRead={markRead} onOpen={openTransaction} />}
      </div>
    </div>
  );
}
