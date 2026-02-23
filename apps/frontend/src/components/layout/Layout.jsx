import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Diamond, ShoppingBag, LayoutDashboard, ShieldCheck } from 'lucide-react';

export const Layout = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-100 text-slate-800">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-900 p-2 rounded-lg text-white">
                            <Diamond size={24} />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">Visual Sourcing</span>
                    </div>

                    <div className="flex items-center gap-8">
                        <NavLink to="/" className={({ isActive }) => `flex items-center gap-2 text-sm font-medium transition-colors ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>
                            <ShoppingBag size={18} />
                            Buyer
                        </NavLink>
                        <NavLink to="/internal" className={({ isActive }) => `flex items-center gap-2 text-sm font-medium transition-colors ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>
                            <LayoutDashboard size={18} />
                            Internal
                        </NavLink>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-28 pb-12 px-6 max-w-7xl mx-auto">
                <Outlet />
            </main>
        </div>
    );
};
