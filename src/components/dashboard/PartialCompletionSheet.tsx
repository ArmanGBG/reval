'use client';

import { Task } from '@/lib/types';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Target } from 'lucide-react';

interface PartialCompletionSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, actualTime: number, actualTests: number) => void;
}

export function PartialCompletionSheet({
  task,
  open,
  onOpenChange,
  onSave,
}: PartialCompletionSheetProps) {
  if (!task) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="surface-2 border-t border-[var(--border-strong)] text-[var(--foreground)] max-h-[70vh]">
        <DrawerHeader className="text-right">
          <DrawerTitle className="text-[var(--foreground)] text-sm">
            ثبت بخشی از تسک
          </DrawerTitle>
          <DrawerDescription className="text-[var(--foreground-muted)] text-xs">
            {task.subject} — {task.topic}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-[var(--foreground-muted)] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              زمان واقعی (دقیقه)
            </Label>
            <Input
              type="number"
              defaultValue={task.actualTimeMinutes ?? task.targetTimeMinutes ?? 0}
              id="partial-time"
              className="bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground)] text-right"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-[var(--foreground-muted)] flex items-center gap-1">
              <Target className="w-3 h-3" />
              تعداد تست واقعی
            </Label>
            <Input
              type="number"
              defaultValue={task.actualTestCount ?? task.targetTestCount ?? 0}
              id="partial-tests"
              className="bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground)] text-right"
              dir="ltr"
            />
          </div>
        </div>

        <DrawerFooter className="flex-row gap-2">
          <Button
            onClick={() => {
              const timeInput = document.getElementById('partial-time') as HTMLInputElement;
              const testInput = document.getElementById('partial-tests') as HTMLInputElement;
              onSave(task.id, Number(timeInput.value) || 0, Number(testInput.value) || 0);
            }}
            className="btn-hover glow-hover flex-1 bg-[var(--accent)] text-[var(--bg-deep)] hover:bg-[var(--accent-hover)] font-semibold h-11"
          >
            ذخیره
          </Button>
          <DrawerClose asChild>
            <Button
              variant="outline"
              className="btn-hover h-11 px-5 border border-[var(--border)] text-[var(--foreground-muted)]"
            >
              انصراف
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
