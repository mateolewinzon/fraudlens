import {
  decisionLabel, formatDateTime, formatMoney, formatRiskScore, signalLabel,
} from "@/lib/client/presentation";
import type { TransactionEvaluation } from "@/lib/client/transaction-evaluations";

export type Analysis =
  | { state: "idle" }
  | { state: "running" }
  | { state: "done"; evaluation: TransactionEvaluation; source: "new" | "history" };

const yesNo = (value: boolean) => (value ? "Sí" : "No");

export function DecisionBadge({ decision }: { decision: string }) {
  return <span className={`decision decision-${decision.toLowerCase()}`}>{decisionLabel(decision)}</span>;
}

export function RiskMeter({ score }: { score: number }) {
  return (
    <div className="risk">
      <div className="risk-head">
        <span className="risk-label">Puntaje de riesgo</span>
        <span className="risk-value">{formatRiskScore(score)}<span className="risk-max"> / 1</span></span>
      </div>
      <div className="risk-track" role="meter" aria-valuemin={0} aria-valuemax={1} aria-valuenow={score} aria-label="Puntaje de riesgo">
        <span className="risk-fill" style={{ inlineSize: `${Math.min(1, Math.max(0, score)) * 100}%` }} />
      </div>
      <p className="risk-note">Estimación del modelo, no una probabilidad calibrada.</p>
    </div>
  );
}

export default function EvaluationReport({ analysis, onClose }: { analysis: Analysis; onClose: () => void }) {
  if (analysis.state === "idle") {
    return (
      <section className="panel report report-empty" aria-label="Resultado del análisis">
        <p className="report-empty-title">El resultado del análisis aparece acá</p>
        <p>Elegí un escenario o completá el formulario y tocá <b>Evaluar transacción</b>. También podés abrir cualquier fila del historial.</p>
      </section>
    );
  }

  if (analysis.state === "running") {
    return (
      <section className="panel report report-running" aria-live="polite" aria-busy="true" aria-label="Resultado del análisis">
        <p className="report-empty-title">Analizando con IA…</p>
        <p>El modelo compara la operación con el historial aprobado del usuario. Puede tardar unos segundos.</p>
        <div className="skeleton" aria-hidden="true"><span /><span /><span /></div>
      </section>
    );
  }

  const item = analysis.evaluation;
  const decision = item.decision.toLowerCase();
  return (
    <section className={`panel report report-${decision}`} aria-live="polite" aria-labelledby="report-title">
      <header className="report-head">
        <div>
          <p className="eyebrow">{analysis.source === "new" ? "Resultado recién evaluado" : "Detalle del historial"}</p>
          <h2 id="report-title" className="report-title">
            <DecisionBadge decision={item.decision} />
            <span className="mono">{item.transaction_id}</span>
          </h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar resultado">×</button>
      </header>

      <div className="report-body">
        <RiskMeter score={item.risk_score} />
        <div className="report-reasons">
          <h3 className="sub-title">Motivos</h3>
          {item.reasons?.length ? <ul>{item.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul> : <p className="muted">Sin motivos registrados.</p>}
          <h3 className="sub-title">Señales</h3>
          {item.signals?.length
            ? <ul className="chips">{item.signals.map(signal => <li key={signal} className="chip">{signalLabel(signal)}</li>)}</ul>
            : <p className="muted">El modelo no marcó señales.</p>}
        </div>
      </div>

      <details className="report-data">
        <summary>Datos de la operación y del análisis</summary>
        <dl className="data-grid">
          <div><dt>Usuario</dt><dd className="mono">{item.user_id}</dd></div>
          <div><dt>Monto</dt><dd>{formatMoney(item.amount, item.currency)}</dd></div>
          <div><dt>Comercio</dt><dd>{item.merchant}</dd></div>
          <div><dt>Fecha de la operación</dt><dd>{formatDateTime(item.transaction_datetime)}</dd></div>
          <div><dt>País de la operación / tarjeta</dt><dd>{item.country} / {item.card_country}</dd></div>
          <div><dt>Titular / tarjeta presente</dt><dd>{yesNo(item.cardholder_present)} / {yesNo(item.card_present)}</dd></div>
          <div><dt>Historial usado</dt><dd>{item.history_count ?? "Sin dato"} {item.history_count === 1 ? "compra aprobada" : "compras aprobadas"}</dd></div>
          <div><dt>Reglas aplicadas</dt><dd>{item.rules_applied?.length ? item.rules_applied.join(", ") : "Ninguna configurada"}</dd></div>
          <div><dt>Modelo</dt><dd className="mono">{item.model_id ?? "Sin dato"}</dd></div>
          <div><dt>Versión de evaluación</dt><dd className="mono">{item.assessment_version ?? "Sin dato"}</dd></div>
          <div><dt>Analizada</dt><dd>{formatDateTime(item.created_at)}</dd></div>
          <div><dt>ID de evaluación</dt><dd className="mono">{item.transaction_evaluation_id}</dd></div>
        </dl>
      </details>
    </section>
  );
}
