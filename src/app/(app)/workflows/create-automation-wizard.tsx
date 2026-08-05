"use client";

import { useCallback, useRef, useState } from "react";
import { X } from "lucide-react";
import { addEdge, useEdgesState, useNodesState, type Connection, type Edge, type Node } from "@xyflow/react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import type { Agent, WorkflowSummary } from "@/lib/mock-data/types";
import { WizardRail, WIZARD_STEPS } from "./wizard-rail";
import { WizardStepBasics } from "./wizard-step-basics";
import { WizardStepAgents } from "./wizard-step-agents";
import { WizardStepBuild } from "./wizard-step-build";
import { WizardStepReview } from "./wizard-step-review";
import type { WizardBasics, WizardStepIndex } from "./wizard-types";

const INITIAL_NODES: Node[] = [
  { id: "1", position: { x: 0, y: 0 }, data: { label: "Trigger" }, type: "input" },
  { id: "2", position: { x: 0, y: 120 }, data: { label: "AI Decision" } },
  { id: "3", position: { x: 0, y: 240 }, data: { label: "API Call" } },
  { id: "4", position: { x: 0, y: 360 }, data: { label: "Approval" } },
  { id: "5", position: { x: 0, y: 480 }, data: { label: "Notification" } },
  { id: "6", position: { x: 0, y: 600 }, data: { label: "Task Completion" }, type: "output" },
];

const INITIAL_EDGES: Edge[] = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
  { id: "e3-4", source: "3", target: "4" },
  { id: "e4-5", source: "4", target: "5" },
  { id: "e5-6", source: "5", target: "6" },
];

export function CreateAutomationWizard({
  agents,
  onCreate,
  onClose,
}: {
  agents: Agent[];
  onCreate: (workflow: WorkflowSummary) => void;
  onClose: () => void;
}) {
  const [currentStep, setCurrentStep] = useState<WizardStepIndex>(1);
  const [maxReached, setMaxReached] = useState<WizardStepIndex>(1);

  const [basics, setBasics] = useState<WizardBasics>({ name: "", description: "", triggerType: "manual" });
  const [basicsError, setBasicsError] = useState<string | null>(null);

  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [agentsError, setAgentsError] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const nodeIdCounter = useRef(INITIAL_NODES.length + 1);

  const [activateNow, setActivateNow] = useState(false);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  function addNode(label: string) {
    const id = String(nodeIdCounter.current++);
    setNodes((nds) => [...nds, { id, position: { x: 260, y: Math.random() * 400 }, data: { label } }]);
  }

  function goToStep(step: WizardStepIndex) {
    if (step > maxReached) return;
    setCurrentStep(step);
  }

  function handleNext() {
    if (currentStep === 1) {
      const trimmed = basics.name.trim();
      if (!trimmed) {
        setBasicsError("Automation name is required.");
        toast.error("Couldn't continue", "Give your automation a name first.");
        return;
      }
      setBasicsError(null);
      setBasics((prev) => ({ ...prev, name: trimmed }));
    }

    if (currentStep === 2) {
      if (selectedAgentIds.length === 0) {
        setAgentsError("Choose at least one agent.");
        toast.error("Couldn't continue", "Assign at least one agent to this automation.");
        return;
      }
      setAgentsError(null);
    }

    const next = Math.min(currentStep + 1, WIZARD_STEPS.length) as WizardStepIndex;
    setCurrentStep(next);
    setMaxReached((prev) => (next > prev ? next : prev));
  }

  function handleBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as WizardStepIndex);
  }

  function handleCreate() {
    onCreate({
      id: crypto.randomUUID(),
      name: basics.name,
      status: activateNow ? "active" : "draft",
      lastRun: "",
      successRate: 0,
    });
    toast.success(
      activateNow ? "Automation activated" : "Automation saved as draft",
      `"${basics.name}" has been created.`,
    );
  }

  const selectedAgents = agents.filter((a) => selectedAgentIds.includes(a.id));
  const activeStepMeta = WIZARD_STEPS[currentStep - 1];

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background">
      <div className="flex items-center justify-between border-b bg-card px-6 py-4">
        <Breadcrumbs items={[{ label: "Workflows" }, { label: "Create Automation" }]} />
        <Button variant="ghost" size="icon" aria-label="Close wizard" onClick={onClose}>
          <X className="size-5" />
        </Button>
      </div>

      <div className="mx-auto flex w-full max-w-[1560px] flex-1 flex-col gap-6 p-6 pb-36 lg:flex-row">
        <WizardRail currentStep={currentStep} maxReached={maxReached} onStepClick={goToStep} />

        <div className="flex flex-1 flex-col rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-xs font-medium text-muted-foreground">
              Step {currentStep} of {WIZARD_STEPS.length}
            </p>
            <h2 className="text-lg font-semibold">{activeStepMeta.title}</h2>
          </div>

          <div className="flex-1">
            {currentStep === 1 && <WizardStepBasics value={basics} onChange={setBasics} error={basicsError} />}
            {currentStep === 2 && (
              <>
                <WizardStepAgents
                  agents={agents}
                  selectedIds={selectedAgentIds}
                  onChange={(ids) => {
                    setSelectedAgentIds(ids);
                    if (ids.length > 0) setAgentsError(null);
                  }}
                />
                {agentsError && <p className="mt-2 text-xs text-destructive">{agentsError}</p>}
              </>
            )}
            {currentStep === 3 && (
              <WizardStepBuild
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onAddNode={addNode}
              />
            )}
            {currentStep === 4 && (
              <WizardStepReview
                basics={basics}
                selectedAgents={selectedAgents}
                nodes={nodes}
                activateNow={activateNow}
                onActivateNowChange={setActivateNow}
              />
            )}
          </div>

          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              {currentStep > 1 && (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            {currentStep < WIZARD_STEPS.length ? (
              <Button onClick={handleNext}>Next</Button>
            ) : (
              <Button onClick={handleCreate}>Create Automation</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
