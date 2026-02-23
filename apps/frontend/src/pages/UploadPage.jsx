import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Loader2, Sparkles } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const UploadPage = () => {
    const navigate = useNavigate();
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!file) return;

        setUploading(true);
        try {
            // 1. Upload
            const formData = new FormData();
            formData.append('image', file);

            const uploadRes = await fetch('/api/image/upload', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadRes.json();

            if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');

            setUploading(false);
            setAnalyzing(true);

            // 2. Analyze
            const analyzeRes = await fetch('/api/image/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageSessionId: uploadData.imageSessionId })
            });
            const analyzeData = await analyzeRes.json();

            // 3. Navigate with state
            navigate('/recommendations', {
                state: {
                    imageSessionId: uploadData.imageSessionId,
                    attributes: analyzeData.attributes,
                    imageUrl: URL.createObjectURL(file) // For preview
                }
            });

        } catch (err) {
            console.error(err);
            setUploading(false);
            setAnalyzing(false);
            alert("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">

            <div className="mb-10 animate-fade-in-up">
                <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 mb-4">
                    Visual Sourcing
                </h1>
                <p className="text-lg text-slate-600 max-w-xl mx-auto">
                    Transform your inspiration into manufacturable products.
                    Upload an image to get started.
                </p>
            </div>

            <Card className="max-w-xl w-full mx-auto relative overflow-hidden group">
                <div
                    className={`border-2 border-dashed rounded-xl p-12 transition-all duration-300 ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50'}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    {!file ? (
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-16 h-16 bg-gradient-to-tr from-primary-100 to-white rounded-full flex items-center justify-center shadow-inner">
                                <UploadCloud className="text-primary-500 w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-lg font-medium text-slate-700">Drag and drop your image</p>
                                <p className="text-sm text-slate-500 mt-1">or click to browse</p>
                            </div>
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleChange}
                                accept="image/*"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            {uploading || analyzing ? (
                                <div className="flex flex-col items-center animate-pulse">
                                    <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
                                    <p className="text-slate-600 font-medium">
                                        {uploading ? 'Uploading your design...' : 'Analyzing pattern & structure...'}
                                    </p>
                                </div>
                            ) : (
                                <div className="relative w-full">
                                    <img src={URL.createObjectURL(file)} alt="Preview" className="h-48 w-full object-cover rounded-lg shadow-sm" />
                                    <button
                                        onClick={() => setFile(null)}
                                        className="absolute top-2 right-2 bg-white/80 p-1 rounded-full text-slate-600 hover:text-red-500 transition-colors"
                                    >
                                        ×
                                    </button>
                                    <div className="mt-6">
                                        <Button onClick={handleSubmit} className="w-full">
                                            <Sparkles size={18} />
                                            Analyze & Source
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>

            <div className="mt-8 flex gap-8 text-slate-400 text-sm">
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400"></div> AI Interpretation</span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400"></div> 24h Feasibility Check</span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-400"></div> Smart Factory Match</span>
            </div>
        </div>
    );
};
