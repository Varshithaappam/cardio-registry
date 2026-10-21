import React from 'react';
import { Search, RotateCcw, Filter, Calendar, Database, Sparkles } from 'lucide-react';

export default function UniversalFilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
  dataSource,
  onSourceChange,
  isLoading
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left side: Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Filter Icon & Label */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1.5 rounded-lg border border-teal-200/60 shrink-0">
            <Filter className="w-3.5 h-3.5 text-teal-600" />
            <span>Registry Filters:</span>
          </div>

          {/* Registry Selector */}
          <select
            value={filters.registry}
            onChange={(e) => onFilterChange('registry', e.target.value)}
            className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium transition cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-teal-500"
          >
            <option value="All Registries">All Registries</option>
            <option value="Heart Failure (HF)">Heart Failure (HF)</option>
            <option value="STEMI">STEMI</option>
            <option value="NSTEMI">NSTEMI</option>
          </select>

          {/* Phenotype Selector */}
          <select
            value={filters.phenotype}
            onChange={(e) => onFilterChange('phenotype', e.target.value)}
            className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium transition cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-teal-500"
          >
            <option value="All Phenotypes">All Phenotypes</option>
            <option value="HFrEF">HFrEF (EF ≤ 40%)</option>
            <option value="HFmrEF">HFmrEF (EF 41-49%)</option>
            <option value="HFpEF">HFpEF (EF ≥ 50%)</option>
          </select>

          {/* Gender Selector */}
          <select
            value={filters.gender}
            onChange={(e) => onFilterChange('gender', e.target.value)}
            className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium transition cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-teal-500"
          >
            <option value="All Genders">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange('startDate', e.target.value)}
              className="bg-transparent text-slate-700 text-xs focus:outline-hidden"
              title="Start Date"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange('endDate', e.target.value)}
              className="bg-transparent text-slate-700 text-xs focus:outline-hidden"
              title="End Date"
            />
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search UHID, Patient name, or Drug..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-teal-500 transition"
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange('search', '')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Right side: Cohort Counter & Data Source Switcher */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          


          {/* Real-time Count Counter */}
          <div className="text-xs text-slate-600 font-medium">
            <span className="font-bold text-slate-900 font-mono">{filteredCount}</span> of{' '}
            <span className="font-mono text-slate-500">{totalCount}</span> Patients
          </div>

          {/* Reset Filters Button */}
          {(filters.registry !== 'All Registries' ||
            filters.phenotype !== 'All Phenotypes' ||
            filters.gender !== 'All Genders' ||
            filters.startDate ||
            filters.endDate ||
            filters.search) && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition font-medium border border-rose-200"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
