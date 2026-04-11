"use client";

import { useHighlight } from "@/shared/contexts/highlight-context";
import { useAuth } from "@/shared/contexts/auth-context";

interface ChangeHighlightProps {
  entityRef: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps content with a highlight indicator when the entity was recently changed.
 * Only visible to admins and editors — end users see no visual change.
 */
export default function ChangeHighlight({ entityRef, children, className = "" }: ChangeHighlightProps) {
  const { isRecentlyChanged, getChangeInfo, settings } = useHighlight();
  const { isAdmin, isEditor } = useAuth();

  // End users (viewers) never see highlights
  if (!isAdmin && !isEditor) {
    return <div className={className}>{children}</div>;
  }

  const isChanged = isRecentlyChanged(entityRef);
  const changeInfo = isChanged ? getChangeInfo(entityRef) : undefined;

  if (!isChanged) {
    return <div className={className}>{children}</div>;
  }

  const timeAgo = changeInfo ? formatTimeAgo(changeInfo.createdAt) : "";
  const label = changeInfo?.changeType === "add" ? "NEW" : "UPDATED";

  return (
    <div
      className={`recent-change-highlight ${className}`}
      style={{
        "--highlight-color": settings.color,
      } as React.CSSProperties}
    >
      <span className="recent-change-badge" style={{ backgroundColor: settings.color }}>
        {label} {timeAgo && `· ${timeAgo}`}
      </span>
      {children}
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
