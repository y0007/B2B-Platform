import React, { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';

export function ImageUpload({ onUploadComplete }) {
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFile = async (file) => {
        if (!file) return;

        // Preview
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        setUploading(true);
        try {
            await onUploadComplete(file);
        } catch (err) {
            console.error(err);
            alert("Upload failed");
            setPreview(null);
        } finally {
            setUploading(false);
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const onChange = (e) => {
        if (e.target.files?.[0]) {
            handleFile(e.target.files[0]);
        }
    };

    if (preview) {
        return (
            <div className="relative w-full max-w-md mx-auto aspect-square rounded-2xl overflow-hidden glass-card">
                <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                {uploading && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            </div>
                        </div>
                        <p className="mt-4 font-semibold text-lg tracking-wide text-white drop-shadow-md">Analyzing...</p>
                    </div>
                )}
                {!uploading && (
                    <button
                        onClick={() => setPreview(null)}
                        className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all"
                    >
                        <X className="w-5 h-5 text-slate-700" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div
            className="w-full max-w-md mx-auto aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 transition-all flex flex-col items-center justify-center cursor-pointer group"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => document.getElementById('file-input').click()}
        >
            <input
                type="file"
                id="file-input"
                className="hidden"
                accept="image/*"
                onChange={onChange}
            />
            <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">Upload Image</h3>
            <p className="text-sm text-slate-500 mt-1">Drag & drop or click to browse</p>
        </div>
    );
}
