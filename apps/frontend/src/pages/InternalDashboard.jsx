import React, { useEffect, useState } from 'react';
import { LayoutDashboard, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const InternalDashboard = () => {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        fetch('/api/internal/requests')
            .then(res => res.json())
            .then(data => setRequests(data.requests || []))
            .catch(err => console.error(err));
    }, []);

    const handleQuote = async (reqId) => {
        // Mock quoting process
        const amount = prompt("Enter total quote amount ($):", "1500");
        if (!amount) return;

        try {
            await fetch('/api/internal/quote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cartId: reqId,
                    totalPrice: amount,
                    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                })
            });
            alert("Quote Sent!");
            // Refresh
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Internal Dashboard</h1>
                    <p className="text-slate-500">Manage sourcing requests and quotations.</p>
                </div>
                <div className="flex gap-4">
                    <Card className="px-4 py-2 flex items-center gap-2 bg-indigo-50 border-indigo-100">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                        <span className="text-sm font-medium text-indigo-700">System Active</span>
                    </Card>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6">
                <Card className="p-0 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600">Request ID</th>
                                <th className="p-4 font-semibold text-slate-600">Date</th>
                                <th className="p-4 font-semibold text-slate-600">Items</th>
                                <th className="p-4 font-semibold text-slate-600">Status</th>
                                <th className="p-4 font-semibold text-slate-600 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-400">No active requests found.</td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-mono text-sm text-slate-500">#{req.id}</td>
                                        <td className="p-4 text-slate-700">{new Date(req.created_at).toLocaleDateString()}</td>
                                        <td className="p-4 text-slate-700">{req.item_count} items</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${req.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-700' :
                                                    req.status === 'QUOTED' ? 'bg-green-100 text-green-700' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {req.status === 'SUBMITTED' && (
                                                <Button size="sm" onClick={() => handleQuote(req.id)} className="py-1 text-sm bg-slate-900 text-white">
                                                    <DollarSign size={14} className="mr-1" /> Generate Quote
                                                </Button>
                                            )}
                                            {req.status === 'QUOTED' && (
                                                <span className="text-xs text-green-600 font-medium flex items-center justify-end gap-1">
                                                    <CheckCircle size={14} /> Sent
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </Card>
            </div>
        </div>
    );
};
