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
"[project]/app/api/products/[id]/reviews/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
// Mock reviews data
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
async function GET(request, { params }) {
    try {
        const { id } = params;
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const productReviews = mockReviews.filter((r)=>r.productId === id);
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
        mockReviews.unshift(newReview);
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

//# sourceMappingURL=%5Broot-of-the-server%5D__31b1a298._.js.map