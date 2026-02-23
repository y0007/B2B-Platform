import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
    Settings, DollarSign, Percent, Plus, Trash2, Save, Loader2, RefreshCw, CheckCircle2, AlertTriangle
} from 'lucide-react';

export default function AdminSettings() {
    const [margins, setMargins] = useState({ default: 20, categories: {} });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [newMargin, setNewMargin] = useState('');

    const fetchMargins = async () => {
        setLoading(true);
        try {
            const data = await api.getMargins();
            setMargins(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMargins(); }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            await api.updateMargins(margins);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            alert('Failed to save margins');
        } finally {
            setSaving(false);
        }
    };

    const addCategoryMargin = () => {
        if (!newCategory.trim() || !newMargin) return;
        setMargins(prev => ({
            ...prev,
            categories: { ...prev.categories, [newCategory.trim()]: Number(newMargin) }
        }));
        setNewCategory('');
        setNewMargin('');
    };

    const removeCategoryMargin = (cat) => {
        setMargins(prev => {
            const updated = { ...prev.categories };
            delete updated[cat];
            return { ...prev, categories: updated };
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl mx-auto">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Settings className="w-8 h-8 text-pink-600" />
                        Margin Configuration
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Configure platform markups applied to external sourcing costs
                    </p>
                </div>
                <button
                    onClick={fetchMargins}
                    className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
                >
                    <RefreshCw className="w-5 h-5 text-slate-500" />
                </button>
            </header>

            {/* Default Margin */}
            <div className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Default Margin</h2>
                        <p className="text-xs text-slate-500">
                            Applied to all categories unless overridden below
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-xs">
                        <input
                            type="number"
                            min="0"
                            max="200"
                            value={margins.default}
                            onChange={(e) => setMargins({ ...margins, default: Number(e.target.value) })}
                            className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none text-2xl font-bold text-slate-900"
                        />
                        <Percent className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    </div>
                    <div className="text-sm text-slate-500">
                        <p>Base cost × <span className="font-bold text-slate-900">{(1 + margins.default / 100).toFixed(2)}</span></p>
                        <p className="text-xs text-slate-400 mt-0.5">Example: $100 cost → <span className="font-bold">${100 + margins.default}</span> price</p>
                    </div>
                </div>
            </div>

            {/* Category-Specific Margins */}
            <div className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <Percent className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Category-Specific Margins</h2>
                        <p className="text-xs text-slate-500">Override the default margin for specific jewelry categories</p>
                    </div>
                </div>

                {/* Existing Category Margins */}
                {Object.entries(margins.categories || {}).length > 0 ? (
                    <div className="space-y-2">
                        {Object.entries(margins.categories).map(([cat, margin]) => (
                            <div key={cat} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 group hover:bg-slate-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 rounded-full bg-white text-sm font-bold text-slate-700 border border-slate-200 shadow-sm">
                                        {cat}
                                    </span>
                                    <span className="text-sm text-slate-500">→</span>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min="0"
                                            max="200"
                                            value={margin}
                                            onChange={(e) => {
                                                setMargins(prev => ({
                                                    ...prev,
                                                    categories: { ...prev.categories, [cat]: Number(e.target.value) }
                                                }));
                                            }}
                                            className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-pink-500/20 outline-none"
                                        />
                                        <span className="text-sm text-slate-400">%</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeCategoryMargin(cat)}
                                    className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-sm">No category-specific margins configured.</p>
                        <p className="text-xs mt-1">Add one below to override the default for a specific category.</p>
                    </div>
                )}

                {/* Add New */}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                    <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Category (e.g. Ring)"
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-pink-500/20 outline-none"
                    />
                    <div className="relative">
                        <input
                            type="number"
                            min="0"
                            max="200"
                            value={newMargin}
                            onChange={(e) => setNewMargin(e.target.value)}
                            placeholder="25"
                            className="w-24 px-3 py-2 pr-8 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-pink-500/20 outline-none"
                        />
                        <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <button
                        onClick={addCategoryMargin}
                        disabled={!newCategory.trim() || !newMargin}
                        className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-800">
                    <p className="font-bold">How Pricing Works</p>
                    <p className="mt-1 text-amber-700">
                        For <strong>Internal Inventory</strong> items, the stored price range is shown directly.
                        For <strong>External/Sourced</strong> items, the system calculates:
                        <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono ml-1">Base Cost × (1 + Margin%)</code>
                        and displays an indicative range. Supplier costs are never exposed to buyers.
                    </p>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${saved
                        ? 'bg-green-500 text-white'
                        : 'bg-gradient-to-r from-pink-600 to-rose-500 text-white hover:shadow-lg hover:shadow-pink-200'
                        }`}
                >
                    {saving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : saved ? (
                        <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                    ) : (
                        <><Save className="w-4 h-4" /> Save Configuration</>
                    )}
                </button>
            </div>
        </div>
    );
}
