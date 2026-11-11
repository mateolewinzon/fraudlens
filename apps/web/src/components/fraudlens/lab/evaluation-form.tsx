import type { FormEvent } from "react";
import { fieldErrorMessage } from "@/lib/client/presentation";
import { ApiError, type EvaluationForm as FormValues } from "@/lib/client/transaction-evaluations";

type FieldName = keyof FormValues;

type Props = {
  form: FormValues;
  onChange: (name: FieldName, value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: Error | null;
};

type InputProps = {
  name: FieldName;
  label: string;
  form: FormValues;
  fieldErrors: Record<string, string>;
  onChange: Props["onChange"];
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "value" | "onChange" | "form">;

function Field({ name, label, form, fieldErrors, onChange, className, ...input }: InputProps) {
  const invalid = name in fieldErrors;
  const errorId = `${name}-error`;
  return (
    <label className={`field ${className ?? ""}`}>
      <span className="field-label">{label}</span>
      <input
        {...input}
        name={name}
        value={form[name]}
        onChange={event => onChange(name, event.target.value)}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
      />
      {invalid && <span className="field-error" id={errorId}>{fieldErrorMessage(name)}</span>}
    </label>
  );
}

function YesNo({ name, label, form, onChange }: { name: "cardholder_present" | "card_present"; label: string; form: FormValues; onChange: Props["onChange"] }) {
  return (
    <fieldset className="field yes-no">
      <legend className="field-label">{label}</legend>
      <div className="segmented">
        {[["true", "Sí"], ["false", "No"]].map(([value, text]) => (
          <label key={value}>
            <input type="radio" name={name} value={value} checked={form[name] === value} onChange={() => onChange(name, value)} />
            <span>{text}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function EvaluationForm({ form, onChange, onSubmit, submitting, error }: Props) {
  const fieldErrors = error instanceof ApiError ? error.fields : {};
  const shared = { form, fieldErrors, onChange };
  const identityInvalid = ["transaction_id", "user_id", "transaction_datetime"].some(field => field in fieldErrors);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="eval-form" onSubmit={submit}>
      <fieldset className="form-body" disabled={submitting}>
        <div className="form-grid">
          <Field {...shared} name="amount" label="Monto" type="number" min={Number.MIN_VALUE} step="any" inputMode="decimal" required />
          <Field {...shared} name="currency" label="Moneda" minLength={3} maxLength={3} required className="field-short" />
          <Field {...shared} name="merchant" label="Comercio" required className="field-wide" />
          <Field {...shared} name="country" label="País de la operación" minLength={2} maxLength={2} required />
          <Field {...shared} name="card_country" label="País de la tarjeta" minLength={2} maxLength={2} required />
          <YesNo name="cardholder_present" label="Titular presente" form={form} onChange={onChange} />
          <YesNo name="card_present" label="Tarjeta presente" form={form} onChange={onChange} />
        </div>
        <details className="identity" open={identityInvalid || undefined}>
          <summary>
            <span>Identificadores y fecha</span>
            <span className="identity-summary">{form.user_id || "sin usuario"} · {form.transaction_id || "ID automático"}</span>
          </summary>
          <div className="form-grid">
            <Field {...shared} name="user_id" label="ID de usuario" required autoComplete="off" />
            <Field {...shared} name="transaction_id" label="ID de transacción" placeholder="Automático" autoComplete="off" />
            <Field {...shared} name="transaction_datetime" label="Fecha y hora (vacío: ahora)" type="datetime-local" className="field-wide" />
          </div>
        </details>
      </fieldset>
      <div className="form-actions">
        {error && <p className="form-error" role="alert">{error.message}</p>}
        <button className="button button-primary" type="submit" disabled={submitting}>
          {submitting ? "Analizando con IA…" : "Evaluar transacción"}
        </button>
      </div>
    </form>
  );
}
