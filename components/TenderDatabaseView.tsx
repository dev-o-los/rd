'use client';

import React, { useState, useEffect } from 'react';
import { RoadTender } from '@/lib/tenderMatcher';
import {
  Search,
  Filter,
  Building2,
  Calendar,
  IndianRupee,
  MapPin,
  ExternalLink,
  PlusCircle,
  FileCheck,
} from 'lucide-react';

export default function TenderDatabaseView() {
  const [tenders, setTenders] = useState<RoadTender[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrg, setSelectedOrg] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTenderJson, setNewTenderJson] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tenders');
      const data = await res.json();
      if (data.road_tenders) {
        setTenders(data.road_tenders);
      }
    } catch (err) {
      console.error('Error fetching tenders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTenders = tenders.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tender_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.contractor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.geo_location.area_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesOrg = selectedOrg === 'ALL' || t.organisation.includes(selectedOrg);
    const matchesStatus = selectedStatus === 'ALL' || t.status.toLowerCase().includes(selectedStatus.toLowerCase());

    return matchesSearch && matchesOrg && matchesStatus;
  });

  const handleImportJson = async () => {
    try {
      setImportStatus(null);
      const parsed = JSON.parse(newTenderJson);
      const res = await fetch('/api/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (res.ok) {
        setImportStatus('Successfully imported new road tender data!');
        setNewTenderJson('');
        fetchTenders();
        setTimeout(() => setShowAddModal(false), 1500);
      } else {
        setImportStatus(`Import Error: ${data.error || 'Invalid payload'}`);
      }
    } catch (err: any) {
      setImportStatus(`JSON Parse Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-400" /> Lucknow Road Tenders Master Database
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Registered government road development & maintenance contracts in Lucknow (LDAUP, RED UP, Krishi Mandi Parishad).
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> Import Tender JSON
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search input */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by tender ID, road title, contractor, or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Organisation Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Authorities</option>
            <option value="Lucknow Development Authority">Lucknow Dev Authority (LDA)</option>
            <option value="RED">Rural Eng Department (RED UP)</option>
            <option value="Mandi">Mandi Parishad UP</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Contract Statuses</option>
            <option value="Active">Active Maintenance / Contract</option>
            <option value="Bidding">Under Bidding</option>
            <option value="Awarded">Awarded / Under Construction</option>
          </select>
        </div>
      </div>

      {/* Tenders Table / List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">Loading tender dataset...</div>
      ) : filteredTenders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
          No road tenders match the filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTenders.map((t) => (
            <div
              key={t.tender_id}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 shadow-lg space-y-4 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-bold rounded">
                    {t.tender_id}
                  </span>
                  <div className="text-xs text-slate-400 mt-1 font-mono">Ref: {t.reference_number}</div>
                </div>

                <span
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                    t.status.includes('Active')
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : t.status.includes('Awarded')
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {t.status}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">{t.title}</h4>
                <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">{t.geo_location.area_name}</span>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px]">Contractor:</span>
                  <div className="text-emerald-400 font-bold truncate">{t.contractor_name}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Budget:</span>
                  <div className="text-white font-bold">₹{(t.budget_inr / 100000).toFixed(2)} Lakhs</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
                <span className="truncate max-w-[220px]">{t.organisation}</span>
                <span className="font-mono text-slate-400">
                  {t.geo_location.latitude.toFixed(4)}°N, {t.geo_location.longitude.toFixed(4)}°E
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for importing JSON */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-400" /> Import Road Tender JSON
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Paste JSON payload containing a single tender object or a <code className="text-indigo-300">road_tenders</code> array.
            </p>

            <textarea
              rows={8}
              value={newTenderJson}
              onChange={(e) => setNewTenderJson(e.target.value)}
              placeholder='{\n  "tender_id": "2026_LDAUP_NEW_1",\n  "title": "Gomti Nagar Link Road Repair",\n  "organisation": "Lucknow Development Authority",\n  "contractor_name": "ABC Infra Ltd",\n  "budget_inr": 5000000,\n  "status": "Active Maintenance",\n  "road_type": "Sector Road",\n  "geo_location": {\n    "area_name": "Gomti Nagar",\n    "latitude": 26.8500,\n    "longitude": 81.0000,\n    "coverage_radius_meters": 1000\n  }\n}'
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />

            {importStatus && (
              <div
                className={`text-xs p-3 rounded-lg border ${
                  importStatus.includes('Error')
                    ? 'bg-rose-950/40 text-rose-300 border-rose-800'
                    : 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
                }`}
              >
                {importStatus}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleImportJson}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg"
              >
                Submit JSON Payload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
