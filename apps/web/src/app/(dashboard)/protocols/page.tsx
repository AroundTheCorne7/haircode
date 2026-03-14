import Link from "next/link";
import { Plus } from "lucide-react";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import ProtocolList, { type ProtocolRow } from "./ProtocolList";

interface ApiClient {
  id: string;
  firstName: string;
  lastName: string;
}

interface ApiProtocol {
  id: string;
  clientId: string;
  objective: string | null;
  status: string;
  createdAt: string;
  startedAt: string | null;
  estimatedEndAt: string | null;
}

interface ClientsResponse {
  data: ApiClient[];
}

interface ProtocolsResponse {
  data: ApiProtocol[];
}

async function fetchAllProtocols(): Promise<ProtocolRow[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return [];

  const cookieStore = await cookies();
  const token = cookieStore.get("hc_token")?.value;
  if (!token) return [];

  const headers = { Authorization: `Bearer ${token}` };

  // Step 1: fetch all clients
  let clients: ApiClient[] = [];
  try {
    const res = await fetch(`${apiUrl}/clients`, { headers, cache: "no-store" });
    if (!res.ok) return [];
    const json: ClientsResponse = await res.json() as ClientsResponse;
    clients = json.data ?? [];
  } catch {
    return [];
  }

  if (clients.length === 0) return [];

  // Step 2: fetch protocols for all clients in parallel
  const results = await Promise.allSettled(
    clients.map(async (client) => {
      const res = await fetch(`${apiUrl}/clients/${client.id}/protocols`, {
        headers,
        cache: "no-store",
      });
      if (!res.ok) return [] as ProtocolRow[];
      const json: ProtocolsResponse = await res.json() as ProtocolsResponse;
      const protocols: ApiProtocol[] = json.data ?? [];
      return protocols.map((p): ProtocolRow => ({
        id: p.id,
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`,
        createdAt: p.createdAt,
        objective: p.objective ?? null,
        status: p.status,
        startedAt: p.startedAt ?? null,
        estimatedEndAt: p.estimatedEndAt ?? null,
      }));
    })
  );

  return results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export default async function ProtocolsPage() {
  const protocols = await fetchAllProtocols();
  const activeCount = protocols.filter((p) => p.status === "active").length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Protocols</h1>
          <p className="text-sm text-muted-foreground mt-1">{activeCount} active protocols</p>
        </div>
        <Link href="/consultation/new">
          <Button className="bg-[#1A1A2E] hover:bg-[#1A1A2E]/90 text-white gap-2">
            <Plus className="h-4 w-4" /> New Protocol
          </Button>
        </Link>
      </div>

      <ProtocolList protocols={protocols} />
    </div>
  );
}
