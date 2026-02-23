import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { ShoppingBag, Clock, CheckCircle2, DollarSign, Calendar, ArrowRight, Package, MessageCircle } from 'lucide-react';

export default function MyRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const data = await api.getMyRequests();
            setRequests(data.requests);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAcceptQuote = async (id) => {
        if (!confirm('Proceed to place official order?')) return;
        try {
            await api.acceptQuote(id);
            fetchRequests(); // Refresh list
        } catch (err) {
            alert('Failed to accept quote. Please try again.');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 py-8 animate-fade-in px-4">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-2xl shadow-slate-200">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-pink-500 mb-2">
                        <ShoppingBag className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">Customer Portal</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Your Sourcing Pipeline</h1>
                    <p className="text-slate-300 max-w-lg">Track your requests, review official quotations, and manage your manufacturing lifecycle.</p>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4 glass-card">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-pink-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading your history...</p>
                </div>
            ) : requests.length === 0 ? (
                <div className="glass-card p-16 text-center space-y-6 border-dashed border-2 border-slate-200 bg-slate-50/30">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="w-10 h-10 text-slate-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No Requests Yet</h3>
                        <p className="text-slate-500 max-w-md mx-auto">Start by uploading an image to find products. Your sourcing requests will appear here.</p>
                    </div>
                    <a href="/" className="inline-flex items-center gap-2 btn-primary">
                        <ArrowRight className="w-4 h-4" /> Start Sourcing
                    </a>
                </div>
            ) : (
                <div className="grid gap-6">
                    {requests.map(req => (
                        <div key={req.id} className="glass-card group hover:shadow-xl hover:shadow-pink-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                            {/* Status Stripe */}
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${req.status === 'ORDERED' ? 'bg-gradient-to-b from-pink-500 to-rose-600' :
                                req.status === 'QUOTED' ? 'bg-gradient-to-b from-blue-400 to-blue-600' :
                                    req.status === 'SUBMITTED' ? 'bg-gradient-to-b from-amber-400 to-amber-600' : 'bg-slate-200'
                                }`}></div>

                            <div className="p-6 pl-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                {/* Basic Info */}
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-white shadow-sm border border-slate-100 rounded-2xl relative">
                                            <Package className="w-6 h-6 text-slate-800" />
                                            {req.status === 'ORDERED' && (
                                                <div className="absolute -top-1 -right-1 bg-pink-500 text-white p-1 rounded-full border-2 border-white shadow-sm">
                                                    <CheckCircle2 className="w-2 h-2" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-start md:items-center flex-col md:flex-row gap-2 mb-1">
                                                <h3 className="text-lg font-bold text-slate-900">Request #{req.id}</h3>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${req.status === 'SUBMITTED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        req.status === 'QUOTED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            req.status === 'ORDERED' ? 'bg-pink-50 text-pink-700 border-pink-200 shadow-sm shadow-pink-100' :
                                                                'bg-slate-50 text-slate-600 border-slate-200'
                                                    }`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(req.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Content based on Status */}
                                <div className="flex items-center justify-end lg:w-3/5">
                                    {req.status === 'ORDERED' ? (
                                        <div className="w-full bg-pink-50/50 border border-pink-100 rounded-2xl px-6 py-4 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 text-pink-600 mb-0.5">
                                                    <CheckCircle2 className="w-4 h-4 fill-pink-600 text-white" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Order Confirmed</span>
                                                </div>
                                                <p className="text-xs text-slate-500">Our operations team is now processing fulfillment.</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-slate-900">${parseFloat(req.total_price).toLocaleString()}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">Paid & Locked</div>
                                            </div>
                                        </div>
                                    ) : req.total_price ? (
                                        <div className="w-full relative group/quote bg-white border-2 border-blue-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 transition-all hover:shadow-xl hover:border-blue-500">
                                            <div className="flex-1 w-full text-center sm:text-left">
                                                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                                    <DollarSign className="w-3 h-3 text-blue-600" />
                                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Review Official Quote</p>
                                                </div>
                                                <div className="flex items-baseline justify-center sm:justify-start gap-1">
                                                    <span className="text-3xl font-black text-slate-900">${parseFloat(req.total_price).toLocaleString()}</span>
                                                    <span className="text-xs text-slate-500 font-bold uppercase">{req.currency || 'USD'}</span>
                                                </div>
                                                {req.valid_until && (
                                                    <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-center sm:justify-start gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Valid until {new Date(req.valid_until).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleAcceptQuote(req.id)}
                                                className="w-full sm:w-auto px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-pink-600 hover:shadow-lg hover:shadow-pink-200 transition-all active:scale-95 flex items-center justify-center gap-2 group-hover/quote:animate-pulse shadow-sm"
                                            >
                                                Accept & Place Order
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-full flex items-center justify-center sm:justify-end gap-3 text-slate-400 px-6 py-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                            </span>
                                            <span className="text-sm font-medium italic">Vetting in progress... Sales will quote shortly.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
