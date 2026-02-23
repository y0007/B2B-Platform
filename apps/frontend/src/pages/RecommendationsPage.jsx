import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, ShoppingCart, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const RecommendationsPage = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [recommendations, setRecommendations] = useState([]);

    // Fallback if accessed directly
    if (!state) {
        useEffect(() => { navigate('/'); }, [navigate]);
        return null;
    }

    useEffect(() => {
        const fetchRecs = async () => {
            try {
                const res = await fetch('/api/recommendations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageSessionId: state.imageSessionId })
                });
                const data = await res.json();
                setRecommendations(data.recommendations);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchRecs();
    }, [state.imageSessionId]);

    const addToCart = async (sku) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    skuId: sku.id,
                    quantity: sku.moq || 1,
                    notes: `Based on upload: ${state.attributes.category}`,
                    itemData: sku // Pass full object for persistence
                })
            });
            const data = await res.json();
            if (data.cartId) {
                alert("Added to Quote Request!");
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header: Analysis Result */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-1 border-primary-100 bg-primary-50/50">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold text-primary-900 uppercase tracking-wide">Analyzed Attributes</h3>
                        {state.attributes.confidence_score && (
                            <span className="text-[10px] font-bold bg-white/80 text-primary-700 px-2 py-0.5 rounded-full border border-primary-100">
                                {Math.round(state.attributes.confidence_score * 100)}% Match
                            </span>
                        )}
                    </div>
                    <div className="space-y-2">
                        {Object.entries(state.attributes).filter(([k]) => k !== 'confidence_score').map(([key, val]) => (
                            <div key={key} className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 capitalize">{key.replace('_', ' ')}</span>
                                <span className="font-medium text-slate-800">{val || 'N/A'}</span>
                            </div>
                        ))}
                    </div>
                </Card>
                <div className="col-span-2 flex items-center justify-between glass-card p-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">We found 4 matches</h2>
                        <p className="text-slate-500">Based on your design pattern and structure.</p>
                    </div>
                    <Button variant="secondary" onClick={() => navigate('/cart')}>
                        View Request List <ArrowRight size={16} />
                    </Button>
                </div>
            </div>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="h-96 rounded-2xl bg-slate-200 animate-pulse"></div>
                    ))
                ) : (
                    recommendations.map((item) => (
                        <div key={item.id} className="group relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                            <div className="aspect-[4/5] overflow-hidden bg-slate-100 relative">
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-6">
                                    <Button onClick={() => addToCart(item)} className="w-full shadow-none bg-white/90 text-slate-900 hover:bg-white">
                                        <ShoppingCart size={16} /> Add to Quote
                                    </Button>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold tracking-wider ${item.source === 'INTERNAL' ? 'bg-indigo-100 text-indigo-700' : 'bg-pink-100 text-pink-700'}`}>
                                        {item.source === 'INTERNAL' ? 'IN STOCK' : (item.source_label || 'ALIBABA SCOUT')}
                                    </span>
                                    {item.link && (
                                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline text-[10px] font-bold">
                                            VIEW ON ALIBABA
                                        </a>
                                    )}
                                    <span className="text-xs font-semibold text-slate-500">MOQ: {item.moq}</span>
                                </div>
                                <h3 className="font-semibold text-slate-800 mb-1">{item.name}</h3>
                                <p className="text-sm text-slate-500 mb-3">{item.material}</p>
                                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                    <span className="font-bold text-slate-900">{item.price_range}</span>
                                    <span className="text-xs text-slate-400">{item.lead_time_days} days lead</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
