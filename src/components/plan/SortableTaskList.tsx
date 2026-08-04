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
import TaskCard from './TaskCard';

interface SortableTaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onDelete: (id: string) => void;
  onSettings: (id: string) => void;
  onReset: (id: string) => void;
  onReorder: (tasks: Task[]) => void;
}

// ===== Sortable wrapper for each task card =====
function SortableTaskCard({
  task,
  index,
  onComplete,
  onSkip,
  onDelete,
  onSettings,
  onReset,
}: {
  task: Task;
  index: number;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onDelete: (id: string) => void;
  onSettings: (id: string) => void;
  onReset: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

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
        onSettings={onSettings}
        onReset={onReset}
        dragHandleProps={{ ...attributes, ...listeners }}
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
  onSettings,
  onReset,
  onReorder,
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
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(tasks, oldIndex, newIndex);
    // Update order field
    reordered.forEach((t, i) => {
      t.order = i;
    });
    onReorder(reordered);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          <AnimatePresence>
            {tasks.map((task, index) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                index={index}
                onComplete={onComplete}
                onSkip={onSkip}
                onDelete={onDelete}
                onSettings={onSettings}
                onReset={onReset}
              />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  );
}
