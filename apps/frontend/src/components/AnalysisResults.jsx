import React from 'react';
import { Sparkles } from 'lucide-react';

export function AnalysisResults({ attributes }) {
    if (!attributes) return null;

    return (
        <div className="glass-card p-0 overflow-hidden animate-fade-in ring-1 ring-slate-900/5 group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-transparent to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Header */}
            <div className="p-5 border-b border-slate-100/50 bg-slate-50/50 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                        AI Analysis
                    </h2>
                </div>
                {attributes.ai_powered !== undefined && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${attributes.ai_powered
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}>
                        {attributes.ai_powered ? 'Gemini 1.5 PRO' : 'Quick Scan'}
                    </span>
                )}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 divide-x divide-slate-100/50 border-b border-slate-100/50 relative z-10">
                <AttributeItem label="Category" value={attributes.category} />
                <AttributeItem label="Material" value={attributes.material} />
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-100/50 border-b border-slate-100/50 relative z-10">
                <AttributeItem label="Gemstone" value={attributes.stone_type} />
                <AttributeItem label="Cut Shape" value={attributes.shape} />
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-100/50 relative z-10">
                <AttributeItem label="Style" value={attributes.style} />
                <AttributeItem label="Color" value={attributes.stone_color} />
            </div>

            {/* Confidence Footer */}
            <div className="p-5 bg-slate-50/30 relative z-10">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confidence Score</span>
                    <span className="text-xl font-black text-slate-900">
                        {(attributes.confidence_score * 100).toFixed(0)}<span className="text-sm text-slate-400 font-medium">%</span>
                    </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                        style={{ width: `${attributes.confidence_score * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

function AttributeItem({ label, value }) {
    return (
        <div className="p-4 hover:bg-white/50 transition-colors">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-800 truncate" title={value}>{value || '—'}</p>
        </div>
    );
}
