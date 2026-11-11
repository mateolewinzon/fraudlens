import { DECISION_LABELS, EMPTY_FILTERS, LEVEL_LABELS, type DemoDecision, type DemoFilters, type RiskLevel } from "@/lib/demo/rules";

type Props = { filters: DemoFilters; onChange: (filters: DemoFilters) => void };

const LEVELS = Object.entries(LEVEL_LABELS) as [RiskLevel, string][];
const DECISIONS = Object.entries(DECISION_LABELS) as [DemoDecision, string][];

export default function MonitorFilters({ filters, onChange }: Props) {
  const set = <K extends keyof DemoFilters>(key: K, value: DemoFilters[K]) => onChange({ ...filters, [key]: value });
  const active = Object.values(filters).some(Boolean);
  return (
    <form className="filters" role="search" aria-label="Filtrar transacciones" onSubmit={event => event.preventDefault()}>
      <label className="field">
        <span className="field-label">Transacción</span>
        <input value={filters.transactionId} onChange={event => set("transactionId", event.target.value)} placeholder="TX-…" />
      </label>
      <label className="field">
        <span className="field-label">Usuario</span>
        <input value={filters.userId} onChange={event => set("userId", event.target.value)} placeholder="usr-…" />
      </label>
      <label className="field">
        <span className="field-label">Desde</span>
        <input type="date" value={filters.from} onChange={event => set("from", event.target.value)} />
      </label>
      <label className="field">
        <span className="field-label">Hasta</span>
        <input type="date" value={filters.to} onChange={event => set("to", event.target.value)} />
      </label>
      <label className="field">
        <span className="field-label">Nivel</span>
        <select value={filters.level} onChange={event => set("level", event.target.value as DemoFilters["level"])}>
          <option value="">Todos</option>
          {LEVELS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          <option value="NONE">Sin análisis</option>
        </select>
      </label>
      <label className="field">
        <span className="field-label">Decisión</span>
        <select value={filters.decision} onChange={event => set("decision", event.target.value as DemoFilters["decision"])}>
          <option value="">Todas</option>
          {DECISIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <button type="button" className="button button-ghost filters-clear" disabled={!active} onClick={() => onChange(EMPTY_FILTERS)}>
        Limpiar
      </button>
    </form>
  );
}
