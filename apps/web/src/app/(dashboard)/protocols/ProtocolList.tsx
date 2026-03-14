"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, ChevronRight, Clock, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export interface ProtocolRow {
  id: string;
  clientName: string;
  clientId: string;
  createdAt: string;
  objective: string | null;
  status: string;
  startedAt: string | null;
  estimatedEndAt: string | null;
}

const PHASE_BADGE: Record<string, string> = {
  stabilization: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  transformation: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  integration: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  completed: "bg-gray-100 text-gray-600 hover:bg-gray-100",
  draft: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
};

function extractPhase(objective: string | null): string | null {
  if (objective == null) return null;
  // objective format: "Phase: stabilization | Score: 62.0"
  const match = /Phase:\s*(\w+)/i.exec(objective);
  return match?.[1]?.toLowerCase() ?? null;
}

function extractScore(objective: string | null): string | null {
  if (objective == null) return null;
  const match = /Score:\s*([\d.]+|N\/A)/i.exec(objective);
  return match?.[1] ?? null;
}

function weeksRemaining(estimatedEndAt: string | null): number | null {
  if (estimatedEndAt == null) return null;
  const diff = new Date(estimatedEndAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24 * 7));
}

interface Props {
  protocols: ProtocolRow[];
}

export default function ProtocolList({ protocols }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "draft">("all");

  const filtered = protocols.filter((p) => {
    const matchSearch = p.clientName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: protocols.length,
    active: protocols.filter((p) => p.status === "active").length,
    completed: protocols.filter((p) => p.status === "completed").length,
    draft: protocols.filter((p) => p.status === "draft").length,
  };

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-1 border-b">
        {(["all", "active", "completed", "draft"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm border-b-2 capitalize transition-colors ${
              filter === f
                ? "border-[#C9A96E] text-[#1A1A2E] font-medium"
                : "border-transparent text-muted-foreground hover:text-[#1A1A2E]"
            }`}
          >
            {f} <span className="ml-1 text-xs text-muted-foreground">({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by client name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              No protocols found.
            </CardContent>
          </Card>
        )}
        {filtered.map((p) => {
          const phase = extractPhase(p.objective);
          const score = extractScore(p.objective);
          const weeksLeft = p.status === "active" ? weeksRemaining(p.estimatedEndAt) : null;
          return (
            <Link key={p.id} href={`/clients/${p.clientId}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="py-4 px-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-[#1A1A2E]/5 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-[#1A1A2E]/40" />
                      </div>
                      <div>
                        <p className="font-medium text-[#1A1A2E]">{p.clientName}</p>
                        <p className="text-xs text-muted-foreground">
                          Generated {new Date(p.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {phase != null && (
                        <Badge className={PHASE_BADGE[phase] ?? ""}>{phase}</Badge>
                      )}
                      <Badge className={STATUS_BADGE[p.status] ?? "bg-gray-100 text-gray-600 hover:bg-gray-100"}>
                        {p.status}
                      </Badge>
                      {score != null && (
                        <span className="text-sm font-semibold text-[#1A1A2E] w-8 text-right">{score}</span>
                      )}
                      {weeksLeft != null && weeksLeft > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {weeksLeft}w left
                        </div>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
