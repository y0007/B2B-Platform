import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import {
    ClipboardList, Clock, CheckCircle2, AlertCircle, FileText,
    DollarSign, Calendar, ChevronRight, Loader2, RefreshCw,
    Building2, Globe, Package, Users, ArrowRight, Eye, Truck
} from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [requestDetails, setRequestDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [quotePrice, setQuotePrice] = useState('');
    const [quoteExpiry, setQuoteExpiry] = useState('');
    const [quoteNotes, setQuoteNotes] = useState('');
    const [isQuoting, setIsQuoting] = useState(false);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await api.getInternalRequests();
            setRequests(data.requests);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    const handleSelectRequest = async (req) => {
        setSelectedRequest(req);
        setQuotePrice('');
        setQuoteExpiry('');
        setQuoteNotes('');
        setDetailsLoading(true);
        try {
            const data = await api.getRequestDetails(req.id);
            setRequestDetails(data);
        } catch (err) {
            console.error('Failed to load request details:', err);
            setRequestDetails(null);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleCreateQuote = async (e) => {
        e.preventDefault();
        setIsQuoting(true);
        try {
            await api.createQuote({
                cartId: selectedRequest.id,
                totalPrice: quotePrice,
                validUntil: quoteExpiry
            });
            alert("Quote created and sent to buyer!");
            setSelectedRequest(null);
            setRequestDetails(null);
            fetchRequests();
        } catch (err) {
            alert("Failed to create quote");
        } finally {
            setIsQuoting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'SUBMITTED': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'QUOTED': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'ORDERED': return 'bg-green-100 text-green-700 border-green-200';
            case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    // Stats
    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'SUBMITTED').length,
        quoted: requests.filter(r => r.status === 'QUOTED').length,
    };

    if (user?.role === 'BUYER') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <AlertCircle className="w-16 h-16 text-amber-500" />
                <h1 className="text-2xl font-bold text-slate-900">Access Restricted</h1>
                <p className="text-slate-500 max-w-md">This dashboard is only available for Sales and Sourcing teams.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Operations Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage incoming sourcing requests and quotations</p>
                </div>
                <button
                    onClick={fetchRequests}
                    className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
                >
                    <RefreshCw className={`w-5 h-5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-4 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100"><ClipboardList className="w-5 h-5 text-slate-600" /></div>
                    <div><p className="text-2xl font-bold text-slate-900">{stats.total}</p><p className="text-xs text-slate-500">Total</p></div>
                </div>
                <div className="glass-card p-4 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-100"><Clock className="w-5 h-5 text-amber-600" /></div>
                    <div><p className="text-2xl font-bold text-slate-900">{stats.pending}</p><p className="text-xs text-slate-500">Pending</p></div>
                </div>
                <div className="glass-card p-4 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-100"><DollarSign className="w-5 h-5 text-blue-600" /></div>
                    <div><p className="text-2xl font-bold text-slate-900">{stats.quoted}</p><p className="text-xs text-slate-500">Quoted</p></div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Requests List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-2 px-1 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                        <ClipboardList className="w-4 h-4" />
                        Active Requests
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center p-20 glass-card">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="glass-card p-20 text-center space-y-4 bg-slate-50/50">
                            <Clock className="w-12 h-12 text-slate-300 mx-auto" />
                            <p className="text-slate-500 font-medium">No new requests at the moment</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {requests.map((req) => (
                                <div
                                    key={req.id}
                                    onClick={() => handleSelectRequest(req)}
                                    className={`glass-card p-5 cursor-pointer transition-all hover:translate-x-1 border-l-4 ${selectedRequest?.id === req.id ? 'border-l-pink-500 bg-white ring-2 ring-pink-100' : 'border-l-transparent'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-slate-900">Request #{req.id}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(req.status)}`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="font-bold text-slate-900">{req.item_count} Items</p>
                                            <ChevronRight className="w-5 h-5 text-slate-300 inline" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Center */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 px-1 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                        <FileText className="w-4 h-4" />
                        Action Center
                    </div>

                    {!selectedRequest ? (
                        <div className="glass-card p-8 text-center bg-slate-50/50 border-dashed border-2">
                            <p className="text-slate-400 text-sm">Select a request to view details and create a quotation</p>
                        </div>
                    ) : (
                        <div className="glass-card p-6 space-y-6 animate-in slide-in-from-bottom-4">
                            {/* Request Items Preview */}
                            {detailsLoading ? (
                                <div className="flex items-center justify-center p-6">
                                    <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
                                </div>
                            ) : requestDetails && requestDetails.items?.length > 0 ? (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Items</h4>
                                    {requestDetails.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                                                <img
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect fill="%23f1f5f9" width="40" height="40"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23cbd5e1" font-size="16">💎</text></svg>'; }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-slate-800 truncate">{item.name}</div>
                                                <div className="text-[10px] text-slate-400">Qty: {item.quantity} • {item.price_range}</div>
                                                {item.suggested_price && (
                                                    <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                                                        Suggested: ${item.suggested_price} (Target Margin applied)
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${item.source === 'INTERNAL' ? 'bg-pink-100 text-pink-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                {item.source === 'INTERNAL' ? 'INT' : 'EXT'}
                                            </span>
                                        </div>
                                    ))}
                                    {requestDetails.request?.user_email && (
                                        <p className="text-[11px] text-slate-400 pt-1">
                                            Buyer: <span className="font-semibold">{requestDetails.request.user_email}</span>
                                        </p>
                                    )}
                                </div>
                            ) : null}

                            <div className="border-t border-slate-100 pt-4 space-y-2">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Create Quotation</h3>
                                        <p className="text-xs text-slate-500 tracking-wide uppercase font-bold">Request #{selectedRequest.id}</p>
                                    </div>
                                    {requestDetails?.items?.some(i => i.suggested_price) && (
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase">Total Recommended</div>
                                            <div className="text-lg font-black text-emerald-600">
                                                ${requestDetails.items.reduce((acc, i) => acc + (i.suggested_price || 0) * (i.quantity || 1), 0)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <form onSubmit={handleCreateQuote} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600 uppercase">Total Sourcing Price (USD)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <input
                                            type="number"
                                            required
                                            value={quotePrice}
                                            onChange={(e) => setQuotePrice(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600 uppercase">Quote Valid Until</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <input
                                            type="date"
                                            required
                                            value={quoteExpiry}
                                            onChange={(e) => setQuoteExpiry(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600 uppercase">Notes (Optional)</label>
                                    <textarea
                                        value={quoteNotes}
                                        onChange={(e) => setQuoteNotes(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all resize-none text-sm"
                                        placeholder="Payment terms, customization notes..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isQuoting}
                                    className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-bold"
                                >
                                    {isQuoting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Formal Quote'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setSelectedRequest(null); setRequestDetails(null); }}
                                    className="w-full py-2.5 text-slate-500 text-sm font-medium hover:text-slate-900 transition-colors"
                                >
                                    Cancel
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
