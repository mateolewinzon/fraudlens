"use client";

import { useEffect, useState } from "react";
import { formatMoney, formatRiskScore, formatShortDateTime } from "@/lib/client/presentation";
import { getTransactionEvaluations, type EvaluationPage, type TransactionEvaluation } from "@/lib/client/transaction-evaluations";
import { DecisionBadge } from "./evaluation-report";

const PAGE_SIZE = 8;

type Props = {
  refreshKey: number;
  selectedId: string | null;
  onSelect: (evaluation: TransactionEvaluation) => void;
};

type Load = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; page: EvaluationPage };

export default function HistoryTable({ refreshKey, selectedId, onSelect }: Props) {
  const [offset, setOffset] = useState(0);
  const [reload, setReload] = useState(0);
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [seenRefresh, setSeenRefresh] = useState(refreshKey);

  // A new evaluation always appears first: go back to the first page.
  if (seenRefresh !== refreshKey) {
    setSeenRefresh(refreshKey);
    setOffset(0);
  }

  useEffect(() => {
    const controller = new AbortController();
    getTransactionEvaluations(offset, PAGE_SIZE, controller.signal)
      .then(page => setLoad({ state: "ready", page }))
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setLoad({ state: "error", message: cause instanceof Error ? cause.message : "No se pudo cargar el historial." });
        }
      });
    return () => controller.abort();
  }, [offset, reload, refreshKey]);

  const page = load.state === "ready" ? load.page : null;

  return (
    <section className="panel history" aria-labelledby="history-title">
      <header className="history-head">
        <h2 id="history-title" className="panel-title">Historial de evaluaciones</h2>
        <button className="button button-ghost" type="button" onClick={() => setReload(value => value + 1)}>Actualizar</button>
      </header>

      {load.state === "loading" && <div className="skeleton skeleton-table" aria-label="Cargando historial"><span /><span /><span /><span /></div>}
      {load.state === "error" && (
        <div className="inline-error" role="alert">
          <span>{load.message}</span>
          <button className="text-button" type="button" onClick={() => setReload(value => value + 1)}>Reintentar</button>
        </div>
      )}
      {page && page.items.length === 0 && (
        <div className="history-empty">
          <p className="report-empty-title">Todavía no hay evaluaciones</p>
          <p>Probá con <b>Compra habitual</b> un par de veces: así el usuario de prueba acumula historial y las siguientes evaluaciones tienen con qué compararse.</p>
        </div>
      )}
      {page && page.items.length > 0 && (
        <>
          <div className="table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th scope="col">Transacción</th>
                  <th scope="col" className="col-merchant">Comercio</th>
                  <th scope="col" className="num">Monto</th>
                  <th scope="col" className="num">Riesgo</th>
                  <th scope="col">Decisión</th>
                  <th scope="col" className="col-date">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map(item => (
                  <tr key={item.transaction_evaluation_id} aria-current={item.transaction_evaluation_id === selectedId || undefined}>
                    <td>
                      <button className="row-open" type="button" onClick={() => onSelect(item)} aria-label={`Ver detalle de ${item.transaction_id}`}>
                        <span className="mono">{item.transaction_id}</span>
                        <span className="row-user">{item.user_id}</span>
                      </button>
                    </td>
                    <td className="col-merchant">{item.merchant}</td>
                    <td className="num">{formatMoney(item.amount, item.currency)}</td>
                    <td className="num mono">{formatRiskScore(item.risk_score)}</td>
                    <td><DecisionBadge decision={item.decision} /></td>
                    <td className="col-date">{formatShortDateTime(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="pagination">
            <span>{page.offset + 1}–{page.offset + page.items.length}</span>
            <div className="pagination-actions">
              <button className="button button-ghost" type="button" disabled={page.offset === 0} onClick={() => setOffset(Math.max(0, page.offset - page.limit))}>Anterior</button>
              <button className="button button-ghost" type="button" disabled={!page.has_more} onClick={() => setOffset(page.offset + page.limit)}>Siguiente</button>
            </div>
          </footer>
        </>
      )}
    </section>
  );
}
