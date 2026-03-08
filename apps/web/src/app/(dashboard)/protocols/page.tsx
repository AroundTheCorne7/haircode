"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, FileText, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Protocol {
  id: string;
  clientName: string;
  clientId: string;
  date: string;
  phase: "STABILIZATION" | "TRANSFORMATION" | "INTEGRATION";
  score: number;
  status: "active" | "completed" | "draft";
  weeksRemaining: number;
}

const MOCK_PROTOCOLS: Protocol[] = [
  { id: "p1", clientName: "Sophie Laurent", clientId: "1", date: "2026-02-28", phase: "TRANSFORMATION", score: 62, status: "active", weeksRemaining: 8 },
  { id: "p2", clientName: "Marie Dubois", clientId: "2", date: "2026-02-20", phase: "STABILIZATION", score: 34, status: "active", weeksRemaining: 5 },
  { id: "p3", clientName: "Claire Bernard", clientId: "3", date: "2026-01-15", phase: "INTEGRATION", score: 78, status: "completed", weeksRemaining: 0 },
  { id: "p4", clientName: "Isabelle Martin", clientId: "5", date: "2026-02-10", phase: "TRANSFORMATION", score: 58, status: "active", weeksRemaining: 10 },
  { id: "p5", clientName: "Emma Petit", clientId: "4", date: "2026-03-01", phase: "STABILIZATION", score: 29, status: "draft", weeksRemaining: 12 },
];

const PHASE_BADGE: Record<string, string> = {
  STABILIZATION: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  TRANSFORMATION: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  INTEGRATION: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  completed: "bg-gray-100 text-gray-600 hover:bg-gray-100",
  draft: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
};

export default function ProtocolsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "draft">("all");

  const filtered = MOCK_PROTOCOLS.filter((p) => {
    const matchSearch = p.clientName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: MOCK_PROTOCOLS.length,
    active: MOCK_PROTOCOLS.filter((p) => p.status === "active").length,
    completed: MOCK_PROTOCOLS.filter((p) => p.status === "completed").length,
    draft: MOCK_PROTOCOLS.filter((p) => p.status === "draft").length,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Protocols</h1>
          <p className="text-sm text-muted-foreground mt-1">{counts.active} active protocols</p>
        </div>
        <Link href="/consultation/new">
          <Button className="bg-[#1A1A2E] hover:bg-[#1A1A2E]/90 text-white gap-2">
            <Plus className="h-4 w-4" /> New Protocol
          </Button>
        </Link>
      </div>

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
        {filtered.map((p) => (
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
                      <p className="text-xs text-muted-foreground">Generated {p.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={PHASE_BADGE[p.phase]}>{p.phase.toLowerCase()}</Badge>
                    <Badge className={STATUS_BADGE[p.status]}>{p.status}</Badge>
                    <span className="text-sm font-semibold text-[#1A1A2E] w-8 text-right">{p.score}</span>
                    {p.status === "active" && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {p.weeksRemaining}w left
                      </div>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
