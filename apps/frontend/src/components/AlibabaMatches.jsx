import React from 'react';
import { ExternalLink, Star, Sparkles, Search, Building2, Globe, Package, Clock, ShoppingCart, DollarSign, Layers } from 'lucide-react';

export function AlibabaMatches({ matches, loading, onAddToCart }) {
    if (loading) {
        return (
            <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-indigo-500 animate-pulse" />
                    <h2 className="text-xl font-bold text-slate-800">Searching Global & Internal Sources...</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-64 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50 animate-pulse border border-slate-100" />
                    ))}
                </div>
            </div>
        );
    }

    if (!matches || matches.length === 0) return null;

    // Split: 1 best match (Primary Recommendation) + rest as alternatives
    const bestMatch = matches[0];
    const alternatives = matches.slice(1, 5); // 3-4 alternatives per BRD

    const getSimilarityBadge = (score) => {
        if (score >= 0.90) return { label: 'Exact Match', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
        if (score >= 0.80) return { label: 'High Similarity', color: 'bg-pink-100 text-pink-700 border-pink-200' };
        return { label: 'Visual Match', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    };

    const getSourceStyle = (source) => {
        if (source === 'INTERNAL') return {
            gradient: 'from-pink-500 to-rose-600',
            bg: 'bg-pink-50',
            border: 'border-pink-200',
            text: 'text-pink-700',
            label: 'IN STOCK',
            icon: Building2
        };
        return {
            gradient: 'from-indigo-500 to-violet-600',
            bg: 'bg-indigo-50',
            border: 'border-indigo-200',
            text: 'text-indigo-700',
            label: 'SOURCED',
            icon: Globe
        };
    };

    const bestMatchStyle = getSourceStyle(bestMatch.source);
    const BestIcon = bestMatchStyle.icon;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Primary Buying Recommendation (Tile 1) */}
            <div className="mb-2">
                <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-pink-500 fill-pink-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Recommendation</span>
                </div>

                <div className={`relative overflow-hidden rounded-2xl border-2 ${bestMatchStyle.border} bg-gradient-to-br from-pink-50 to-slate-50 shadow-lg group`}>
                    <div className={`absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r ${bestMatchStyle.gradient} text-white rounded-full text-xs font-bold shadow-lg`}>
                        <Star className="w-3 h-3 fill-current" />
                        BEST MATCH
                    </div>

                    <div className={`absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-xs font-bold rounded-full shadow-sm border ${bestMatchStyle.border} ${bestMatchStyle.text}`}>
                        <BestIcon className="w-3 h-3" />
                        {bestMatchStyle.label}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2">
                        <div className="aspect-square overflow-hidden bg-pink-50">
                            <img
                                src={bestMatch.image_url}
                                alt={bestMatch.name || 'Best match'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="%23f1f5f9" width="200" height="200" rx="8"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23cbd5e1" font-size="48">💎</text></svg>';
                                }}
                            />
                        </div>
                        <div className="p-6 flex flex-col justify-center">
                            <div className="mb-3">
                                <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${getSimilarityBadge(bestMatch.similarity_score).color}`}>
                                    {getSimilarityBadge(bestMatch.similarity_score).label}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-1">
                                {bestMatch.name || (bestMatch.source === 'INTERNAL' ? 'In-Stock Item' : 'Supplier Match')}
                            </h3>
                            {bestMatch.description && (
                                <p className="text-sm text-slate-500 mb-3">{bestMatch.description}</p>
                            )}

                            {/* Key Details Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <DollarSign className="w-4 h-4 text-slate-400" />
                                    <div>
                                        <div className="text-[10px] uppercase text-slate-400 font-bold">Price</div>
                                        <div className="font-bold text-slate-900">{bestMatch.price_range || 'Request Quote'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Package className="w-4 h-4 text-slate-400" />
                                    <div>
                                        <div className="text-[10px] uppercase text-slate-400 font-bold">MOQ</div>
                                        <div className="font-bold text-slate-900">{bestMatch.moq || 'N/A'} pcs</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <div>
                                        <div className="text-[10px] uppercase text-slate-400 font-bold">Lead Time</div>
                                        <div className="font-bold text-slate-900">{bestMatch.lead_time_days || 'N/A'} days</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Layers className="w-4 h-4 text-slate-400" />
                                    <div>
                                        <div className="text-[10px] uppercase text-slate-400 font-bold">Material</div>
                                        <div className="font-bold text-slate-900">{bestMatch.material || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Similarity Bar */}
                            <div className="mb-4">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-400 font-medium">Match Confidence</span>
                                    <span className="font-bold text-slate-700">{(bestMatch.similarity_score * 100).toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${bestMatchStyle.gradient} rounded-full transition-all duration-1000 ease-out`}
                                        style={{ width: `${bestMatch.similarity_score * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                {onAddToCart && (
                                    <button
                                        onClick={() => onAddToCart(bestMatch)}
                                        className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r ${bestMatchStyle.gradient} text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all active:scale-95`}
                                    >
                                        <ShoppingCart className="w-4 h-4" />
                                        Add to Request
                                    </button>
                                )}
                                <a
                                    href={bestMatch.link || bestMatch.image_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all active:scale-95"
                                    title="View product on Alibaba"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Design Alternatives (Tiles 2-4) */}
            {alternatives.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Design Alternatives</span>
                        <span className="text-[10px] text-slate-400">({alternatives.length} options)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {alternatives.map((match, index) => {
                            const style = getSourceStyle(match.source);
                            const badge = getSimilarityBadge(match.similarity_score);
                            const MatchIcon = style.icon;

                            return (
                                <div
                                    key={match.id || match.product_id || index}
                                    className="glass-card group overflow-hidden hover:shadow-xl transition-all duration-300 border border-slate-100"
                                >
                                    <div className="aspect-square overflow-hidden relative bg-slate-50">
                                        <img
                                            src={match.image_url}
                                            alt={match.name || `Alternative ${index + 1}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="%23f1f5f9" width="200" height="200" rx="8"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23cbd5e1" font-size="48">💎</text></svg>';
                                            }}
                                        />
                                        <div className="absolute top-2 right-2">
                                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold border glass-effect ${style.text}`}>
                                                {(match.similarity_score * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="absolute top-2 left-2">
                                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold bg-pink-50/90 border ${style.border} ${style.text} flex items-center gap-1`}>
                                                <MatchIcon size={10} />
                                                {style.label}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-3 space-y-2">
                                        <h4 className="text-sm font-bold text-slate-800 truncate">
                                            {match.name || 'Design Alternative'}
                                        </h4>
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span className="font-bold text-slate-900">{match.price_range || 'Quote'}</span>
                                            <span>MOQ: {match.moq || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-slate-400">
                                            <span>{match.material || ''}</span>
                                            <span>{match.lead_time_days ? `${match.lead_time_days}d` : ''}</span>
                                        </div>
                                        <div className="flex gap-1.5 pt-1">
                                            {onAddToCart && (
                                                <button
                                                    onClick={() => onAddToCart(match)}
                                                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-2 bg-slate-900 text-white rounded-xl font-medium text-xs hover:bg-slate-800 transition-all active:scale-95"
                                                >
                                                    <ShoppingCart className="w-3 h-3" />
                                                    Add
                                                </button>
                                            )}
                                            <a
                                                href={match.link || match.image_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-1 px-2 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs hover:bg-slate-50 transition-all active:scale-95"
                                                title="View product on Alibaba"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
