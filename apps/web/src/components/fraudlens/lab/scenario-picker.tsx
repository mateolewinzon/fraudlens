import { TEST_SCENARIOS, type TestScenario } from "@/lib/client/scenarios";

type Props = {
  selectedId: TestScenario["id"] | null;
  onSelect: (scenario: TestScenario) => void;
  disabled: boolean;
};

export default function ScenarioPicker({ selectedId, onSelect, disabled }: Props) {
  const selected = TEST_SCENARIOS.find(scenario => scenario.id === selectedId);
  return (
    <fieldset className="scenarios" disabled={disabled}>
      <legend className="field-legend">Escenarios de prueba</legend>
      <div className="scenario-list">
        {TEST_SCENARIOS.map(scenario => (
          <button
            key={scenario.id}
            type="button"
            className="scenario"
            aria-pressed={scenario.id === selectedId}
            title={scenario.description}
            onClick={() => onSelect(scenario)}
          >
            {scenario.title}
          </button>
        ))}
      </div>
      <p className="scenario-hint" aria-live="polite">
        {selected ? selected.description : "Cargan datos de ejemplo en el formulario. La decisión siempre la toma el servidor."}
      </p>
    </fieldset>
  );
}
