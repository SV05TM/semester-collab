import { useState, useEffect } from 'react';
import api from '../api';

export default function FundraisingPanel({ eventId, user }) {
  const [entries, setEntries] = useState([]);
  const [newRow, setNewRow] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEntries();
  }, [eventId]);

  const loadEntries = async () => {
    try {
      const { data } = await api.get(`/finances/event/${eventId}?section=fundraising`);
      setEntries(data.finances || []);
    } catch (err) {
      console.error('Failed to load fundraising', err);
    }
  };

  const addEntry = async () => {
    if (!newRow.source.trim()) {
      setError('Source is required');
      return;
    }
    if (!newRow.revenue && !newRow.expense) {
      setError('Enter either revenue or expense amount');
      return;
    }
    setError('');
    try {
      await api.post('/finances', {
        event_id: eventId,
        section: 'fundraising',
        source: newRow.source,
        description: newRow.description,
        revenue: parseFloat(newRow.revenue) || 0,
        expense: parseFloat(newRow.expense) || 0,
        status: newRow.status
      });
      setNewRow(null);
      loadEntries();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add entry');
    }
  };

  const deleteEntry = async (id) => {
    await api.delete(`/finances/${id}`);
    loadEntries();
  };

  const totalRevenue = entries.reduce((sum, e) => sum + (e.revenue || e.amount || 0), 0);
  const totalExpense = entries.reduce((sum, e) => sum + (e.expense || 0), 0);
  const netProfit = totalRevenue - totalExpense;
  const confirmedRevenue = entries.filter(e => e.status === 'confirmed').reduce((sum, e) => sum + (e.revenue || e.amount || 0), 0);

  const exportFundraising = () => {
    if (entries.length === 0) return;

    let html = `<html><head><meta charset="UTF-8">
      <style>
        table { border-collapse: collapse; width: 100%; }
        th { background-color: #16a34a; color: white; padding: 8px 12px; border: 1px solid #ddd; }
        td { padding: 6px 12px; border: 1px solid #ddd; }
        .total-row { font-weight: bold; background-color: #f0fdf4; }
        .currency { text-align: right; }
      </style></head><body>
      <h2>Fundraising Report</h2>
      <table><thead><tr>
        <th>Source</th><th>Description</th><th>Revenue</th><th>Expenses</th><th>Net</th><th>Status</th><th>Date</th>
      </tr></thead><tbody>`;

    for (const e of entries) {
      const rev = e.revenue || e.amount || 0;
      const exp = e.expense || 0;
      html += `<tr>
        <td>${e.source || ''}</td>
        <td>${e.description || ''}</td>
        <td class="currency">$${rev.toFixed(2)}</td>
        <td class="currency">$${exp.toFixed(2)}</td>
        <td class="currency">$${(rev - exp).toFixed(2)}</td>
        <td>${e.status || ''}</td>
        <td>${new Date(e.created_at).toLocaleDateString()}</td>
      </tr>`;
    }

    html += `<tr class="total-row">
      <td></td><td><strong>Totals</strong></td>
      <td class="currency"><strong>$${totalRevenue.toFixed(2)}</strong></td>
      <td class="currency"><strong>$${totalExpense.toFixed(2)}</strong></td>
      <td class="currency"><strong>$${netProfit.toFixed(2)}</strong></td>
      <td colspan="2"></td>
    </tr>`;
    html += `</tbody></table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fundraising-${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
          <p className="text-sm text-green-600 font-medium">Total Revenue</p>
          <p className="text-2xl font-bold text-green-700">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4">
          <p className="text-sm text-red-600 font-medium">Total Expenses</p>
          <p className="text-2xl font-bold text-red-700">${totalExpense.toFixed(2)}</p>
        </div>
        <div className={`border rounded-2xl p-4 ${netProfit >= 0 ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'}`}>
          <p className="text-sm font-medium text-gray-600">Net Profit</p>
          <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>${netProfit.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-4">
          <p className="text-sm text-indigo-600 font-medium">Confirmed</p>
          <p className="text-2xl font-bold text-indigo-700">${confirmedRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Fundraising Activities</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={exportFundraising}
            disabled={entries.length === 0}
            className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
          >
            📊 Export Excel
          </button>
          <button
            onClick={() => { setNewRow({ source: '', description: '', revenue: '', expense: '', status: 'pending' }); setError(''); }}
            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 text-sm"
          >
            + Add Activity
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-2 rounded-lg mb-3 text-sm">{error}</div>}

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-green-600 text-white">
              <th className="text-left px-4 py-3 font-semibold">Source / Activity</th>
              <th className="text-left px-4 py-3 font-semibold">Description</th>
              <th className="text-right px-4 py-3 font-semibold w-28">Revenue</th>
              <th className="text-right px-4 py-3 font-semibold w-28">Expenses</th>
              <th className="text-right px-4 py-3 font-semibold w-28">Net</th>
              <th className="text-left px-4 py-3 font-semibold w-28">Status</th>
              <th className="text-center px-4 py-3 font-semibold w-16">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, idx) => {
              const rev = e.revenue || e.amount || 0;
              const exp = e.expense || 0;
              const net = rev - exp;
              return (
                <tr key={e.id} className={`border-b hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-2.5 font-medium">{e.source}</td>
                  <td className="px-4 py-2.5 text-gray-600">{e.description}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-green-600">${rev.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-red-600">{exp > 0 ? `-$${exp.toFixed(2)}` : '$0.00'}</td>
                  <td className={`px-4 py-2.5 text-right font-mono font-semibold ${net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    ${net.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      e.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {e.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button onClick={() => deleteEntry(e.id)} className="text-red-400 hover:text-red-600" aria-label="Delete">🗑️</button>
                  </td>
                </tr>
              );
            })}

            {/* New row */}
            {newRow && (
              <tr className="border-b bg-green-50">
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={newRow.source}
                    onChange={(e) => setNewRow({ ...newRow, source: e.target.value })}
                    placeholder="e.g. Bake Sale, Car Wash..."
                    className="w-full px-2 py-1 border rounded text-sm"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && addEntry()}
                    aria-label="Source"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={newRow.description}
                    onChange={(e) => setNewRow({ ...newRow, description: e.target.value })}
                    placeholder="Details..."
                    className="w-full px-2 py-1 border rounded text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && addEntry()}
                    aria-label="Description"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newRow.revenue}
                    onChange={(e) => setNewRow({ ...newRow, revenue: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-2 py-1 border rounded text-sm text-right"
                    onKeyDown={(e) => e.key === 'Enter' && addEntry()}
                    aria-label="Revenue"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newRow.expense}
                    onChange={(e) => setNewRow({ ...newRow, expense: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-2 py-1 border rounded text-sm text-right"
                    onKeyDown={(e) => e.key === 'Enter' && addEntry()}
                    aria-label="Expense"
                  />
                </td>
                <td className="px-4 py-2 text-right font-mono text-gray-500 text-xs">
                  ${((parseFloat(newRow.revenue) || 0) - (parseFloat(newRow.expense) || 0)).toFixed(2)}
                </td>
                <td className="px-2 py-2">
                  <select
                    value={newRow.status}
                    onChange={(e) => setNewRow({ ...newRow, status: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                    aria-label="Status"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                </td>
                <td className="px-2 py-2 text-center">
                  <div className="flex gap-1 justify-center">
                    <button onClick={addEntry} className="text-green-600 hover:text-green-800 font-bold" aria-label="Save">✓</button>
                    <button onClick={() => { setNewRow(null); setError(''); }} className="text-gray-400 hover:text-gray-600" aria-label="Cancel">✕</button>
                  </div>
                </td>
              </tr>
            )}

            {entries.length === 0 && !newRow && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No fundraising activities yet. Click "+ Add Activity" to start tracking revenue and expenses.
                </td>
              </tr>
            )}
          </tbody>
          {entries.length > 0 && (
            <tfoot>
              <tr className="bg-gray-100 border-t-2 border-gray-300">
                <td className="px-4 py-3 font-semibold" colSpan={2}>Totals</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-green-700">${totalRevenue.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-red-700">-${totalExpense.toFixed(2)}</td>
                <td className={`px-4 py-3 text-right font-mono font-bold text-lg ${netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  ${netProfit.toFixed(2)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
