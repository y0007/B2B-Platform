import React from 'react';
import { ExternalLink, ShoppingBag, Truck, ShoppingCart } from 'lucide-react';

export function RecommendationList({ recommendations, onAddToCart }) {
    if (!recommendations || recommendations.length === 0) return null;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Sourcing Recommendations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendations.map((item) => (
                    <div key={item.id} className="glass-card group overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <div className="aspect-[4/3] overflow-hidden relative">
                            <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2 right-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${item.source === 'INTERNAL'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-purple-100 text-purple-700'
                                    }`}>
                                    {item.source}
                                </span>
                            </div>
                        </div>

                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{item.name}</h3>
                            </div>
                            <div className="flex items-center justify-between mt-auto pt-2">
                                <span className="text-xl font-bold text-slate-900">{item.price_range}</span>
                                <button
                                    onClick={() => onAddToCart(item)}
                                    className="p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10 group-hover:px-4 flex items-center gap-2 overflow-hidden whitespace-nowrap"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    <span className="max-w-0 opacity-0 group-hover:max-w-20 group-hover:opacity-100 transition-all duration-300 text-sm font-medium">Add to Cart</span>
                                </button>
                            </div>

                            <p className="text-sm text-slate-600 mb-4 line-clamp-2">{item.description}</p>

                            <div className="flex items-center gap-4 text-xs text-slate-500 mb-6">
                                <div className="flex items-center gap-1">
                                    <ShoppingBag className="w-3 h-3" />
                                    MOQ: {item.moq} pcs
                                </div>
                                <div className="flex items-center gap-1">
                                    <Truck className="w-3 h-3" />
                                    Lead: {item.lead_time_days} days
                                </div>
                            </div>

                            <button className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2 font-medium">
                                View Details <ExternalLink className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
