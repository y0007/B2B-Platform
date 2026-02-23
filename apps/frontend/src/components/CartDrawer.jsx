import React from 'react';
import { X, ShoppingBag, Trash2, Send, Loader2 } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose, items, onRemove, onUpdateQuantity, onSubmit, isSubmitting }) {
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden isolate">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-500"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white/90 backdrop-blur-2xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-white/50">

                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-xl z-20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sourcing Request</h2>
                            <p className="text-sm text-slate-500 font-medium">{totalItems} items selected</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-all duration-200 text-slate-400 hover:text-slate-600 active:scale-95"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 scrollbar-hide">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-2">
                                <ShoppingBag className="w-10 h-10 text-slate-300" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">Your cart is empty</h3>
                                <p className="text-slate-500 mt-2 max-w-[200px] mx-auto">Start adding items from the analysis results to build your request.</p>
                            </div>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="flex gap-5 p-4 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 ring-1 ring-slate-900/5 flex-shrink-0 relative z-10">
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                </div>

                                <div className="flex-1 flex flex-col justify-between py-1 relative z-10">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-slate-900 leading-tight pr-6">{item.name}</h3>
                                            <button
                                                onClick={() => onRemove(item.id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors absolute top-0 right-0 p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-indigo-500 uppercase tracking-widest font-bold mt-1">{item.material || 'Jewelry'}</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1 border border-slate-200/50">
                                            <button
                                                onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all font-bold"
                                            >-</button>
                                            <span className="text-sm font-bold text-slate-900 min-w-[1.5rem] text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all font-bold"
                                            >+</button>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                                            {item.price_range}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="p-8 border-t border-slate-100 bg-white/80 backdrop-blur-xl space-y-6 relative z-20">
                        <div className="space-y-3 pb-2">
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>Estimated Value</span>
                                <span className="font-medium text-slate-900">High Volume</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>Sourcing Fee</span>
                                <span className="font-medium text-green-600">Waived</span>
                            </div>
                        </div>

                        <button
                            disabled={isSubmitting}
                            onClick={onSubmit}
                            className="w-full relative overflow-hidden group btn-primary py-4 flex items-center justify-center gap-3 text-lg font-bold shadow-xl shadow-slate-900/20"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient" />
                            <div className="relative flex items-center gap-3">
                                {isSubmitting ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Submit Request
                                    </>
                                )}
                            </div>
                        </button>
                        <p className="text-[10px] text-center text-slate-400 max-w-xs mx-auto">
                            By submitting, you agree to our premium sourcing terms. A dedicated agent will be assigned to your case immediately.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
