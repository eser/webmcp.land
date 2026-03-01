"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/date";
import { getResourceUrl } from "@/lib/urls";
import { MoreHorizontal, Check, X, Eye, ExternalLink, RotateCcw, ListPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Report {
  id: string;
  reason: "SPAM" | "INAPPROPRIATE" | "COPYRIGHT" | "MISLEADING" | "RELIST_REQUEST" | "OTHER";
  details: string | null;
  status: "PENDING" | "REVIEWED" | "DISMISSED";
  createdAt: Date;
  updatedAt: Date;
  resourceId: string;
  reporterId: string;
  resource: {
    id: string;
    slug: string | null;
    title: string;
    deletedAt: Date | null;
  };
  reporter: {
    id: string;
    username: string;
    name: string | null;
    avatar: string | null;
  };
}

interface ReportsTableProps {
  reports: Report[];
}

export function ReportsTable({ reports }: ReportsTableProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const [loading, setLoading] = useState<string | null>(null);

  const handleStatusChange = async (reportId: string, status: "REVIEWED" | "DISMISSED") => {
    setLoading(reportId);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success(status === "REVIEWED" ? t("admin.reports.markedReviewed") : t("admin.reports.dismissed"));
      router.refresh();
    } catch {
      toast.error(t("admin.reports.updateFailed"));
    } finally {
      setLoading(null);
    }
  };

  const handleRelistPrompt = async (resourceId: string) => {
    setLoading(resourceId);
    try {
      const res = await fetch(`/api/resources/${resourceId}/unlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unlist: false }),
      });

      if (!res.ok) throw new Error("Failed to relist resource");

      toast.success(t("admin.reports.resourceRelisted"));
      router.refresh();
    } catch {
      toast.error(t("admin.reports.relistFailed"));
    } finally {
      setLoading(null);
    }
  };

  const handleRestorePrompt = async (resourceId: string) => {
    setLoading(resourceId);
    try {
      const res = await fetch(`/api/resources/${resourceId}/restore`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to restore resource");

      toast.success(t("admin.reports.resourceRestored"));
      router.refresh();
    } catch {
      toast.error(t("admin.reports.restoreFailed"));
    } finally {
      setLoading(null);
    }
  };

  const statusColors = {
    PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    REVIEWED: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    DISMISSED: "bg-muted text-muted-foreground",
  };

  const reasonLabels: Record<string, string> = {
    SPAM: t("report.admin.reports.reasons.spam"),
    INAPPROPRIATE: t("report.admin.reports.reasons.inappropriate"),
    COPYRIGHT: t("report.admin.reports.reasons.copyright"),
    MISLEADING: t("report.admin.reports.reasons.misleading"),
    RELIST_REQUEST: t("report.admin.reports.reasons.relistRequest"),
    OTHER: t("report.admin.reports.reasons.other"),
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{t("admin.reports.title")}</h3>
          <p className="text-sm text-muted-foreground">{t("admin.reports.description")}</p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-md">
          {t("admin.reports.noReports")}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.reports.resource")}</TableHead>
                <TableHead>{t("admin.reports.reason")}</TableHead>
                <TableHead>{t("admin.reports.reportedBy")}</TableHead>
                <TableHead>{t("admin.reports.status")}</TableHead>
                <TableHead>{t("admin.reports.date")}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <Link
                      href={getResourceUrl(report.resource.id, report.resource.slug)}
                      prefetch={false}
                      className="font-medium hover:underline flex items-center gap-1"
                    >
                      {report.resource.title}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge variant="outline">{reasonLabels[report.reason]}</Badge>
                      {report.details && (
                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                          {report.details}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={report.reporter.avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {report.reporter.name?.charAt(0) || report.reporter.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">@{report.reporter.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[report.status]}>
                      {t(`admin.reports.statuses.${report.status.toLowerCase()}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(report.createdAt, locale)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={loading === report.id}
                         />}>
                          <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem render={<Link href={getResourceUrl(report.resource.id, report.resource.slug)} prefetch={false} />}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t("admin.reports.viewResource")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {report.status === "PENDING" && (
                          <>
                            <DropdownMenuItem onClick={() => handleStatusChange(report.id, "REVIEWED")}>
                              <Check className="h-4 w-4 mr-2" />
                              {t("admin.reports.markReviewed")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(report.id, "DISMISSED")}>
                              <X className="h-4 w-4 mr-2" />
                              {t("admin.reports.dismiss")}
                            </DropdownMenuItem>
                          </>
                        )}
                        {report.status !== "PENDING" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(report.id, "REVIEWED")}
                            disabled={report.status === "REVIEWED"}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            {t("admin.reports.markReviewed")}
                          </DropdownMenuItem>
                        )}
                        {report.reason === "RELIST_REQUEST" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleRelistPrompt(report.resource.id)}>
                              <ListPlus className="h-4 w-4 mr-2" />
                              {t("admin.reports.relistResource")}
                            </DropdownMenuItem>
                          </>
                        )}
                        {report.resource.deletedAt && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleRestorePrompt(report.resource.id)}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              {t("admin.reports.restoreResource")}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
