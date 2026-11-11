"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/client/presentation";
import type { DemoAlert } from "@/lib/demo/rules";

type Props = {
  alerts: DemoAlert[];
  readIds: ReadonlySet<string>;
  onRead: (ids: string[]) => void;
  onOpen: (transactionId: string) => void;
};

const CHANNELS = [
  { id: "screen", label: "En pantalla" },
  { id: "email", label: "Correo" },
  { id: "chat", label: "Mensajería (Slack o Teams)" },
] as const;

export default function AlertsPanel({ alerts, readIds, onRead, onOpen }: Props) {
  const [channels, setChannels] = useState<Record<string, boolean>>({ screen: true, email: false, chat: false });
  const unread = alerts.filter(alert => !readIds.has(alert.id));

  return (
    <div className="config-layout">
      <section className="panel alerts" aria-labelledby="alerts-title">
        <header className="history-head alerts-head">
          <h2 id="alerts-title" className="panel-title">Alertas para el analista</h2>
          <button type="button" className="button button-ghost" disabled={unread.length === 0} onClick={() => onRead(unread.map(alert => alert.id))}>
            Marcar todas como leídas
          </button>
        </header>
        <p className="config-note alerts-note">
          Función futura, fuera del alcance del MVP (MoSCoW: <i>Won&apos;t</i>). Muestra cómo se avisaría en tiempo real cada transacción para revisar o bloquear.
        </p>
        {alerts.length === 0 ? (
          <p className="muted alerts-empty">Sin alertas: todas las transacciones fueron aprobadas.</p>
        ) : (
          <ul className="alert-list">
            {alerts.map(alert => {
              const read = readIds.has(alert.id);
              return (
                <li key={alert.id} className="alert" data-severity={alert.severity.toLowerCase()} data-read={read || undefined}>
                  <span className="alert-mark" aria-hidden="true">{alert.severity === "BLOCK" ? "!" : "?"}</span>
                  <div className="alert-body">
                    <p className="alert-title">{alert.title}{!read && <span className="sr-only"> (sin leer)</span>}</p>
                    <p className="muted">{alert.detail}</p>
                    <p className="alert-time">{formatDateTime(alert.at)}</p>
                  </div>
                  <div className="alert-actions">
                    <button type="button" className="button button-ghost" onClick={() => { onRead([alert.id]); onOpen(alert.transactionId); }}>Ver en monitor</button>
                    {!read && <button type="button" className="text-button" onClick={() => onRead([alert.id])}>Marcar leída</button>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="panel config-log" aria-labelledby="channels-title">
        <h2 id="channels-title" className="panel-title">Canales de aviso</h2>
        <p className="muted">Ilustrativo: no se envía nada.</p>
        {CHANNELS.map(channel => (
          <label key={channel.id} className="switch">
            <input type="checkbox" checked={channels[channel.id]} onChange={event => setChannels(current => ({ ...current, [channel.id]: event.target.checked }))} />
            <span>{channel.label}</span>
          </label>
        ))}
      </section>
    </div>
  );
}
