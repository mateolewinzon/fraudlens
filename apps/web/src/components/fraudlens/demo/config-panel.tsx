"use client";

import { useState, type FormEvent } from "react";
import { formatDateTime } from "@/lib/client/presentation";
import { formatArs, validateConfig, type ConfigChange, type DemoConfig } from "@/lib/demo/rules";

type Props = {
  config: DemoConfig;
  changes: ConfigChange[];
  onSave: (config: DemoConfig) => void;
};

type Draft = { minAmountEnabled: boolean; minAmount: string; reviewThreshold: string; blockThreshold: string };

const toDraft = (config: DemoConfig): Draft => ({
  minAmountEnabled: config.minAmountEnabled,
  minAmount: String(config.minAmount),
  reviewThreshold: String(config.reviewThreshold),
  blockThreshold: String(config.blockThreshold),
});

const toConfig = (draft: Draft): DemoConfig => ({
  minAmountEnabled: draft.minAmountEnabled,
  minAmount: draft.minAmount.trim() === "" ? Number.NaN : Number(draft.minAmount),
  reviewThreshold: draft.reviewThreshold.trim() === "" ? Number.NaN : Number(draft.reviewThreshold),
  blockThreshold: draft.blockThreshold.trim() === "" ? Number.NaN : Number(draft.blockThreshold),
});

/** Section 6 bands as they would look with the draft thresholds. */
function LevelBands({ config }: { config: DemoConfig }) {
  const review = Math.min(100, Math.max(0, config.reviewThreshold || 0));
  const block = Math.min(100, Math.max(review, config.blockThreshold || 0));
  const medium = Math.min(40, review);
  const bands = [
    { level: "low", label: "Bajo · aprobar", from: 0, to: medium },
    { level: "medium", label: "Medio · aprobar", from: medium, to: review },
    { level: "high", label: "Alto · revisar", from: review, to: block },
    { level: "critical", label: "Crítico · bloquear", from: block, to: 100 },
  ].filter(band => band.to > band.from);
  return (
    <figure className="bands">
      <div className="bands-track">
        {bands.map(band => (
          <span key={band.level} className={`band level-${band.level}`} style={{ flexGrow: band.to - band.from }} title={`${band.label}: ${band.from} a ${band.to}`}>
            {band.to - band.from >= 12 ? band.label : ""}
          </span>
        ))}
      </div>
      <figcaption className="bands-scale" aria-label={`Bajo hasta ${medium}, medio hasta ${review}, alto hasta ${block}, crítico hasta 100`}>
        {[...new Set([0, medium, review, block, 100])].map(mark => (
          <span key={mark} style={{ insetInlineStart: `${mark}%` }}>{mark}</span>
        ))}
      </figcaption>
    </figure>
  );
}

export default function ConfigPanel({ config, changes, onSave }: Props) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(config));
  const [saved, setSaved] = useState(false);
  const candidate = toConfig(draft);
  const errors = validateConfig(candidate);
  const invalid = Object.keys(errors).length > 0;

  function update(patch: Partial<Draft>) {
    setDraft(current => ({ ...current, ...patch }));
    setSaved(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (invalid) return;
    onSave(candidate);
    setSaved(true);
  }

  const numberField = (name: "minAmount" | "reviewThreshold" | "blockThreshold", label: string, disabled = false) => (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        type="number" inputMode="numeric" value={draft[name]} disabled={disabled}
        onChange={event => update({ [name]: event.target.value })}
        aria-invalid={!disabled && errors[name] ? true : undefined}
        aria-describedby={errors[name] ? `${name}-config-error` : undefined}
      />
      {!disabled && errors[name] && <span className="field-error" id={`${name}-config-error`}>{errors[name]}</span>}
    </label>
  );

  return (
    <div className="config-layout">
      <section className="panel config" aria-labelledby="config-title">
        <h2 id="config-title" className="panel-title">Reglas y umbrales</h2>
        <p className="config-note">
          En el MVP esta configuración es fija y se carga al iniciar (decisión 0005). Esta pantalla muestra cómo se administraría después: solo un administrador podría cambiarla.
        </p>
        <form className="config-form" onSubmit={submit}>
          <fieldset className="config-group">
            <legend className="field-legend">Regla de monto mínimo (CU-02)</legend>
            <label className="switch">
              <input type="checkbox" checked={draft.minAmountEnabled} onChange={event => update({ minAmountEnabled: event.target.checked })} />
              <span>{draft.minAmountEnabled ? "Activa: debajo de este monto se aprueba sin ejecutar el modelo" : "Desactivada: se analizan todas las operaciones"}</span>
            </label>
            {numberField("minAmount", "Monto mínimo de análisis (ARS)", !draft.minAmountEnabled)}
          </fieldset>
          <fieldset className="config-group">
            <legend className="field-legend">Umbrales de decisión (CU-04)</legend>
            <div className="form-grid">
              {numberField("reviewThreshold", "Revisar desde")}
              {numberField("blockThreshold", "Bloquear desde")}
            </div>
            <LevelBands config={candidate} />
          </fieldset>
          <div className="config-actions">
            <p className="muted" role="status">{saved ? "Guardada. Se aplica solo a las transacciones nuevas." : "Los cambios se aplican solo a evaluaciones nuevas."}</p>
            <button className="button button-primary" type="submit" disabled={invalid}>Guardar configuración</button>
          </div>
        </form>
      </section>

      <section className="panel config-log" aria-labelledby="log-title">
        <h2 id="log-title" className="panel-title">Historial de cambios</h2>
        {changes.length === 0 ? (
          <p className="muted">Sin cambios. Vigente: configuración de ejemplo del documento de requerimientos.</p>
        ) : (
          <ol className="log-list">
            {changes.map(change => (
              <li key={change.at}>
                <p><b>{change.author}</b> · {formatDateTime(change.at)}</p>
                <p className="muted">
                  Antes: mínimo {change.previous.minAmountEnabled ? formatArs(change.previous.minAmount) : "desactivado"}, revisar {change.previous.reviewThreshold}, bloquear {change.previous.blockThreshold}
                </p>
                <p>
                  Después: mínimo {change.next.minAmountEnabled ? formatArs(change.next.minAmount) : "desactivado"}, revisar {change.next.reviewThreshold}, bloquear {change.next.blockThreshold}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
