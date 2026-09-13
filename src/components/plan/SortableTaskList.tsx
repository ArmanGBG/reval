'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AnimatePresence } from 'framer-motion';
import { Task } from '@/lib/types';
import TaskCard, { type TaskCardCapabilities } from './TaskCard';

interface SortableTaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onDelete: (id: string) => void;
  onAction: (id: string) => void;
  onSettings: (id: string) => void;
  onReset: (id: string) => void;
  onReorder: (tasks: Task[]) => void;
  onEdit?: (id: string) => void;
  /** Open the class-homework dialog for a class task (create/view its homework). */
  onHomework?: (id: string) => void;
  getCapabilities?: (task: Task) => TaskCardCapabilities;
  sortable?: boolean;
  /**
   * Non-sortable cards interleaved between task cards (e.g. non-study
   * activities). `index` is the insertion position among the task cards
   * (0..tasks.length); cards sharing an index keep their given order.
   * Drag-and-drop still operates on tasks only.
   */
  extras?: Array<{ key: string; index: number; node: React.ReactNode }>;
}

// ===== Sortable wrapper for each task card =====
function SortableTaskCard({
  task,
  index,
  onComplete,
  onSkip,
  onDelete,
  onAction,
  onSettings,
  onReset,
  onEdit,
  onHomework,
  capabilities,
  sortable,
}: {
  task: Task;
  index: number;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onDelete: (id: string) => void;
  onAction: (id: string) => void;
  onSettings: (id: string) => void;
  onReset: (id: string) => void;
  onEdit?: (id: string) => void;
  onHomework?: (id: string) => void;
  capabilities?: TaskCardCapabilities;
  sortable: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !sortable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCard
        task={task}
        index={index}
        onComplete={onComplete}
        onSkip={onSkip}
        onDelete={onDelete}
        onAction={onAction}
        onSettings={onSettings}
        onReset={onReset}
        onEdit={onEdit}
        onHomework={onHomework}
        capabilities={capabilities}
        dragHandleProps={sortable ? { ...attributes, ...listeners } : undefined}
      />
    </div>
  );
}

// ===== Main Sortable List =====
export function SortableTaskList({
  tasks,
  onComplete,
  onSkip,
  onDelete,
  onAction,
  onSettings,
  onReset,
  onReorder,
  onEdit,
  onHomework,
  getCapabilities,
  sortable = true,
  extras,
}: SortableTaskListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!sortable) return;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(tasks, oldIndex, newIndex).map((t, i) => ({
      ...t,
      order: i,
    }));
    onReorder(reordered);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 md:space-y-4">
          <AnimatePresence>
            {(() => {
              // Group extras by insertion index, then interleave with task cards
              const extrasByIndex = new Map<number, React.ReactNode[]>();
              for (const extra of extras ?? []) {
                const arr = extrasByIndex.get(extra.index) ?? [];
                arr.push(<div key={extra.key}>{extra.node}</div>);
                extrasByIndex.set(extra.index, arr);
              }
              const children: React.ReactNode[] = [];
              tasks.forEach((task, index) => {
                for (const node of extrasByIndex.get(index) ?? []) children.push(node);
                children.push(
                  <SortableTaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    onComplete={onComplete}
                    onSkip={onSkip}
                    onDelete={onDelete}
                    onAction={onAction}
                    onSettings={onSettings}
                    onReset={onReset}
                    onEdit={onEdit}
                    onHomework={onHomework}
                    capabilities={getCapabilities?.(task)}
                    sortable={sortable}
                  />
                );
              });
              for (const node of extrasByIndex.get(tasks.length) ?? []) children.push(node);
              return children;
            })()}
          </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  );
}
