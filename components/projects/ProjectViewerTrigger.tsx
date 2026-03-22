"use client";

import { useState } from "react";

import { ProjectViewerModal } from "@/components/projects/ProjectViewerModal";
import type { ProjectEntity } from "@/src/types/entities";

type ProjectViewerTriggerProps = {
  project: ProjectEntity;
  label?: string;
  className?: string;
};

export function ProjectViewerTrigger({
  project,
  label = "Visualizar web",
  className = "focus-ring lift-link",
}: ProjectViewerTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className={className}>
        {label}
      </button>
      <ProjectViewerModal project={isOpen ? project : null} onClose={() => setIsOpen(false)} />
    </>
  );
}

