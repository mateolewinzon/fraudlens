import { formatDateTime } from "@/lib/client/presentation";
import { formatArs, type DemoTransaction } from "@/lib/demo/rules";
import { DemoDecisionBadge, LevelBadge } from "./transaction-monitor";

/** CU-06: everything the analyst needs to understand one decision, including the config used. */
export default function TransactionDetail({ item, onClose }: { item: DemoTransaction; onClose: () => void }) {
  const { config, history } = item;
  return (
    <aside className="panel detail" aria-labelledby="detail-title">
      <header className="report-head">
        <div>
          <p className="eyebrow">Detalle · CU-06</p>
          <h2 id="detail-title" className="report-title"><span className="mono">{item.id}</span><DemoDecisionBadge item={item} /></h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar detalle">×</button>
      </header>

      <div className="detail-score">
        <span className="risk-value">{item.score ?? "s/d"}{item.score !== null && <span className="risk-max"> / 100</span>}</span>
        <LevelBadge item={item} />
      </div>
      <p className="detail-rule"><b>Regla aplicada:</b> {item.rule}</p>

      <h3 className="sub-title">Factores que elevaron el riesgo</h3>
      {item.factors.length
        ? <ul className="chips">{item.factors.map(factor => <li key={factor} className="chip">{factor}</li>)}</ul>
        : <p className="muted">{item.status === "RULE_APPROVED" ? "El modelo no se ejecutó." : "Ninguno relevante."}</p>}

      <h3 className="sub-title">Datos recibidos</h3>
      <dl className="data-grid">
        <div><dt>Usuario</dt><dd className="mono">{item.userId}</dd></div>
        <div><dt>Monto</dt><dd>{formatArs(item.amount)}</dd></div>
        <div><dt>Comercio</dt><dd>{item.merchant}</dd></div>
        <div><dt>País operación / tarjeta</dt><dd>{item.country} / {item.cardCountry}</dd></div>
        <div><dt>Fecha de la operación</dt><dd>{formatDateTime(item.datetime)}</dd></div>
        <div><dt>Analizada</dt><dd>{formatDateTime(item.analyzedAt)}</dd></div>
      </dl>

      <h3 className="sub-title">Historial del usuario</h3>
      <p>
        {history.count === 0
          ? "Historial insuficiente: sin compras previas."
          : `${history.count} compras, promedio ${history.averageAmount === null ? "s/d" : formatArs(history.averageAmount)}. Comercios habituales: ${history.usualMerchants.join(", ") || "s/d"}.`}
      </p>

      <h3 className="sub-title">Configuración vigente al analizarla</h3>
      <dl className="data-grid">
        <div><dt>Monto mínimo</dt><dd>{config.minAmountEnabled ? formatArs(config.minAmount) : "Regla desactivada"}</dd></div>
        <div><dt>Revisar desde</dt><dd>{config.reviewThreshold}</dd></div>
        <div><dt>Bloquear desde</dt><dd>{config.blockThreshold}</dd></div>
      </dl>
    </aside>
  );
}
