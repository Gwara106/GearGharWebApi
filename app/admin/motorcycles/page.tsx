'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Bike, Edit, Trash2, Plus, Link2, X, Upload } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';

interface Motorcycle {
  _id: string;
  brand: string;
  model: string;
  slug: string;
  type: string;
  engineCc?: number;
  aliases?: string[];
}

interface ProductLite {
  _id: string;
  name: string;
  brand?: string;
  price?: number;
}

interface Compat {
  _id: string;
  universal: boolean;
  fitmentNotes?: string;
  product: ProductLite | null;
  motorcycle: { _id: string; brand: string; model: string } | null;
}

const BIKE_TYPES = ['sport', 'naked', 'cruiser', 'adventure', 'commuter', 'scooter', 'offroad', 'other'];

const emptyForm = { brand: '', model: '', type: 'other', engineCc: '', aliases: '' };

export default function MotorcyclesManagementPage() {
  const { user, isAuthenticated, isLoading, token } = useAuth();

  const [tab, setTab] = useState<'bikes' | 'compat'>('bikes');
  const [bikes, setBikes] = useState<Motorcycle[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Motorcycle modal
  const [showBikeModal, setShowBikeModal] = useState(false);
  const [editingBike, setEditingBike] = useState<Motorcycle | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteBikeId, setDeleteBikeId] = useState<string | null>(null);

  // Bulk import
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkResult, setBulkResult] = useState<string>('');

  // Compatibility
  const [selectedBike, setSelectedBike] = useState<string>('');
  const [mappings, setMappings] = useState<Compat[]>([]);
  const [assignProduct, setAssignProduct] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  const authHeaders = useCallback(
    () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }),
    [token]
  );

  const fetchBikes = useCallback(async () => {
    const res = await fetch('/api/admin/motorcycles', { headers: authHeaders() });
    if (res.ok) setBikes(await res.json());
  }, [authHeaders]);

  const fetchProducts = useCallback(async () => {
    const res = await fetch('/api/admin/products', { headers: authHeaders() });
    if (res.ok) setProducts(await res.json());
  }, [authHeaders]);

  useEffect(() => {
    if (isAuthenticated() && token) {
      Promise.all([fetchBikes(), fetchProducts()]).finally(() => setLoading(false));
    }
  }, [isAuthenticated, token, fetchBikes, fetchProducts]);

  const fetchMappings = useCallback(
    async (bikeId: string) => {
      if (!bikeId) {
        setMappings([]);
        return;
      }
      const res = await fetch(`/api/admin/compatibility?motorcycle=${bikeId}`, { headers: authHeaders() });
      if (res.ok) setMappings(await res.json());
    },
    [authHeaders]
  );

  useEffect(() => {
    fetchMappings(selectedBike);
  }, [selectedBike, fetchMappings]);

  // --- Motorcycle CRUD ---
  const openAddBike = () => {
    setEditingBike(null);
    setForm(emptyForm);
    setError('');
    setShowBikeModal(true);
  };

  const openEditBike = (b: Motorcycle) => {
    setEditingBike(b);
    setForm({
      brand: b.brand,
      model: b.model,
      type: b.type || 'other',
      engineCc: b.engineCc ? String(b.engineCc) : '',
      aliases: (b.aliases || []).join(', '),
    });
    setError('');
    setShowBikeModal(true);
  };

  const saveBike = async () => {
    setError('');
    if (!form.brand.trim() || !form.model.trim()) {
      setError('Brand and model are required');
      return;
    }
    const payload = { ...form, engineCc: form.engineCc || undefined };
    const url = editingBike ? `/api/admin/motorcycles/${editingBike._id}` : '/api/admin/motorcycles';
    const method = editingBike ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
    if (res.ok) {
      setShowBikeModal(false);
      await fetchBikes();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.message || 'Failed to save motorcycle');
    }
  };

  const runBulkImport = async () => {
    setBulkResult('');
    let parsed: any;
    try {
      parsed = JSON.parse(bulkText);
    } catch {
      setBulkResult('Invalid JSON. Expected an array of motorcycles or { "motorcycles": [...] }.');
      return;
    }
    const payload = Array.isArray(parsed) ? { motorcycles: parsed } : parsed;
    const res = await fetch('/api/admin/motorcycles/bulk', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const d = data.data || {};
      setBulkResult(`Imported: ${d.inserted} new, ${d.updated} updated, ${(d.errors || []).length} errors.`);
      await fetchBikes();
    } else {
      setBulkResult(data.message || 'Bulk import failed');
    }
  };

  const deleteBike = async (id: string) => {
    const res = await fetch(`/api/admin/motorcycles/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) {
      setDeleteBikeId(null);
      if (selectedBike === id) setSelectedBike('');
      await fetchBikes();
    }
  };

  // --- Compatibility ---
  const assign = async () => {
    if (!selectedBike || !assignProduct) return;
    const res = await fetch('/api/admin/compatibility', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ product: assignProduct, motorcycle: selectedBike, fitmentNotes: assignNotes }),
    });
    if (res.ok) {
      setAssignProduct('');
      setAssignNotes('');
      await fetchMappings(selectedBike);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.message || 'Failed to assign product');
    }
  };

  const removeMapping = async (id: string) => {
    const res = await fetch(`/api/admin/compatibility/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) await fetchMappings(selectedBike);
  };

  if (isLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (!isAuthenticated() || !user || user.role !== 'admin') {
    if (typeof window !== 'undefined') window.location.href = '/admin/login';
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container h-16 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">⚙️</span>
            </div>
            <span className="text-lg font-bold text-gray-900">GearGhar Admin</span>
          </Link>
          <Link href="/admin/dashboard" className="text-gray-600 hover:text-gray-900">Back to Dashboard</Link>
        </div>
      </div>

      <div className="container py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Motorcycle Compatibility</h1>
            <p className="text-gray-600">Manage the bike catalogue and product fitments used by the AI assistant</p>
          </div>
          {tab === 'bikes' && (
            <div className="flex items-center gap-2">
              <button onClick={() => { setShowBulk(true); setBulkResult(''); }} className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-gray-700">
                <Upload size={18} /> Bulk Import
              </button>
              <button onClick={openAddBike} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold">
                <Plus size={18} /> Add Motorcycle
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button onClick={() => setTab('bikes')} className={`px-4 py-2 font-semibold border-b-2 ${tab === 'bikes' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>
            Motorcycles ({bikes.length})
          </button>
          <button onClick={() => setTab('compat')} className={`px-4 py-2 font-semibold border-b-2 ${tab === 'compat' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>
            Compatibility Mappings
          </button>
        </div>

        {/* Motorcycles tab */}
        {tab === 'bikes' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Brand', 'Model', 'Type', 'Engine', 'Aliases', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bikes.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{b.brand}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{b.model}</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 text-xs bg-gray-100 rounded-full">{b.type}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{b.engineCc ? `${b.engineCc}cc` : '—'}</td>
                    <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">{(b.aliases || []).join(', ') || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditBike(b)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit size={16} /></button>
                        <button onClick={() => { setTab('compat'); setSelectedBike(b._id); }} className="p-2 text-primary hover:bg-primary/10 rounded-lg" title="Manage fitments"><Link2 size={16} /></button>
                        <button onClick={() => setDeleteBikeId(b._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bikes.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Bike size={40} className="mx-auto mb-3 text-gray-400" />
                No motorcycles yet. Add one or run the seed script.
              </div>
            )}
          </div>
        )}

        {/* Compatibility tab */}
        {tab === 'compat' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select a motorcycle</label>
              <select value={selectedBike} onChange={(e) => setSelectedBike(e.target.value)} className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">— Choose a motorcycle —</option>
                {bikes.map((b) => (
                  <option key={b._id} value={b._id}>{b.brand} {b.model}</option>
                ))}
              </select>
            </div>

            {selectedBike && (
              <>
                {/* Assign product */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Assign a product to this motorcycle</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select value={assignProduct} onChange={(e) => setAssignProduct(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
                      <option value="">— Choose a product —</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                    <input value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} placeholder="Fitment notes (optional)" className="px-4 py-2 border border-gray-300 rounded-lg" />
                    <button onClick={assign} disabled={!assignProduct} className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-40 font-semibold">
                      Assign
                    </button>
                  </div>
                  {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                </div>

                {/* Existing mappings */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 font-semibold text-gray-900">
                    Compatibility relationships ({mappings.length})
                  </div>
                  <table className="w-full">
                    <tbody className="divide-y divide-gray-200">
                      {mappings.map((m) => (
                        <tr key={m._id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm font-medium text-gray-900">
                            {m.product ? m.product.name : <span className="text-gray-400 italic">Deleted product</span>}
                          </td>
                          <td className="px-6 py-3">
                            {m.universal
                              ? <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Universal</span>
                              : <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Specific fitment</span>}
                          </td>
                          <td className="px-6 py-3 text-xs text-gray-500">{m.fitmentNotes || ''}</td>
                          <td className="px-6 py-3 text-right">
                            <button onClick={() => removeMapping(m._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Remove"><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {mappings.length === 0 && (
                    <div className="text-center py-10 text-gray-500">No compatibility mappings for this motorcycle yet.</div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit motorcycle modal */}
      {showBikeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{editingBike ? 'Edit Motorcycle' : 'Add Motorcycle'}</h3>
              <button onClick={() => setShowBikeModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                  <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                  <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    {BIKE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Engine (cc)</label>
                  <input type="number" value={form.engineCc} onChange={(e) => setForm({ ...form, engineCc: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aliases (comma-separated)</label>
                <input value={form.aliases} onChange={(e) => setForm({ ...form, aliases: e.target.value })} placeholder="r15v4, yzf r15 v4" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                <p className="text-xs text-gray-500 mt-1">Alternate spellings the assistant should recognise.</p>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowBikeModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-900">Cancel</button>
              <button onClick={saveBike} className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold">
                {editingBike ? 'Save Changes' : 'Add Motorcycle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk import modal */}
      {showBulk && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bulk Import Motorcycles</h3>
              <button onClick={() => setShowBulk(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Paste a JSON array. Each item needs at least <code>brand</code> and <code>model</code>.
              Optional: <code>type, engineCc, yearFrom, aliases</code>. Upserts by slug.
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={12}
              placeholder={'[\n  { "brand": "Yamaha", "model": "R15 V4", "type": "sport", "engineCc": 155, "aliases": ["r15v4","r15 v4"] }\n]'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs"
            />
            {bulkResult && <p className="text-sm mt-2 text-gray-800">{bulkResult}</p>}
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowBulk(false)} className="px-4 py-2 text-gray-600 hover:text-gray-900">Close</button>
              <button onClick={runBulkImport} disabled={!bulkText.trim()} className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-40 font-semibold">
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteBikeId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Delete Motorcycle</h3>
            <p className="text-gray-600 mb-6">This will also remove all its product compatibility mappings. This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteBikeId(null)} className="px-4 py-2 text-gray-600 hover:text-gray-900">Cancel</button>
              <button onClick={() => deleteBike(deleteBikeId)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
