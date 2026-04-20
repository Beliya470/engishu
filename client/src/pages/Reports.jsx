import { useState, useEffect } from 'react';
import api from '../lib/api';

function ksh(n) { return 'KES ' + Math.round(n).toLocaleString(); }

function BarChart({ data, maxVal }) {
  return (
    <div className="flex items-end gap-1.5 h-40">
      {data.map((d, i) => {
        const h = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-[#1DB8A8] rounded-t" style={{ height: `${Math.max(h, 2)}%` }}
              title={`${d.label}: ${ksh(d.value)}`} />
            <span className="text-[8px] text-gray-400 truncate w-full text-center">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Reports() {
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [agentPerf, setAgentPerf] = useState([]);
  const [sources, setSources] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/overview'),
      api.get('/reports/premium-trend'),
      api.get('/reports/agent-performance'),
      api.get('/reports/lead-sources'),
      api.get('/reports/product-breakdown'),
    ]).then(([ov, tr, ag, sr, pr]) => {
      setOverview(ov.data);
      setTrend(tr.data);
      setAgentPerf(ag.data);
      setSources(sr.data);
      setProducts(pr.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading reports...</div>;
  if (!overview) return <div className="text-center py-12 text-red-500">Failed to load reports</div>;

  const maxPremium = Math.max(...trend.map(t => t.premium), 1);

  return (
    <div>
      <div className="mb-6">
        <p className="text-xl font-semibold text-[#633806]">Reports & Analytics</p>
        <p className="text-sm text-[#9CA3AF]">Business performance overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'TOTAL CLIENTS', value: overview.totalClients, border: '#1DB8A8' },
          { label: 'ACTIVE POLICIES', value: overview.activePolicies, border: '#1DB8A8' },
          { label: 'CONVERSION RATE', value: `${overview.conversionRate}%`, border: overview.conversionRate > 30 ? '#1DB8A8' : '#F59E0B' },
          { label: 'YEARLY PREMIUM', value: ksh(overview.yearlyPremium), border: '#633806' },
          { label: 'TOTAL LEADS', value: overview.totalLeads, border: '#1DB8A8' },
          { label: 'WEBSITE LEADS', value: overview.websiteLeads, border: '#1DB8A8' },
          { label: 'MONTHLY PREMIUM', value: ksh(overview.monthlyPremium), border: '#1DB8A8' },
          { label: 'PENDING CLAIMS', value: overview.pendingClaims, border: overview.pendingClaims > 0 ? '#EF4444' : '#1DB8A8' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-r-xl p-4"
            style={{ borderLeft: `4px solid ${s.border}`, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
            <p className="text-[10px] font-semibold tracking-wider text-[#9CA3AF] mb-1">{s.label}</p>
            <p className="text-xl font-extrabold text-[#633806]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Premium Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-[#633806] mb-4">Monthly Premium Trend (12 months)</h3>
          <BarChart data={trend.map(t => ({ label: t.month.split(' ')[0], value: t.premium }))} maxVal={maxPremium} />
          <div className="flex justify-between mt-3 text-[10px] text-gray-400">
            <span>{trend[0]?.month}</span>
            <span>{trend[trend.length - 1]?.month}</span>
          </div>
        </div>

        {/* Lead Sources */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-[#633806] mb-4">Lead Sources</h3>
          <div className="space-y-3">
            {sources.map(s => {
              const total = sources.reduce((sum, x) => sum + x.count, 0) || 1;
              const pct = Math.round((s.count / total) * 100);
              return (
                <div key={s.source}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{s.source.replace('_', ' ')}</span>
                    <span className="text-xs text-gray-400">{s.count} leads ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1DB8A8] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.converted} converted</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-[#633806] mb-4">Agent Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Agent</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">Clients</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">Leads</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">Converted</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">Conversion %</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">Active Policies</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">Tasks Done</th>
              </tr>
            </thead>
            <tbody>
              {agentPerf.map(a => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#1DB8A8]/20 flex items-center justify-center">
                        <span className="text-[#1DB8A8] text-xs font-bold">{a.name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-[#633806]">{a.name}</p>
                        <p className="text-[10px] text-gray-400">{a.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-gray-600">{a.clients}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{a.leads}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{a.converted}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-xs font-semibold ${a.conversionRate >= 30 ? 'text-green-600' : a.conversionRate >= 15 ? 'text-amber-600' : 'text-red-600'}`}>
                      {a.conversionRate}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center text-gray-600">{a.activePolicies}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{a.tasksCompleted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-[#633806] mb-4">Product Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">Total Policies</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">Active</th>
                <th className="text-right px-3 py-3 font-medium text-gray-600">Total Premium</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.product} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-[#633806]">{p.product}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{p.count}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{p.active}</td>
                  <td className="px-3 py-3 text-right font-medium text-[#1DB8A8]">{ksh(p.premium)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
