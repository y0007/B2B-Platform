import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Home } from './pages/Home';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LogOut, LayoutGrid, Package, User, BarChart3, Users, Settings, History, Search, Sliders } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import MyRequests from './pages/MyRequests';
import UserManagement from './pages/UserManagement';
import CatalogManager from './pages/CatalogManager';
import AdminSettings from './pages/AdminSettings';
import SourcingDashboard from './pages/SourcingDashboard';

function PrivateRoute({ children, requiredRole = null }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" />;

    if (requiredRole === 'INTERNAL' && user.role === 'BUYER') return <Navigate to="/" />;
    if (requiredRole === 'ADMIN' && user.role !== 'ADMIN') return <Navigate to="/" />;
    if (requiredRole === 'SOURCING' && !['SOURCING', 'ADMIN'].includes(user.role)) return <Navigate to="/" />;

    return children;
}

function Layout({ children }) {
    const { user, logout } = useAuth();
    const isInternal = user && (user.role === 'SALES' || user.role === 'ADMIN' || user.role === 'SOURCING');
    const isAdmin = user && user.role === 'ADMIN';
    const isSourcing = user && (user.role === 'SOURCING' || user.role === 'ADMIN');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
            <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
                <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent flex items-center gap-2">
                    <LayoutGrid className="w-8 h-8 text-pink-600" />
                    GemScout
                </Link>

                <div className="flex items-center gap-4 md:gap-6">
                    {user && (
                        <div className="hidden md:flex items-center gap-4 border-r border-slate-200 pr-6 mr-2">
                            <Link to="/my-requests" className="text-slate-600 hover:text-slate-900 text-sm font-semibold flex items-center gap-2 transition-colors">
                                <History className="w-4 h-4" />
                                My History
                            </Link>

                            {isInternal && (
                                <Link to="/dashboard" className="text-slate-600 hover:text-slate-900 text-sm font-semibold flex items-center gap-2 transition-colors">
                                    <BarChart3 className="w-4 h-4" />
                                    Ops Queue
                                </Link>
                            )}

                            {isSourcing && (
                                <Link to="/sourcing" className="text-slate-600 hover:text-slate-900 text-sm font-semibold flex items-center gap-2 transition-colors">
                                    <Search className="w-4 h-4" />
                                    Sourcing
                                </Link>
                            )}

                            {isAdmin && (
                                <>
                                    <Link to="/admin/users" className="text-slate-600 hover:text-slate-900 text-sm font-semibold flex items-center gap-2 transition-colors">
                                        <Users className="w-4 h-4" />
                                        Users
                                    </Link>
                                    <Link to="/admin/catalog" className="text-slate-600 hover:text-slate-900 text-sm font-semibold flex items-center gap-2 transition-colors">
                                        <Package className="w-4 h-4" />
                                        Catalog
                                    </Link>
                                    <Link to="/admin/settings" className="text-slate-600 hover:text-slate-900 text-sm font-semibold flex items-center gap-2 transition-colors">
                                        <Sliders className="w-4 h-4" />
                                        Margins
                                    </Link>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 border border-slate-200 text-sm font-medium text-slate-700">
                                    <User className="w-4 h-4" />
                                    <span className="max-w-[100px] truncate">{user.email}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-600 font-bold">{user.role}</span>
                                </div>
                                <button onClick={logout} className="text-slate-500 hover:text-red-600 transition-colors flex items-center gap-2">
                                    <LogOut className="w-5 h-5" />
                                    <span className="hidden lg:inline text-sm font-medium">Exit</span>
                                </button>
                            </>
                        ) : (
                            <Link to="/login" className="btn-primary px-6 py-2 rounded-full text-sm">Sign In</Link>
                        )}
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 py-8 space-y-12">
                {children}
            </main>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Layout>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        <Route path="/my-requests" element={
                            <PrivateRoute>
                                <MyRequests />
                            </PrivateRoute>
                        } />

                        <Route path="/dashboard" element={
                            <PrivateRoute requiredRole="INTERNAL">
                                <Dashboard />
                            </PrivateRoute>
                        } />

                        <Route path="/sourcing" element={
                            <PrivateRoute requiredRole="SOURCING">
                                <SourcingDashboard />
                            </PrivateRoute>
                        } />

                        <Route path="/admin/users" element={
                            <PrivateRoute requiredRole="ADMIN">
                                <UserManagement />
                            </PrivateRoute>
                        } />

                        <Route path="/admin/catalog" element={
                            <PrivateRoute requiredRole="ADMIN">
                                <CatalogManager />
                            </PrivateRoute>
                        } />

                        <Route path="/admin/settings" element={
                            <PrivateRoute requiredRole="ADMIN">
                                <AdminSettings />
                            </PrivateRoute>
                        } />

                        <Route path="/" element={
                            <PrivateRoute>
                                <Home />
                            </PrivateRoute>
                        } />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Layout>
            </BrowserRouter>
        </AuthProvider>
    );
}
