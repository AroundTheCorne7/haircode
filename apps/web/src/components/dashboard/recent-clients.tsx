export function RecentClients() {
  const clients = [
    { name: "Isabelle Martin", lastVisit: "2 days ago" },
    { name: "Noémie Bernard", lastVisit: "1 week ago" },
    { name: "Camille Dubois", lastVisit: "3 weeks ago" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-900">Recent Clients</h2>
        <a href="/clients" className="text-xs text-brand hover:underline">See all</a>
      </div>
      <div className="space-y-3">
        {clients.map((client) => (
          <div key={client.name} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-brand">{client.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
              <p className="text-xs text-gray-400">{client.lastVisit}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
