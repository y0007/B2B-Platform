const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:4000/api';

const authHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const api = {
    // Auth
    register: async (email, password) => {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) throw new Error('Registration failed');
        return res.json();
    },
    login: async (email, password) => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) throw new Error('Login failed');
        return res.json();
    },

    // Image & Analysis
    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch(`${API_URL}/image/upload`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
    },

    analyzeImage: async (imageSessionId) => {
        const res = await fetch(`${API_URL}/image/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageSessionId }),
        });
        if (!res.ok) throw new Error('Analysis failed');
        return res.json();
    },

    getRecommendations: async () => {
        const res = await fetch(`${API_URL}/recommendations`, { method: 'POST' });
        if (!res.ok) throw new Error('Fetch recommendations failed');
        return res.json();
    },

    submitCart: async (cartData) => {
        const res = await fetch(`${API_URL}/cart/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader()
            },
            body: JSON.stringify(cartData)
        });
        if (!res.ok) throw new Error('Submit failed');
        return res.json();
    },

    // --- Internal Ops ---
    getInternalRequests: async () => {
        const res = await fetch(`${API_URL}/internal/requests`, {
            headers: authHeader()
        });
        if (!res.ok) throw new Error('Fetch requests failed');
        return res.json();
    },

    getRequestDetails: async (id) => {
        const res = await fetch(`${API_URL}/internal/requests/${id}`, {
            headers: authHeader()
        });
        if (!res.ok) throw new Error('Fetch request details failed');
        return res.json();
    },

    createQuote: async (quoteData) => {
        const res = await fetch(`${API_URL}/internal/quote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader()
            },
            body: JSON.stringify(quoteData)
        });
        if (!res.ok) throw new Error('Quote creation failed');
        return res.json();
    },

    // --- Admin: Users ---
    getAdminUsers: async () => {
        const res = await fetch(`${API_URL}/admin/users`, {
            headers: authHeader()
        });
        if (!res.ok) throw new Error('Fetch users failed');
        return res.json();
    },

    updateUserRole: async (id, role) => {
        const res = await fetch(`${API_URL}/admin/users/${id}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader()
            },
            body: JSON.stringify({ role })
        });
        if (!res.ok) throw new Error('Update role failed');
        return res.json();
    },

    // --- Admin: Catalog ---
    getAdminSKUs: async () => {
        const res = await fetch(`${API_URL}/admin/skus`, {
            headers: authHeader()
        });
        if (!res.ok) throw new Error('Fetch catalog failed');
        return res.json();
    },

    createSKU: async (skuData) => {
        const res = await fetch(`${API_URL}/admin/skus`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader()
            },
            body: JSON.stringify(skuData)
        });
        if (!res.ok) throw new Error('SKU creation failed');
        return res.json();
    },

    // --- Admin: Margins Settings ---
    getMargins: async () => {
        const res = await fetch(`${API_URL}/admin/settings/margins`, {
            headers: authHeader()
        });
        if (!res.ok) throw new Error('Fetch margins failed');
        return res.json();
    },

    updateMargins: async (marginData) => {
        const res = await fetch(`${API_URL}/admin/settings/margins`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader()
            },
            body: JSON.stringify(marginData)
        });
        if (!res.ok) throw new Error('Update margins failed');
        return res.json();
    },

    // --- Buyer: History ---
    getMyRequests: async () => {
        const res = await fetch(`${API_URL}/requests/my`, {
            headers: authHeader()
        });
        if (!res.ok) throw new Error('Fetch history failed');
        return res.json();
    },

    // --- Unified Image Search (Internal + External) ---
    searchSimilar: async (file, category) => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('category', category);
        const res = await fetch(`${API_URL}/search/unified`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) throw new Error('Unified search failed');
        return res.json();
    },

    // --- Lifecycle Actions ---
    acceptQuote: async (id) => {
        const res = await fetch(`${API_URL}/requests/${id}/accept`, {
            method: 'POST',
            headers: authHeader()
        });
        if (!res.ok) throw new Error('Accept quote failed');
        return res.json();
    },

    updateRequestStatus: async (id, status, notes) => {
        const res = await fetch(`${API_URL}/internal/requests/${id}/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader()
            },
            body: JSON.stringify({ status, notes })
        });
        if (!res.ok) throw new Error('Update status failed');
        return res.json();
    }
};
