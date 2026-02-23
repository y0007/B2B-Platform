import React, { useState, useRef } from 'react';
import { api } from '../api';
import { ImageUpload } from '../components/ImageUpload';
import { AnalysisResults } from '../components/AnalysisResults';
import { AlibabaMatches } from '../components/AlibabaMatches';
import CartDrawer from '../components/CartDrawer';
import { ShoppingBag, ChevronRight, ShoppingCart } from 'lucide-react';

export function Home() {
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Alibaba Similarity State
    const [alibabaMatches, setAlibabaMatches] = useState([]);
    const [alibabaLoading, setAlibabaLoading] = useState(false);

    // Keep a reference to the uploaded file for similarity search
    const uploadedFileRef = useRef(null);

    // Cart State
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUploadComplete = async (file) => {
        setIsAnalyzing(true);
        uploadedFileRef.current = file;
        setAlibabaMatches([]);

        try {
            const { imageSessionId } = await api.uploadImage(file);
            const analysisRes = await api.analyzeImage(imageSessionId);
            setAnalysis(analysisRes.attributes);

            // --- Alibaba Cloud Image Search ---
            // Send image directly to Alibaba Cloud for visual matching
            const detectedCategory = (analysisRes.attributes.category || 'jewelry').toLowerCase();

            setAlibabaLoading(true);
            try {
                const similarResults = await api.searchSimilar(file, detectedCategory);
                setAlibabaMatches(similarResults);
            } catch (err) {
                console.error('Alibaba Cloud search failed:', err);
                // Silently fail — don't block the main flow
            }
            setAlibabaLoading(false);

        } catch (err) {
            console.error(err);
            alert("Analysis failed. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const addToCart = (product) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const updateQuantity = (id, quantity) => {
        setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
    };

    const removeFromCart = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const handleSubmitCart = async () => {
        setIsSubmitting(true);
        try {
            // In a real app, we'd send item IDs and quantities
            await api.submitCart({ items: cartItems });
            alert("Sourcing request submitted successfully! Our sales team will contact you.");
            setCartItems([]);
            setIsCartOpen(false);
        } catch (err) {
            alert("Submission failed. Ensure you are signed in.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 relative selection:bg-pink-100 selection:text-pink-900">
            {/* Ambient Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl mix-blend-multiply opacity-50 animate-blob" />
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl mix-blend-multiply opacity-50 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl mix-blend-multiply opacity-50 animate-blob animation-delay-4000" />
            </div>

            {/* Hero Section */}
            <div className="relative overflow-hidden bg-slate-900 text-white pb-24 pt-16 lg:pt-24 isolate">
                {/* Hero Backgound Effects */}
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.pink.900),theme(colors.slate.900))] opacity-40" />
                <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-white/5 shadow-xl shadow-pink-600/10 ring-1 ring-white/10 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />

                <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 blur-3xl opacity-30 pointer-events-none overflow-visible">
                    <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }} />
                </div>

                <div className="mx-auto max-w-7xl px-6 lg:px-8 relative">
                    <div className="mx-auto max-w-2xl text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                            <span className="block text-slate-200">Design to</span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-300 via-rose-200 to-indigo-300">
                                Global Source
                            </span>
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-slate-300">
                            Upload an image of jewelry or fashion items to instantly analyze materials and find matching <span className="text-pink-300 font-medium">high-quality suppliers</span> from our curated network.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content - Overlapping the Hero */}
            <div className="mx-auto max-w-7xl px-6 lg:px-8 -mt-16 pb-20 relative z-10">
                <div className="grid lg:grid-cols-12 gap-8 items-start">

                    {/* Left Column: Input & Analysis */}
                    <div className="lg:col-span-5 space-y-6">
                        <section className="glass-card p-1 rounded-3xl shadow-xl backdrop-blur-xl bg-pink-50/70 border border-white/50 overflow-hidden relative group ring-1 ring-slate-900/5 hover:ring-pink-500/20 transition-all duration-500">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 p-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600">
                                        <div className="w-2.5 h-2.5 rounded-full bg-current" />
                                    </div>
                                    Input Image
                                </h3>
                                <ImageUpload onUploadComplete={handleUploadComplete} isAnalyzing={isAnalyzing} />
                            </div>
                        </section>

                        {analysis && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                                <AnalysisResults attributes={analysis} />
                            </div>
                        )}
                    </div>

                    {/* Right Column: Sourcing Matches */}
                    <div className="lg:col-span-7 space-y-6">
                        <section className="glass-card rounded-3xl shadow-xl backdrop-blur-xl bg-pink-50/80 border border-white/50 min-h-[600px] flex flex-col ring-1 ring-slate-900/5">
                            <div className="p-6 border-b border-pink-100/50 flex justify-between items-center bg-gradient-to-r from-pink-50/40 to-pink-50/30">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <ShoppingBag className="w-6 h-6 text-pink-600" />
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                                        Global Matches
                                    </span>
                                </h3>
                                {alibabaMatches.length > 0 && (
                                    <span className="px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-bold border border-pink-200 shadow-sm">
                                        {alibabaMatches.length} Matches Found
                                    </span>
                                )}
                            </div>

                            <div className="p-6 flex-1 flex flex-col relative">
                                {/* Ambient decorative blob inside results */}
                                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-b-3xl">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-100/30 rounded-full blur-3xl opacity-50" />
                                </div>

                                {/* State 1: Loading (Skeleton) */}
                                {(isAnalyzing || alibabaLoading) && (
                                    <div className="flex-1 flex flex-col items-center justify-center p-12 relative z-10">
                                        <div className="relative w-24 h-24 mb-8">
                                            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                                            <div className="absolute inset-0 rounded-full border-4 border-pink-500 border-t-transparent animate-spin"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                                                    <ShoppingBag className="w-6 h-6 text-pink-500 animate-pulse" />
                                                </div>
                                            </div>
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-900">Scanning Global Inventory...</h4>
                                        <p className="text-slate-500 text-sm mt-3 max-w-xs text-center leading-relaxed">
                                            Comparing visual features against <span className="font-semibold text-pink-600">50M+ items</span> in our partner network.
                                        </p>
                                    </div>
                                )}

                                {/* State 2: Results Found */}
                                {!isAnalyzing && !alibabaLoading && alibabaMatches.length > 0 && (
                                    <div className="animate-in fade-in zoom-in-95 duration-500 relative z-10">
                                        <AlibabaMatches matches={alibabaMatches} loading={false} onAddToCart={addToCart} />
                                    </div>
                                )}

                                {/* State 3: No Results Found */}
                                {!isAnalyzing && !alibabaLoading && alibabaMatches.length === 0 && analysis && (
                                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-75 relative z-10">
                                        <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mb-6 border border-pink-100 shadow-inner">
                                            <ShoppingBag className="w-8 h-8 text-pink-300" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-800">No signals found</h3>
                                        <p className="text-slate-500 text-sm mt-2 max-w-sm">
                                            We couldn't find a strong visual match in our database. Try a clearer image or a different angle.
                                        </p>
                                    </div>
                                )}

                                {/* State 4: Initial Placeholder */}
                                {!isAnalyzing && !analysis && (
                                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative z-10">
                                        <div className="w-32 h-32 bg-gradient-to-b from-pink-50 to-pink-50/50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-pink-50 group-hover:scale-105 transition-transform duration-500">
                                            <ChevronRight className="w-12 h-12 text-pink-200 ml-1" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-3">Ready to Source</h3>
                                        <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                                            Upload an image on the left to start the visual sourcing process effectively.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                items={cartItems}
                onRemove={removeFromCart}
                onUpdateQuantity={updateQuantity}
                onSubmit={handleSubmitCart}
                isSubmitting={isSubmitting}
            />

            {cartItems.length > 0 && !isCartOpen && (
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="fixed bottom-8 right-8 bg-slate-900 text-white p-4 rounded-2xl flex items-center gap-3 shadow-2xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-8 duration-500 z-50 ring-4 ring-pink-500/30"
                >
                    <div className="relative">
                        <ShoppingCart className="w-6 h-6" />
                        <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900 shadow-md">
                            {cartItems.length}
                        </span>
                    </div>
                    <span className="font-bold pr-2 text-pink-50">View Request</span>
                </button>
            )}
        </div>
    );
}
