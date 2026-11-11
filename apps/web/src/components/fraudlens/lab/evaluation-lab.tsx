"use client";

import { useState } from "react";
import Link from "next/link";
import { createMockApi } from "@/lib/client/mock-api";
import {
  ApiError, realEvaluationApi, toTransactionInput,
  type EvaluationForm as FormValues,
} from "@/lib/client/transaction-evaluations";
import { buildScenarioForm, localDateTimeValue, randomId, type TestScenario } from "@/lib/client/scenarios";
import EvaluationForm from "./evaluation-form";
import EvaluationReport, { type Analysis } from "./evaluation-report";
import HistoryTable from "./history-table";
import ScenarioPicker from "./scenario-picker";

// Empty id and date are filled on submit, so server and client render the same markup.
const emptyForm = (): FormValues => ({
  transaction_id: "", user_id: "", transaction_datetime: "",
  amount: "", currency: "ARS", merchant: "", country: "AR", card_country: "AR",
  cardholder_present: "true", card_present: "true",
});

export default function EvaluationLab({ simulated = false }: { simulated?: boolean }) {
  // One simulated store per page visit; reloading starts again from the seeded history.
  const [api] = useState(() => (simulated ? createMockApi() : realEvaluationApi));
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [scenarioId, setScenarioId] = useState<TestScenario["id"] | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [analysis, setAnalysis] = useState<Analysis>({ state: "idle" });
  const [refreshKey, setRefreshKey] = useState(0);

  function applyScenario(scenario: TestScenario) {
    setScenarioId(scenario.id);
    setForm(buildScenarioForm(scenario, new Date()));
    setError(null);
  }

  function changeField(name: keyof FormValues, value: string) {
    setScenarioId(null);
    setForm(current => ({ ...current, [name]: value }));
  }

  async function submit() {
    setError(null);
    setAnalysis({ state: "running" });
    try {
      const input = toTransactionInput({
        ...form,
        transaction_id: form.transaction_id.trim() || `TX-${randomId()}`,
        transaction_datetime: form.transaction_datetime || localDateTimeValue(new Date()),
      });
      const result = await api.create(input);
      const now = new Date().toISOString();
      setAnalysis({ state: "done", source: "new", evaluation: { ...input, ...result, created_at: now, updated_at: now } });
      // Clearing id and date makes "send again" create a new transaction at the current time.
      setForm(current => ({ ...current, transaction_id: "", transaction_datetime: "" }));
      setRefreshKey(key => key + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error("No se pudo evaluar la transacción."));
      setAnalysis({ state: "idle" });
    }
  }

  const selectedId = analysis.state === "done" ? analysis.evaluation.transaction_evaluation_id : null;

  return (
    <div className="lab">
      <header className="page-head">
        <div>
          <p className="eyebrow">{simulated ? "Laboratorio · API simulada" : "Laboratorio · API real"}</p>
          <h1>Probar evaluación de transacciones</h1>
        </div>
        <p className="page-note">
          {simulated
            ? "Simulación en el navegador: sin base de datos ni IA. Las decisiones son de ejemplo."
            : "Cada envío llama al modelo de IA y se guarda en la base."}{" "}
          <Link href={simulated ? "/" : "/?api=simulada"}>{simulated ? "Usar API real" : "Usar API simulada"}</Link>
        </p>
      </header>
      <div className="lab-grid">
        <section className="panel compose" aria-labelledby="compose-title">
          <h2 id="compose-title" className="panel-title">Nueva transacción</h2>
          <ScenarioPicker selectedId={scenarioId} onSelect={applyScenario} disabled={analysis.state === "running"} />
          <EvaluationForm
            form={form}
            onChange={changeField}
            onSubmit={submit}
            submitting={analysis.state === "running"}
            error={error}
          />
        </section>
        <div className="output">
          <EvaluationReport analysis={analysis} onClose={() => setAnalysis({ state: "idle" })} />
          <HistoryTable
            api={api}
            refreshKey={refreshKey}
            selectedId={selectedId}
            onSelect={evaluation => setAnalysis({ state: "done", source: "history", evaluation })}
          />
        </div>
      </div>
    </div>
  );
}
