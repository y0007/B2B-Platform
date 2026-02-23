import React, { useEffect, useState } from 'react';
import { Send, Trash2, FileText } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const CartPage = () => {
    // For V1, we naively use the first cart or just assume cart ID 1 for simplicity if not stored.
    // In a real app, manage via context. Here we cheat and ask the API for "my" cart or just show empty if no ID.
    // But since we didn't store cartId in frontend state globally, let's assume we can fetch the latest Draft cart.
    // Actually, `RecommendationsPage` added to a cart and alerted. Let's assume we store it in localStorage for this demo.

    const [cartId, setCartId] = useState(localStorage.getItem('vs_cart_id') || '1');
    const [items, setItems] = useState([]);
    const [status, setStatus] = useState('DRAFT');

    useEffect(() => {
        // Mock fetching cart items. If we don't have a real ID, we might fail.
        // Let's rely on the add-to-cart logic returning a ID and saving it.
        // For this demo, let's just try to fetch cart 1.
        fetch(`/api/cart/${cartId}`)
            .then(res => res.json())
            .then(data => {
                if (data.items) {
                    setItems(data.items);
                    if (data.items.length > 0) setStatus('DRAFT'); // Simplified
                }
            })
            .catch(err => console.error(err));
    }, [cartId]);

    const handleSubmit = async () => {
        try {
            const res = await fetch('/api/cart/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartId })
            });
            const data = await res.json();
            if (data.status === 'SUBMITTED') {
                setStatus('SUBMITTED');
                alert("Request Submitted to Sourcing Team!");
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400">
                <FileText size={48} className="mb-4 opacity-50" />
                <p>Your quote request list is empty.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
            <h1 className="text-3xl font-bold text-slate-900">Request for Quote</h1>

            <div className="space-y-4">
                {items.map((item, idx) => (
                    <Card key={idx} className="flex items-center gap-6 p-4">
                        <img src={item.image_url} alt={item.name} className="w-24 h-24 object-cover rounded-lg bg-slate-100" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">{item.name}</h3>
                            <p className="text-sm text-slate-500">{item.material}</p>
                            <p className="text-xs text-slate-400 mt-1">Ref: {item.sku_id}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-slate-600">Qty: {item.quantity}</div>
                            <div className="text-xs text-slate-400">Est. {item.price_range}</div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-200">
                {status === 'SUBMITTED' ? (
                    <Button disabled className="bg-green-600 text-white">
                        <CheckCircle2 size={18} /> Request Submitted
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} className="w-64">
                        Submit Request <Send size={18} />
                    </Button>
                )}
            </div>
        </div>
    );
};
