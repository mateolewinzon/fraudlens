"use client";

import { useEffect, useRef, useState } from "react";
import { DEMO_TRANSACTIONS, INCOMING_TEMPLATES } from "@/lib/demo/data";
import { EXAMPLE_CONFIG, evaluateIncoming, type DemoConfig, type DemoTransaction } from "@/lib/demo/rules";
import TransactionMonitor from "./transaction-monitor";

const ARRIVAL_EVERY_MS = 7000;
const MAX_ROWS = 40;

type TabId = "monitor";
const TABS: { id: TabId; label: string; scope: string; stage: string }[] = [
  { id: "monitor", label: "Monitor", scope: "CU-05", stage: "MVP" },
];

/** Preview mode: everything lives in client state and nothing calls the API. */
export default function DemoWorkspace() {
  const [tab, setTab] = useState<TabId>("monitor");
  const [config] = useState<DemoConfig>(EXAMPLE_CONFIG);
  const [transactions, setTransactions] = useState<DemoTransaction[]>([...DEMO_TRANSACTIONS]);
  const [live, setLive] = useState(true);
  const [freshId, setFreshId] = useState<string | null>(null);
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
            <span>{item.label}</span>
            <span className="demo-tab-meta">{item.scope} · {item.stage}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "monitor" && (
          <TransactionMonitor
            transactions={transactions}
            config={config}
            live={live}
            onToggleLive={() => setLive(value => !value)}
            freshId={freshId}
          />
        )}
      </div>
    </div>
  );
}
