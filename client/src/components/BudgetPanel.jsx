import { useState, useEffect } from 'react';
import api from '../api';

export default function BudgetPanel({ eventId, user, eventInfo }) {
  const [entries, setEntries] = useState([]);
  const [newRow, setNewRow] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEntries();
  }, [eventId]);

  const loadEntries = async () => {
    try {
      const { data } = await api.get(`/finances/event/${eventId}?section=budget`);
      setEntries(data.finances || []);
    } catch (err) {
      console.error('Failed to load budget', err);
    }
  };

  const addEntry = async () => {
    if (!newRow.vendor.trim() || !newRow.item_type.trim()) {
      setError('Vendor and Item Type are required');
      return;
    }
    setError('');
    try {
      await api.post('/finances', {
        event_id: eventId,
        section: 'budget',
        vendor: newRow.vendor,
        item_type: newRow.item_type,
        quantity: parseInt(newRow.quantity) || 0,
        price_per_item: parseFloat(newRow.price_per_item) || 0
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

  const totalAmount = entries.reduce((sum, e) => sum + ((e.quantity || 0) * (e.price_per_item || 0)), 0);

  const exportBudgetExcel = () => {
    if (entries.length === 0) return;

    const orgName = eventInfo?.organization || 'Organization';
    const eventName = eventInfo?.title || 'Event';
    const eventDate = eventInfo?.start_date || '';
    const eventTime = eventInfo?.event_time || '';
    const eventLocation = eventInfo?.event_location || '';

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:spreadsheet">
    <head><meta charset="UTF-8">
    <style>
      table { border-collapse: collapse; width: 100%; }
      th { background-color: #4F46E5; color: white; font-weight: bold; padding: 8px 12px; border: 1px solid #999; text-align: left; }
      td { padding: 6px 12px; border: 1px solid #ccc; }
      .header-section td { border: none; padding: 4px 12px; }
      .total-row { font-weight: bold; background-color: #f3f4f6; }
      .title { font-size: 16px; font-weight: bold; }
      .currency { text-align: right; }
    </style></head><body>`;

    html += `<table>
      <tr class="header-section"><td colspan="5" class="title">Student Funding Board Budget Request Form</td></tr>
      <tr class="header-section"><td><strong>Organization:</strong></td><td colspan="4">${orgName}</td></tr>
      <tr class="header-section"><td><strong>Event Name:</strong></td><td colspan="4">${eventName}</td></tr>
      <tr class="header-section"><td><strong>Event Date:</strong></td><td colspan="4">${eventDate}</td></tr>
      <tr class="header-section"><td><strong>Event Time:</strong></td><td colspan="4">${eventTime}</td></tr>
      <tr class="header-section"><td><strong>Event Location:</strong></td><td colspan="4">${eventLocation}</td></tr>
      <tr class="header-section"><td colspan="5"></td></tr>
    </table>`;

    // Budget items table
    html += `<table>
      <thead>
        <tr>
          <th>Vendor or Service</th>
          <th>Item Type</th>
          <th>Quantity</th>
          <th>Price Per Item</th>
          <th>Total Amount</th>
        </tr>
      </thead>
      <tbody>`;

    for (const e of entries) {
      const total = (e.quantity || 0) * (e.price_per_item || 0);
      html += `<tr>
        <td>${e.vendor || ''}</td>
        <td>${e.item_type || ''}</td>
        <td style="text-align:center">${e.quantity || 0}</td>
        <td class="currency">$${(e.price_per_item || 0).toFixed(2)}</td>
        <td class="currency">$${total.toFixed(2)}</td>
      </tr>`;
    }

    html += `<tr class="total-row">
      <td colspan="3"></td>
      <td><strong>Total Amount Requested</strong></td>
      <td class="currency"><strong>$${totalAmount.toFixed(2)}</strong></td>
    </tr>`;

    html += `</tbody></table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budget-request-${eventName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportBudgetCSV = () => {
    if (entries.length === 0) return;

    const headers = ['Vendor', 'Item Type', 'Quantity', 'Price Per Item', 'Amount'];
    const rows = entries.map(e => {
      const total = (e.quantity || 0) * (e.price_per_item || 0);
      return [
        `"${(e.vendor || '').replace(/"/g, '""')}"`,
        `"${(e.item_type || '').replace(/"/g, '""')}"`,
        e.quantity || 0,
        `$${(e.price_per_item || 0).toFixed(2)}`,
        `$${total.toFixed(2)}`
      ];
    });

    rows.push([]);
    rows.push(['', '', '', 'Total Amount Requested', `$${totalAmount.toFixed(2)}`]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budget-request-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-indigo-600 font-medium">Total Amount Requested</p>
            <p className="text-3xl font-bold text-indigo-700">${totalAmount.toFixed(2)}</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>{entries.length} line item{entries.length !== 1 ? 's' : ''}</p>
            {eventInfo && <p className="text-xs">{eventInfo.title}</p>}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Budget Line Items</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={exportBudgetCSV}
            disabled={entries.length === 0}
            className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
          >
            📄 CSV
          </button>
          <button
            onClick={exportBudgetExcel}
            disabled={entries.length === 0}
            className="bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 text-sm disabled:opacity-50"
          >
            📊 Export Excel
          </button>
          <button
            onClick={() => { setNewRow({ vendor: '', item_type: '', quantity: '1', price_per_item: '' }); setError(''); }}
            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 text-sm"
          >
            + Add Item
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-2 rounded-lg mb-3 text-sm">{error}</div>}

      {/* SFB-style spreadsheet table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-indigo-600 text-white">
              <th className="text-left px-4 py-3 font-semibold">Vendor or Service</th>
              <th className="text-left px-4 py-3 font-semibold">Item Type</th>
              <th className="text-center px-4 py-3 font-semibold w-24">Quantity</th>
              <th className="text-right px-4 py-3 font-semibold w-32">Price Per Item</th>
              <th className="text-right px-4 py-3 font-semibold w-32">Total Amount</th>
              <th className="text-center px-4 py-3 font-semibold w-16">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, idx) => {
              const lineTotal = (e.quantity || 0) * (e.price_per_item || 0);
              return (
                <tr key={e.id} className={`border-b hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-2.5 font-medium">{e.vendor}</td>
                  <td className="px-4 py-2.5 text-gray-700">{e.item_type}</td>
                  <td className="px-4 py-2.5 text-center">{e.quantity}</td>
                  <td className="px-4 py-2.5 text-right font-mono">${(e.price_per_item || 0).toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold">${lineTotal.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <button onClick={() => deleteEntry(e.id)} className="text-red-400 hover:text-red-600" aria-label="Delete">🗑️</button>
                  </td>
                </tr>
              );
            })}

            {/* New row inline */}
            {newRow && (
              <tr className="border-b bg-indigo-50">
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={newRow.vendor}
                    onChange={(e) => setNewRow({ ...newRow, vendor: e.target.value })}
                    placeholder="e.g. Dominos, Giant, Police..."
                    className="w-full px-2 py-1 border rounded text-sm"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && addEntry()}
                    aria-label="Vendor"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={newRow.item_type}
                    onChange={(e) => setNewRow({ ...newRow, item_type: e.target.value })}
                    placeholder="e.g. Medium Pizza, Services..."
                    className="w-full px-2 py-1 border rounded text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && addEntry()}
                    aria-label="Item type"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min="1"
                    value={newRow.quantity}
                    onChange={(e) => setNewRow({ ...newRow, quantity: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm text-center"
                    onKeyDown={(e) => e.key === 'Enter' && addEntry()}
                    aria-label="Quantity"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newRow.price_per_item}
                    onChange={(e) => setNewRow({ ...newRow, price_per_item: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-2 py-1 border rounded text-sm text-right"
                    onKeyDown={(e) => e.key === 'Enter' && addEntry()}
                    aria-label="Price per item"
                  />
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-gray-500">
                  ${((parseInt(newRow.quantity) || 0) * (parseFloat(newRow.price_per_item) || 0)).toFixed(2)}
                </td>
                <td className="px-2 py-2 text-center">
                  <div className="flex gap-1 justify-center">
                    <button onClick={addEntry} className="text-green-600 hover:text-green-800 font-bold" aria-label="Save">✓</button>
                    <button onClick={() => { setNewRow(null); setError(''); }} className="text-gray-400 hover:text-gray-600" aria-label="Cancel">✕</button>
                  </div>
                </td>
              </tr>
            )}

            {/* Empty rows to look like a spreadsheet */}
            {entries.length < 5 && !newRow && Array.from({ length: 5 - entries.length }).map((_, i) => (
              <tr key={`empty-${i}`} className="border-b">
                <td className="px-4 py-2.5 text-gray-300">&nbsp;</td>
                <td className="px-4 py-2.5"></td>
                <td className="px-4 py-2.5"></td>
                <td className="px-4 py-2.5 text-right font-mono text-gray-300">$-</td>
                <td className="px-4 py-2.5 text-right font-mono text-gray-300">$-</td>
                <td className="px-4 py-2.5"></td>
              </tr>
            ))}

            {entries.length === 0 && !newRow && (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-gray-400 text-xs">
                  Click "+ Add Item" to start building your budget request
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-gray-200 border-t-2 border-gray-400">
              <td className="px-4 py-3" colSpan={3}></td>
              <td className="px-4 py-3 text-right font-semibold text-gray-700">Total Amount Requested</td>
              <td className="px-4 py-3 text-right font-mono font-bold text-lg text-indigo-700">${totalAmount.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Info note */}
      <div className="mt-4 p-3 bg-gray-50 border rounded-lg text-xs text-gray-500">
        <p className="font-medium mb-1">💡 SFB Budget Format</p>
        <p>This follows the Student Funding Board Budget Request Form format. Export to Excel to get a formatted file ready for submission with Vendor, Item Type, Quantity, Price Per Item, and Total Amount columns.</p>
      </div>
    </div>
  );
}
