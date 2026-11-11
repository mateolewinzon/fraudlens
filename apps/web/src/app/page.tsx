import AppShell, { type AppMode } from "@/components/fraudlens/app-shell";
import DemoWorkspace from "@/components/fraudlens/demo/demo-workspace";
import EvaluationLab from "@/components/fraudlens/lab/evaluation-lab";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const mode: AppMode = params.modo === "demo" ? "demo" : "lab";
  const simulated = params.api === "simulada";
  return (
    <AppShell mode={mode} simulated={simulated}>
      {mode === "demo" ? <DemoWorkspace /> : <EvaluationLab key={simulated ? "simulated" : "real"} simulated={simulated} />}
    </AppShell>
  );
}
