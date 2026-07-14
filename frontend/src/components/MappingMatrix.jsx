/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { FORM_MAPPING_MATRIX } from '../data/mockPatients';
import { Search, ShieldCheck, Tag, Info } from 'lucide-react';

export default function MappingMatrix() {
  const [searchTerm, setSearchTerm] = useState('');
  const [formFilter, setFormFilter] = useState('All');

  const filteredMatrix = FORM_MAPPING_MATRIX.filter((row) => {
    const matchesSearch =
    row.originalFieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.digitalFieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.sourceSection.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.entityType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = formFilter === 'All' || row.sourceForm === formFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header Banner */}
      <div className="p-6 bg-slate-900 text-white border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Source Form to Digital Module Mapping Matrix</h2>
            <p className="text-sm text-slate-400 mt-1">
              Fully trace 100% of clinical data fields from CARE Heart Failure, STEMI, NSTEMI, and STS CABG forms into our unified patient-centric schema.
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="matrix-search"
            type="text"
            placeholder="Search fields, sections, or database entities..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} />
          
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['All', 'Shared', 'HF Assessment', 'STEMI', 'NSTEMI', 'CABG / STS'].map((tab) =>
          <button
            id={`tab-filter-${tab.replace(/\s+/g, '-').toLowerCase()}`}
            key={tab}
            onClick={() => setFormFilter(tab)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            formFilter === tab ?
            'bg-blue-600 text-white' :
            'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'}`
            }>
            
              {tab}
            </button>
          )}
        </div>
      </div>

      {/* Stats Line */}
      <div className="px-6 py-2 bg-slate-100 text-xs text-slate-500 border-b border-slate-200 flex justify-between">
        <span>Showing <strong>{filteredMatrix.length}</strong> of <strong>{FORM_MAPPING_MATRIX.length}</strong> mapped data concept entities</span>
        <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Complete coverage of 4 clinical standards</span>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-xs font-bold text-slate-600 uppercase border-b border-slate-200">
              <th className="px-6 py-3.5">Source Form / Section</th>
              <th className="px-6 py-3.5">Original Field Name</th>
              <th className="px-6 py-3.5">Standardized Digital Field</th>
              <th className="px-6 py-3.5">Data Entity / Model</th>
              <th className="px-6 py-3.5">Validation Rules & Logic</th>
              <th className="px-6 py-3.5">Classification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredMatrix.map((row) =>
            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                {/* Source Form */}
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold w-fit mb-1 ${
                  row.sourceForm === 'Shared' ? 'bg-indigo-50 text-indigo-700' :
                  row.sourceForm === 'HF Assessment' ? 'bg-teal-50 text-teal-700' :
                  row.sourceForm === 'STEMI' ? 'bg-red-50 text-red-700' :
                  row.sourceForm === 'NSTEMI' ? 'bg-orange-50 text-orange-700' :
                  'bg-purple-50 text-purple-700'}`
                  }>
                      {row.sourceForm}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{row.sourceSection}</span>
                  </div>
                </td>

                {/* Original Field */}
                <td className="px-6 py-4 font-semibold text-slate-800">
                  {row.originalFieldName}
                </td>

                {/* Digital Field */}
                <td className="px-6 py-4">
                  <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono text-blue-700 font-medium">
                    {row.digitalFieldName}
                  </code>
                </td>

                {/* Data Entity */}
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-slate-700 font-medium">{row.entityType}</span>
                    <span className="text-xs text-slate-400 font-mono mt-0.5">{row.dataType} • {row.inputControl}</span>
                  </div>
                </td>

                {/* Validation Rules */}
                <td className="px-6 py-4 text-xs text-slate-500 max-w-xs">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    row.isMandatory ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-400'}`
                    }>
                        {row.isMandatory ? 'Mandatory' : 'Optional'}
                      </span>
                      <span className="text-slate-400">|</span>
                      <span>{row.repeatable ? 'Repeatable' : 'Single-instance'}</span>
                    </div>
                    {row.conditionalLogic &&
                  <div className="mt-1 bg-amber-50 text-amber-800 p-1.5 rounded border border-amber-100 flex items-start gap-1">
                        <Tag className="w-3 h-3 mt-0.5 shrink-0" />
                        <span><strong>Logic:</strong> {row.conditionalLogic}</span>
                      </div>
                  }
                  </div>
                </td>

                {/* Classification */}
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                row.classification === 'Patient-Level' ?
                'bg-blue-50 text-blue-700 font-semibold' :
                'bg-emerald-50 text-emerald-700 font-semibold'}`
                }>
                    {row.classification}
                  </span>
                </td>
              </tr>
            )}

            {filteredMatrix.length === 0 &&
            <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  No mapping rows found matching your search term.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>);

}