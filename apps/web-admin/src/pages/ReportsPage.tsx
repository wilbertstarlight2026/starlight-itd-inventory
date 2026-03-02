import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { api } from '../services/api';

type ReportType = 'full_inventory' | 'by_category' | 'by_department' | 'by_status';

const REPORT_TYPES: { value: ReportType; label: string; desc: string }[] = [
  { value: 'full_inventory', label: 'Full Inventory', desc: 'All items with full details, assignment, and category info.' },
  { value: 'by_category', label: 'By Category', desc: 'Items grouped and counted by hardware category.' },
  { value: 'by_department', label: 'By Department', desc: 'Items assigned per department.' },
  { value: 'by_status', label: 'By Status', desc: 'Items grouped by current status (Available, In Use, etc.).' },
];

export default function ReportsPage() {
  const [selected, setSelected] = useState<ReportType>('full_inventory');
  const [generating, setGenerating] = useState<'pdf' | 'excel' | null>(null);

  async function generate(format: 'pdf' | 'excel') {
    setGenerating(format);
    try {
      const res = await api.post(
        '/reports/generate',
        { type: selected, format },
        { responseType: 'blob' }
      );

      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-report-${selected}-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to generate report. Try again.');
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm">Generate and export inventory reports</p>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORT_TYPES.map((rt) => (
          <button
            key={rt.value}
            onClick={() => setSelected(rt.value)}
            className={`text-left p-4 rounded-xl border-2 transition-colors ${
              selected === rt.value
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="font-semibold text-gray-800">{rt.label}</div>
            <div className="text-sm text-gray-500 mt-1">{rt.desc}</div>
          </button>
        ))}
      </div>

      {/* Export Buttons */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-700 mb-4">Export Report</h2>
        <div className="flex gap-4">
          <button
            onClick={() => generate('pdf')}
            disabled={generating !== null}
            className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <FileText size={20} />
            {generating === 'pdf' ? 'Generating...' : 'Export PDF'}
          </button>

          <button
            onClick={() => generate('excel')}
            disabled={generating !== null}
            className="flex items-center gap-2 px-5 py-3 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet size={20} />
            {generating === 'excel' ? 'Generating...' : 'Export Excel'}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Reports include all currently visible inventory items based on your access level.
        </p>
      </div>
    </div>
  );
}
