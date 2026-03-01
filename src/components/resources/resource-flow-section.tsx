"use client";

import { useState } from "react";
import { ResourceConnections } from "./resource-connections";
import { ReportResourceDialog } from "./report-resource-dialog";

interface ResourceFlowSectionProps {
  resourceId: string;
  resourceTitle: string;
  canEdit: boolean;
  isOwner: boolean;
  isLoggedIn: boolean;
  currentUserId?: string;
  isAdmin?: boolean;
  workflowLink?: string | null;
  hasFlowConnections?: boolean;
}

export function ResourceFlowSection({
  resourceId,
  resourceTitle,
  canEdit,
  isOwner,
  isLoggedIn,
  currentUserId,
  isAdmin,
  workflowLink,
}: ResourceFlowSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="pt-2">
      {/* Button row: [add next step] - spacer - [report] */}
      <div className="flex items-center justify-end gap-2">
        <ResourceConnections
          resourceId={resourceId}
          resourceTitle={resourceTitle}
          canEdit={canEdit}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          buttonOnly
          expanded={expanded}
          onExpandChange={setExpanded}
        />
        <div className="flex-1" />
        {!isOwner && (
          <ReportResourceDialog resourceId={resourceId} isLoggedIn={isLoggedIn} />
        )}
      </div>
      {/* Resource Flow section below */}
      <ResourceConnections
        resourceId={resourceId}
        resourceTitle={resourceTitle}
        canEdit={canEdit}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        workflowLink={workflowLink}
        sectionOnly
        expanded={expanded}
        onExpandChange={setExpanded}
      />
    </div>
  );
}
