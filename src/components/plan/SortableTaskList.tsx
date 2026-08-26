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
  getCapabilities?: (task: Task) => TaskCardCapabilities;
  sortable?: boolean;
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
  getCapabilities,
  sortable = true,
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
            {tasks.map((task, index) => (
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
                capabilities={getCapabilities?.(task)}
                sortable={sortable}
              />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  );
}
