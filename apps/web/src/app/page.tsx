import AppShell, { type AppMode } from "@/components/fraudlens/app-shell";
import DemoWorkspace from "@/components/fraudlens/demo/demo-workspace";
import EvaluationLab from "@/components/fraudlens/lab/evaluation-lab";

export default async function Home({ searchParams }: PageProps<"/">) {
  const mode: AppMode = (await searchParams).modo === "demo" ? "demo" : "lab";
  return (
    <AppShell mode={mode}>
      {mode === "demo" ? <DemoWorkspace /> : <EvaluationLab />}
    </AppShell>
  );
}
