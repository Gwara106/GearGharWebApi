module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/mock-data.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Shared mock data for products and reviews
__turbopack_context__.s([
    "mockProducts",
    ()=>mockProducts,
    "mockReviews",
    ()=>mockReviews
]);
const mockProducts = [
    {
        _id: '1',
        name: 'Premium Safety Helmet - HD Vision',
        description: 'Advanced safety helmet with HD vision technology, superior impact protection, and comfortable fit for long rides. Features anti-fog visor, quick-release buckle, and aerodynamic design.',
        price: 299.99,
        category: 'helmets',
        brand: 'SafeRide',
        sku: 'HELM-001',
        stock: 15,
        images: [
            '/products/helmet-1.png',
            '/products/helmet-2.png'
        ],
        status: 'active',
        tags: [
            'safety',
            'helmet',
            'vision'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        _id: '2',
        name: 'Sport Performance Gloves',
        description: 'Professional racing gloves with enhanced grip, knuckle protection, and breathable fabric. Perfect for both street and track riding with touchscreen-compatible fingertips.',
        price: 89.99,
        category: 'gloves',
        brand: 'GripPro',
        sku: 'GLOV-002',
        stock: 8,
        images: [
            '/products/gloves.jpg',
            '/products/gloves-2.jpg'
        ],
        status: 'active',
        tags: [
            'gloves',
            'racing',
            'protection'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        _id: '3',
        name: 'High-Grip Handlebar Grips Set',
        description: 'Ergonomic handlebar grips with vibration dampening and all-weather grip. Includes throttle assist and easy installation hardware.',
        price: 59.99,
        category: 'handlebars',
        brand: 'ComfortRide',
        sku: 'GRIP-003',
        stock: 25,
        images: [
            '/products/450handlebar.png',
            '/products/handlebar-2.png'
        ],
        status: 'active',
        tags: [
            'handlebars',
            'grips',
            'comfort'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        _id: '4',
        name: 'Premium Racing Tyres (Front)',
        description: 'High-performance racing tires with superior grip and durability. Designed for both wet and dry conditions with advanced compound technology.',
        price: 199.99,
        category: 'tyres',
        brand: 'SpeedGrip',
        sku: 'TYRE-004',
        stock: 12,
        images: [
            '/products/harleyDavidsontyres.jpg',
            '/products/tyre-2.jpg'
        ],
        status: 'active',
        tags: [
            'tyres',
            'racing',
            'performance'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        _id: '5',
        name: 'Carbon Fiber Exhaust System',
        description: 'Lightweight carbon fiber exhaust with enhanced sound and performance. Features removable baffle for street/track tuning.',
        price: 599.99,
        category: 'exhaust',
        brand: 'PowerFlow',
        sku: 'EXH-005',
        stock: 5,
        images: [
            '/products/exhaust1.png',
            '/products/exhaust2.png'
        ],
        status: 'active',
        tags: [
            'exhaust',
            'carbon',
            'performance'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];
const mockReviews = [
    {
        _id: '1',
        productId: '1',
        userId: 'user1',
        userName: 'John Doe',
        rating: 5,
        title: 'Best helmet I\'ve ever owned!',
        content: 'The HD vision is incredible and the fit is perfect. Worth every penny.',
        helpful: 12,
        verified: true,
        createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
        _id: '2',
        productId: '1',
        userId: 'user2',
        userName: 'Sarah Smith',
        rating: 4,
        title: 'Great helmet, minor issues',
        content: 'Very comfortable and safe, but the visor fogs up a bit in rain. Overall excellent.',
        helpful: 8,
        verified: true,
        createdAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
        _id: '3',
        productId: '2',
        userId: 'user3',
        userName: 'Mike Johnson',
        rating: 5,
        title: 'Perfect for racing',
        content: 'These gloves saved my hands in a fall. Excellent protection and great feel.',
        helpful: 15,
        verified: true,
        createdAt: new Date(Date.now() - 259200000).toISOString()
    },
    {
        _id: '4',
        productId: '3',
        userId: 'user4',
        userName: 'Emily Davis',
        rating: 4,
        title: 'Good grips, great price',
        content: 'Installation was easy and they feel much better than stock grips. Would recommend.',
        helpful: 6,
        verified: true,
        createdAt: new Date(Date.now() - 345600000).toISOString()
    }
];
}),
"[project]/app/api/products/[id]/reviews/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mock$2d$data$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/mock-data.ts [app-route] (ecmascript)");
;
;
async function GET(request, { params }) {
    try {
        const { id } = params;
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const productReviews = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mock$2d$data$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mockReviews"].filter((r)=>r.productId === id);
        const skip = (page - 1) * limit;
        const paginatedReviews = productReviews.slice(skip, skip + limit);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'Reviews retrieved successfully',
            reviews: paginatedReviews,
            pagination: {
                page,
                limit,
                total: productReviews.length,
                pages: Math.ceil(productReviews.length / limit)
            }
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'Internal server error'
        }, {
            status: 500
        });
    }
}
async function POST(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { rating, title, content } = body;
        // Mock user validation
        const authorization = request.headers.get('authorization');
        if (!authorization) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: 'Authentication required'
            }, {
                status: 401
            });
        }
        // Validate input
        if (!rating || !title || !content) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: 'Rating, title, and content are required'
            }, {
                status: 400
            });
        }
        if (rating < 1 || rating > 5) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: 'Rating must be between 1 and 5'
            }, {
                status: 400
            });
        }
        // Create new review (in real app, save to database)
        const newReview = {
            _id: Date.now().toString(),
            productId: id,
            userId: 'current-user',
            userName: 'Current User',
            rating,
            title,
            content,
            helpful: 0,
            verified: true,
            createdAt: new Date().toISOString()
        };
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mock$2d$data$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mockReviews"].unshift(newReview);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'Review added successfully',
            review: newReview
        }, {
            status: 201
        });
    } catch (error) {
        console.error('Add review error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__170f0769._.js.map