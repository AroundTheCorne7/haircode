import { Search, Plus } from "lucide-react";
import Link from "next/link";

const MOCK_CLIENTS = [
  { id: "1", name: "Isabelle Martin", email: "isabelle@example.com", lastVisit: "2 days ago", protocol: "Active", practitioner: "Sophie L." },
  { id: "2", name: "Camille Dubois", email: "camille@example.com", lastVisit: "1 week ago", protocol: "Completed", practitioner: "Sophie L." },
  { id: "3", name: "Noémie Bernard", email: "noemie@example.com", lastVisit: "3 weeks ago", protocol: "Draft", practitioner: "Marie C." },
  { id: "4", name: "Léa Fontaine", email: "lea@example.com", lastVisit: "1 month ago", protocol: "None", practitioner: "Sophie L." },
];

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Completed: "bg-gray-100 text-gray-600",
  Draft: "bg-amber-100 text-amber-700",
  None: "bg-gray-100 text-gray-400",
};

export default function ClientsPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-light text-gray-900">Clients</h1>
        <Link href="/consultation/new" className="flex items-center justify-center gap-2 bg-brand text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          New Consultation
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search clients by name, email..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
      </div>

      {/* Mobile card list — visible only on small screens */}
      <div className="sm:hidden space-y-3">
        {MOCK_CLIENTS.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No clients yet.</p>
            <Link href="/consultation/new" className="mt-3 inline-block text-sm text-brand font-medium">
              + Start a consultation
            </Link>
          </div>
        ) : (
          MOCK_CLIENTS.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`} className="block bg-white border border-gray-100 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  <span className="text-xs font-medium text-brand">{client.name.split(" ").map(n => n[0]).join("")}</span>
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{client.name}</p>
                  <p className="text-xs text-gray-500">{client.email}</p>
                  <p className="text-xs text-gray-400">{client.lastVisit}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[client.protocol] ?? ""}`}>
                  {client.protocol}
                </span>
                <span className="text-gray-400 text-sm">→</span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Desktop table — hidden on mobile */}
      <div className="hidden sm:block bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Client</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Last Visit</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Protocol</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Practitioner</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {MOCK_CLIENTS.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-brand">{client.name.split(" ").map(n => n[0]).join("")}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{client.name}</p>
                      <p className="text-xs text-gray-400">{client.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-500">{client.lastVisit}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[client.protocol] ?? ""}`}>
                    {client.protocol}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-gray-500">{client.practitioner}</td>
                <td className="px-5 py-4 text-right">
                  <Link href={`/clients/${client.id}`} className="text-xs text-brand font-medium hover:underline">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
