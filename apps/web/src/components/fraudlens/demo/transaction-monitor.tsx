"use client";

import { useState } from "react";
import { formatShortDateTime } from "@/lib/client/presentation";
import {
  DECISION_LABELS, LEVEL_LABELS, STATUS_LABELS, formatArs, riskLevel, sortTransactions,
  type DemoConfig, type DemoTransaction, type SortDirection, type SortKey,
} from "@/lib/demo/rules";

type Props = {
  transactions: DemoTransaction[];
  config: DemoConfig;
  live: boolean;
  onToggleLive: () => void;
  freshId: string | null;
};

export function LevelBadge({ item }: { item: DemoTransaction }) {
  if (item.score === null) return <span className="level level-none">Sin análisis</span>;
  const level = riskLevel(item.score, item.config);
  return <span className={`level level-${level.toLowerCase()}`}>{LEVEL_LABELS[level]}</span>;
}

export function DemoDecisionBadge({ item }: { item: DemoTransaction }) {
  return <span className={`decision demo-decision-${item.decision.toLowerCase()}`}>{DECISION_LABELS[item.decision]}</span>;
}

type SortState = { key: SortKey; direction: SortDirection };

function SortHeader({ sortKey, label, className, sort, onSort }: {
  sortKey: SortKey; label: string; className?: string; sort: SortState; onSort: (key: SortKey) => void;
}) {
  const active = sort.key === sortKey;
  return (
    <th scope="col" className={className} aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" className="sort-button" onClick={() => onSort(sortKey)}>
        {label}<span aria-hidden="true">{active ? (sort.direction === "asc" ? " ↑" : " ↓") : " ↕"}</span>
      </button>
    </th>
  );
}

export default function TransactionMonitor({ transactions, config, live, onToggleLive, freshId }: Props) {
  const [sort, setSort] = useState<SortState>({ key: "date", direction: "desc" });
  const rows = sortTransactions(transactions, sort.key, sort.direction);

  function toggleSort(key: SortKey) {
    setSort(current => ({ key, direction: current.key === key && current.direction === "desc" ? "asc" : "desc" }));
  }

  const flagged = transactions.filter(item => item.decision !== "APPROVE").length;

  return (
    <section className="panel monitor" aria-labelledby="monitor-title">
      <header className="history-head">
        <div>
          <h2 id="monitor-title" className="panel-title">Transacciones analizadas</h2>
          <p className="monitor-summary">{transactions.length} transacciones · {flagged} para revisar o bloquear · revisar desde {config.reviewThreshold}, bloquear desde {config.blockThreshold}</p>
        </div>
        <button type="button" className="button button-ghost live-toggle" aria-pressed={live} onClick={onToggleLive}>
          <span className="live-dot" aria-hidden="true" />{live ? "En vivo" : "Pausado"}
        </button>
      </header>
      <div className="table-wrap">
        <table className="history-table monitor-table">
          <thead>
            <tr>
              <SortHeader sortKey="date" label="Fecha" className="col-date" sort={sort} onSort={toggleSort} />
              <th scope="col">Transacción</th>
              <th scope="col" className="num">Monto</th>
              <SortHeader sortKey="risk" label="Puntaje" className="num" sort={sort} onSort={toggleSort} />
              <th scope="col">Nivel</th>
              <th scope="col">Decisión</th>
              <th scope="col" className="col-status">Estado</th>
            </tr>
          </thead>
          <tbody aria-live="polite">
            {rows.map(item => (
              <tr key={item.id} data-decision={item.decision.toLowerCase()} data-fresh={item.id === freshId || undefined}>
                <td className="col-date">{formatShortDateTime(item.datetime)}</td>
                <td>
                  <span className="row-open-static">
                    <span className="mono">{item.id}</span>
                    <span className="row-user">{item.userId}</span>
                  </span>
                </td>
                <td className="num">{formatArs(item.amount)}</td>
                <td className="num mono">{item.score ?? <span className="muted">s/d</span>}</td>
                <td><LevelBadge item={item} /></td>
                <td><DemoDecisionBadge item={item} /></td>
                <td className="col-status">{STATUS_LABELS[item.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
