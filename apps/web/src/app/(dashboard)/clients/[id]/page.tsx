"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Scissors, Droplets, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type Tab = "overview" | "hair" | "scalp" | "protocols";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <User className="h-4 w-4" /> },
  { id: "hair", label: "Hair Profile", icon: <Scissors className="h-4 w-4" /> },
  { id: "scalp", label: "Scalp Profile", icon: <Droplets className="h-4 w-4" /> },
  { id: "protocols", label: "Protocols", icon: <FileText className="h-4 w-4" /> },
];

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Client Profile</h1>
          <p className="text-sm text-muted-foreground">ID: {params.id}</p>
        </div>
        <div className="ml-auto">
          <Link href="/consultation/new">
            <Button className="bg-[#C9A96E] hover:bg-[#C9A96E]/90 text-white">
              New Consultation
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[#C9A96E] text-[#1A1A2E] font-medium"
                : "border-transparent text-muted-foreground hover:text-[#1A1A2E]"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ["Name", "Sophie Laurent"],
                ["Date of Birth", "1990-05-12"],
                ["Phone", "+33 6 12 34 56 78"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="text-muted-foreground">GDPR Consent</span>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  Granted
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Current Protocol Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Composite Score</span>
                <span className="font-bold text-[#1A1A2E]">62/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Phase</span>
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                  Transformation
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phase Progress</span>
                <span>Week 4 of 12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Checkpoint</span>
                <span>Week 6</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "hair" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Hair Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            {[
              ["Texture", "2B — Wavy"],
              ["Density", "Medium"],
              ["Porosity", "High"],
              ["Elasticity", "Reduced"],
              ["Damage Index", "6/10"],
              ["Chemical History", "Colour, Bleach"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === "scalp" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Scalp Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            {[
              ["Biotype", "Combination"],
              ["Sebum Production", "Moderate"],
              ["Sensitivity", "Medium (5/10)"],
              ["pH Level", "5.2"],
              ["Open Lesions", "No"],
              ["Dandruff", "Mild"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === "protocols" && (
        <div className="space-y-3">
          {[
            { date: "2026-02-28", phase: "TRANSFORMATION", score: 62, weeks: 12 },
            { date: "2025-11-10", phase: "STABILIZATION", score: 38, weeks: 8 },
          ].map((p, i) => (
            <Card key={i}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{p.date}</p>
                  <p className="text-xs text-muted-foreground">
                    Score: {p.score}/100 · {p.weeks} weeks
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                  {p.phase.toLowerCase()}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
