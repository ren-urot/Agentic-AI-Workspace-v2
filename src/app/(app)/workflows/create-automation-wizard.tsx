"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

  const dialogRef = useRef<HTMLDivElement>(null);

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

  // Shared validation so a rail-jump back to an earlier step can't leave it in
  // an invalid state that then slips past both `handleNext` and `handleCreate`.
  function validateStep(step: WizardStepIndex): string | null {
    if (step === 1) {
      return basics.name.trim() ? null : "Automation name is required.";
    }
    if (step === 2) {
      return selectedAgentIds.length > 0 ? null : "Choose at least one agent.";
    }
    return null;
  }

  function handleNext() {
    const error = validateStep(currentStep);
    if (error) {
      if (currentStep === 1) {
        setBasicsError(error);
        toast.error("Couldn't continue", "Give your automation a name first.");
      } else if (currentStep === 2) {
        setAgentsError(error);
        toast.error("Couldn't continue", "Assign at least one agent to this automation.");
      }
      return;
    }

    if (currentStep === 1) {
      setBasicsError(null);
      setBasics((prev) => ({ ...prev, name: prev.name.trim() }));
    }
    if (currentStep === 2) {
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
    // The rail leaves steps 1-3 unlocked once reached, so a user can jump
    // back, invalidate a field, then jump forward to step 4 and submit.
    // Re-validate every earlier step here before actually creating anything.
    for (const step of [1, 2] as WizardStepIndex[]) {
      const error = validateStep(step);
      if (error) {
        if (step === 1) {
          setBasicsError(error);
          toast.error("Couldn't create automation", "Give your automation a name first.");
        } else {
          setAgentsError(error);
          toast.error("Couldn't create automation", "Assign at least one agent to this automation.");
        }
        setCurrentStep(step);
        return;
      }
    }

    const trimmedName = basics.name.trim();
    setBasics((prev) => ({ ...prev, name: trimmedName }));

    onCreate({
      id: crypto.randomUUID(),
      name: trimmedName,
      status: activateNow ? "active" : "draft",
      lastRun: "",
      successRate: 0,
    });
    toast.success(
      activateNow ? "Automation activated" : "Automation saved as draft",
      `"${trimmedName}" has been created.`,
    );
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      // Nested Base UI popups (e.g. the Trigger Type select on step 1) register
      // their own document-level Escape/dismiss listener only once they're open,
      // which means it's added *after* this one and therefore runs *after* it too
      // (same-phase listeners on the same target fire in registration order). If
      // we acted on this keydown synchronously, we'd close the whole wizard before
      // the popup ever got a chance to just close itself. Defer to the next tick
      // so that, by the time we check `defaultPrevented`, Base UI's own dismiss
      // handling (which calls `event.preventDefault()` when it closes on Escape)
      // has already run and we can back off.
      window.setTimeout(() => {
        if (event.defaultPrevented) return;
        onClose();
      }, 0);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const selectedAgents = agents.filter((a) => selectedAgentIds.includes(a.id));
  const activeStepMeta = WIZARD_STEPS[currentStep - 1];

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Create Automation"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background outline-none"
    >
      <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b bg-card px-6 py-4">
        <Breadcrumbs items={[{ label: "Workflows" }, { label: "Create Automation" }]} />
        <Button variant="ghost" size="icon" aria-label="Close wizard" onClick={onClose}>
          <X className="size-5" />
        </Button>
      </div>

      <div className="mx-auto flex w-full min-h-0 max-w-[1560px] flex-1 flex-col gap-6 p-6 pb-36 lg:flex-row">
        <WizardRail currentStep={currentStep} maxReached={maxReached} onStepClick={goToStep} />

        <div className="flex flex-col rounded-xl border bg-card p-6 shadow-sm lg:flex-1">
          <div className="mb-6">
            <p className="text-xs font-medium text-muted-foreground">
              Step {currentStep} of {WIZARD_STEPS.length}
            </p>
            <h2 className="text-lg font-semibold">{activeStepMeta.title}</h2>
          </div>

          <div>
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
                {agentsError && (
                  <p id="automation-agents-error" role="alert" className="mt-2 text-xs text-destructive">
                    {agentsError}
                  </p>
                )}
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
