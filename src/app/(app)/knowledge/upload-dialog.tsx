"use client";

import { useState } from "react";
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

export function UploadDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="h-auto p-4"><Upload className="mr-2 h-4 w-4" />Upload document</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a knowledge source</DialogTitle>
          <DialogDescription>Drop a file or connect a data source. It will enter the approval queue.</DialogDescription>
        </DialogHeader>
        <div className="flex h-32 items-center justify-center rounded-md border-2 border-dashed text-sm text-muted-foreground">
          Drag and drop a file here
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Add to queue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
