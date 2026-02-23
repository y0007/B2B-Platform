import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Package, Plus, Search, Loader2, Image as ImageIcon, Tag, DollarSign, Layers } from 'lucide-react';

export default function CatalogManager() {
    const [skus, setSkus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '',
        description: '',
        image_url: '',
        source: 'Global Network',
        material: '',
        price_range: '',
        moq: '',
        lead_time_days: ''
    });

    const fetchCatalog = async () => {
        try {
            const data = await api.getAdminSKUs();
            setSkus(data.skus);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCatalog();
    }, []);

    const handleAddSKU = async (e) => {
        e.preventDefault();
        try {
            await api.createSKU(newItem);
            alert('Product added successfully!');
            setShowAddForm(false);
            setNewItem({
                name: '',
                description: '',
                image_url: '',
                source: 'Global Network',
                material: '',
                price_range: '',
                moq: '',
                lead_time_days: ''
            });
            fetchCatalog();
        } catch (err) {
            alert('Failed to add product');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Catalog Management</h1>
                    <p className="text-slate-500">Manage products and sourcing specifications</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="btn-primary flex items-center gap-2 px-6 py-3 rounded-2xl shadow-lg shadow-indigo-600/20"
                >
                    <Plus className="w-5 h-5" />
                    Add New Product
                </button>
            </div>

            {showAddForm && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 bg-slate-50 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">New Product Specification</h2>
                            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-900 transition-colors">&times;</button>
                        </div>
                        <form onSubmit={handleAddSKU} className="p-8 grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 uppercase">Product Name</label>
                                <input required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 uppercase">Material</label>
                                <input required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newItem.material} onChange={e => setNewItem({ ...newItem, material: e.target.value })} />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold text-slate-600 uppercase">Image URL (Optional)</label>
                                <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newItem.image_url} onChange={e => setNewItem({ ...newItem, image_url: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 uppercase">Price Range</label>
                                <input required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="$10 - $50"
                                    value={newItem.price_range} onChange={e => setNewItem({ ...newItem, price_range: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 uppercase">Lead Time (Days)</label>
                                <input required type="number" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newItem.lead_time_days} onChange={e => setNewItem({ ...newItem, lead_time_days: e.target.value })} />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold text-slate-600 uppercase">Description</label>
                                <textarea rows="3" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
                            </div>
                            <div className="md:col-span-2 flex gap-4 mt-2">
                                <button type="submit" className="flex-1 btn-primary py-3 rounded-xl font-bold">Save Specification</button>
                                <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-3 text-slate-500 font-medium">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
                ) : skus.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-400 font-medium">No products in catalog yet.</div>
                ) : skus.map(sku => (
                    <div key={sku.id} className="glass-card overflow-hidden group hover:shadow-2xl transition-all duration-300">
                        <div className="aspect-[16/10] bg-slate-100 flex items-center justify-center relative overflow-hidden">
                            {sku.image_url ? (
                                <img src={sku.image_url} alt={sku.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <ImageIcon className="w-12 h-12 text-slate-300" />
                            )}
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900">{sku.name}</h3>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <Tag className="w-3 h-3" />
                                    {sku.material}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Price</p>
                                    <p className="text-sm font-bold text-indigo-600">{sku.price_range}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">MOQ</p>
                                    <p className="text-sm font-bold text-slate-900">{sku.moq || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
