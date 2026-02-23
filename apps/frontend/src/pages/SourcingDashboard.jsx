import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import {
    Search, Package, Clock, CheckCircle2, XCircle, AlertCircle,
    Loader2, RefreshCw, Building2, Globe, ChevronRight, Eye,
    DollarSign, Layers, ArrowRight, Truck, Star
} from 'lucide-react';

export default function SourcingDashboard() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [requestDetails, setRequestDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [filter, setFilter] = useState('ALL');

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

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.updateRequestStatus(id, status);
            fetchRequests(); // Refresh list
            setSelectedRequest(prev => ({ ...prev, status }));
        } catch (err) {
            alert('Failed to update status');
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

    const getStatusIcon = (status) => {
        switch (status) {
            case 'SUBMITTED': return Clock;
            case 'QUOTED': return DollarSign;
            case 'ORDERED': return CheckCircle2;
            case 'REJECTED': return XCircle;
            default: return AlertCircle;
        }
    };

    const filteredRequests = filter === 'ALL'
        ? requests
        : requests.filter(r => r.status === filter);

    // Stats
    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'SUBMITTED').length,
        quoted: requests.filter(r => r.status === 'QUOTED').length,
        ordered: requests.filter(r => r.status === 'ORDERED').length,
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Search className="w-8 h-8 text-pink-600" />
                        Sourcing Dashboard
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Review feasibility, map designs, and validate manufacturability
                    </p>
                </div>
                <button
                    onClick={fetchRequests}
                    className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
                >
                    <RefreshCw className={`w-5 h-5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </header>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Requests', value: stats.total, icon: Layers, color: 'text-slate-600 bg-slate-50' },
                    { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
                    { label: 'Quoted', value: stats.quoted, icon: DollarSign, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Ordered', value: stats.ordered, icon: Truck, color: 'text-green-600 bg-green-50' },
                ].map((stat) => (
                    <div key={stat.label} className={`glass-card p-4 flex items-center gap-3 ${stat.color} border border-slate-100`}>
                        <div className="p-2 rounded-xl bg-white/80 border border-slate-100">
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stat.value}</p>
                            <p className="text-xs font-medium opacity-70">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {['ALL', 'SUBMITTED', 'QUOTED', 'ORDERED', 'REJECTED'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${filter === f
                            ? 'bg-slate-900 text-white shadow-lg'
                            : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
                            }`}
                    >
                        {f} {f !== 'ALL' && <span className="ml-1 opacity-50">({requests.filter(r => r.status === f).length})</span>}
                    </button>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Requests List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center p-20 glass-card">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="glass-card p-16 text-center">
                            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No requests found</p>
                        </div>
                    ) : (
                        filteredRequests.map((req) => {
                            const StatusIcon = getStatusIcon(req.status);
                            return (
                                <div
                                    key={req.id}
                                    onClick={() => handleSelectRequest(req)}
                                    className={`glass-card p-4 cursor-pointer transition-all hover:shadow-md border-l-4 ${selectedRequest?.id === req.id
                                        ? 'border-l-pink-500 bg-white ring-2 ring-pink-100'
                                        : 'border-l-transparent'
                                        }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${getStatusColor(req.status)}`}>
                                                <StatusIcon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 text-sm">Request #{req.id}</div>
                                                <div className="text-xs text-slate-400">{new Date(req.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(req.status)}`}>
                                                {req.status}
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium">
                                                {req.item_count || 0} items
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-slate-300" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Request Detail Panel */}
                <div>
                    {!selectedRequest ? (
                        <div className="glass-card p-12 text-center border-dashed border-2 border-slate-200 min-h-[400px] flex flex-col items-center justify-center">
                            <Eye className="w-12 h-12 text-slate-200 mb-4" />
                            <p className="text-slate-400 text-sm font-medium">Select a request to review</p>
                            <p className="text-slate-300 text-xs mt-1">View items, validate feasibility, and manage sourcing</p>
                        </div>
                    ) : detailsLoading ? (
                        <div className="glass-card p-12 flex items-center justify-center min-h-[400px]">
                            <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
                        </div>
                    ) : requestDetails ? (
                        <div className="glass-card p-6 space-y-6 animate-in slide-in-from-right-4 duration-300">
                            {/* Request Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Request #{selectedRequest.id}</h3>
                                    <p className="text-xs text-slate-500">
                                        {requestDetails.request?.user_email || 'Unknown buyer'}
                                        <span className="mx-1">•</span>
                                        {new Date(selectedRequest.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(selectedRequest.status)}`}>
                                    {selectedRequest.status}
                                </span>
                            </div>

                            {/* Items List */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Items in Request</h4>
                                {(requestDetails.items || []).length === 0 ? (
                                    <p className="text-sm text-slate-400">No items found</p>
                                ) : (
                                    requestDetails.items.map((item, idx) => (
                                        <div key={item.id || idx} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                                                <img
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect fill="%23f1f5f9" width="64" height="64"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23cbd5e1" font-size="24">💎</text></svg>'; }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-sm text-slate-900 truncate">{item.name || 'Unnamed Item'}</div>
                                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        {item.source === 'INTERNAL'
                                                            ? <><Building2 className="w-3 h-3" /> Internal</>
                                                            : <><Globe className="w-3 h-3" /> Sourced</>
                                                        }
                                                    </span>
                                                    <span>Qty: {item.quantity}</span>
                                                    <span>{item.price_range}</span>
                                                    {item.suggested_price && (
                                                        <span className="text-emerald-600 font-bold border-l pl-3">Suggested: ${item.suggested_price}</span>
                                                    )}
                                                    {item.link && (
                                                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 border-l pl-3">
                                                            <Globe className="w-2.5 h-2.5" /> View Listing
                                                        </a>
                                                    )}
                                                </div>
                                                {item.notes && (
                                                    <p className="text-xs text-slate-400 mt-1 italic">"{item.notes}"</p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Sourcing Action Area */}
                            <div className="border-t border-slate-100 pt-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sourcing & Vetting Actions</h4>
                                    <span className="text-[10px] text-pink-500 font-bold px-2 py-0.5 bg-pink-50 rounded-full border border-pink-100">INTERNAL OPS</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleStatusUpdate(selectedRequest.id, 'QUOTED')} // Transition to where sales can quote
                                        disabled={selectedRequest.status !== 'SUBMITTED'}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-emerald-700 rounded-xl text-xs font-bold border-2 border-emerald-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        Approve Feasibility
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(selectedRequest.id, 'REJECTED')}
                                        disabled={selectedRequest.status === 'REJECTED' || selectedRequest.status === 'ORDERED'}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-red-600 rounded-xl text-xs font-bold border-2 border-red-100 hover:border-red-500 hover:bg-red-50 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        <XCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        Reject Design
                                    </button>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <ArrowRight size={80} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 text-pink-400 mb-1">
                                            <Star className="w-3 h-3 fill-current" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Next Step</span>
                                        </div>
                                        <h5 className="font-bold text-sm">Ready for Sales Review?</h5>
                                        <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                                            Approving feasibility notifies the Sales team that designs are manufacturable and ready for final pricing.
                                        </p>
                                        <button
                                            onClick={() => handleStatusUpdate(selectedRequest.id, 'QUOTED')}
                                            disabled={selectedRequest.status !== 'SUBMITTED'}
                                            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-600 text-white rounded-lg text-xs font-bold hover:bg-pink-500 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                            Forward to Sales Team
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card p-12 text-center border-2 border-slate-100">
                            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm font-medium">Request Details Unavailable</p>
                            <p className="text-slate-400 text-xs mt-1">Try selecting a different request from the list</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
