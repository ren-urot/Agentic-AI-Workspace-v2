"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";

export function UploadDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setError(null);
  }

  function handleSubmit() {
    if (!file) {
      setError("Choose a file to upload.");
      toast.error("Couldn't add to queue", "Choose a file to upload first.");
      return;
    }
    toast.success("Added to approval queue", file.name);
    setOpen(false);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button className="h-auto p-4"><Upload className="mr-2 h-4 w-4" />Upload document</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a knowledge source</DialogTitle>
          <DialogDescription>Drop a file or connect a data source. It will enter the approval queue.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-32 w-full items-center justify-center rounded-md border-2 border-dashed text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
            aria-invalid={error ? true : undefined}
          >
            {file ? file.name : "Click to choose a file, or drag and drop here"}
          </button>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              setFile(selected);
              if (selected) setError(null);
            }}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add to queue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
