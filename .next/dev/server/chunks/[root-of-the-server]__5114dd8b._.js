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
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/app/api/_lib/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "authenticateToken",
    ()=>authenticateToken,
    "requireAdmin",
    ()=>requireAdmin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jsonwebtoken/index.js [app-route] (ecmascript)");
;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
async function authenticateToken(request) {
    try {
        console.log('Auth: MongoDB URI:', process.env.MONGODB_URI);
        // Get token from cookie or header
        const token = request.cookies.get('auth_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return {
                success: false,
                message: 'No token provided'
            };
        }
        // Verify token
        const decoded = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].verify(token, JWT_SECRET);
        return {
            success: true,
            user: decoded
        };
    } catch (error) {
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].JsonWebTokenError) {
            return {
                success: false,
                message: 'Invalid token'
            };
        }
        console.error('Authentication error:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
}
function requireAdmin(user) {
    if (!user) {
        return {
            success: false,
            message: 'Authentication required'
        };
    }
    if (user.role !== 'admin') {
        return {
            success: false,
            message: 'Admin access required'
        };
    }
    return {
        success: true
    };
}
}),
"[project]/app/api/admin/dashboard/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$_lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/api/_lib/auth.ts [app-route] (ecmascript)");
;
;
;
async function GET(request) {
    try {
        // Authenticate and verify admin role
        const authResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$_lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["authenticateToken"])(request);
        if (!authResult.success) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: authResult.message
            }, {
                status: 401
            });
        }
        const adminCheck = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$_lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["requireAdmin"])(authResult.user);
        if (!adminCheck.success) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: adminCheck.message
            }, {
                status: 403
            });
        }
        // Use direct MongoDB connection (same as products API)
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://luckyprajapati715_db_user:Gwara9841@ronakdemo.0yfckss.mongodb.net/gearghar';
        await __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connect(MONGODB_URI);
        console.log('API: Database connected');
        const db = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connection.db;
        if (!db) {
            throw new Error('Database not connected');
        }
        console.log('API: Available collections:', await db.listCollections().toArray());
        // Get user statistics
        const usersCollection = db.collection('users');
        const totalUsers = await usersCollection.countDocuments();
        const activeUsers = await usersCollection.countDocuments({
            status: 'active'
        });
        const adminUsers = await usersCollection.countDocuments({
            role: 'admin'
        });
        const regularUsers = await usersCollection.countDocuments({
            role: 'user'
        });
        // Get recent users (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentUsers = await usersCollection.find({
            createdAt: {
                $gte: sevenDaysAgo
            }
        }).sort({
            createdAt: -1
        }).limit(5).toArray();
        // Get product statistics
        const productsCollection = db.collection('products');
        const totalProducts = await productsCollection.countDocuments();
        const activeProducts = await productsCollection.countDocuments({
            status: 'active'
        });
        const outOfStockProducts = await productsCollection.countDocuments({
            stock: 0
        });
        // Get order statistics
        const ordersCollection = db.collection('orders');
        const totalOrders = await ordersCollection.countDocuments();
        const paidOrders = await ordersCollection.countDocuments({
            status: 'paid'
        });
        const pendingOrders = await ordersCollection.countDocuments({
            status: 'pending'
        });
        const completedOrders = await ordersCollection.countDocuments({
            status: 'completed'
        });
        // Get recent orders
        const recentOrders = await ordersCollection.find({}).sort({
            createdAt: -1
        }).limit(5).toArray();
        // Populate user data for recent orders and calculate totals
        for (let order of recentOrders){
            // Use the 'total' field which includes subtotal + tax + shipping
            if (!order.totalAmount && order.total) {
                order.totalAmount = order.total;
            }
            // Try to find user if user field exists
            if (order.user) {
                const user = await usersCollection.findOne({
                    _id: order.user
                });
                order.user = user;
            }
            // If no user found, use shipping address name as customer
            if (!order.user && order.shippingAddress && order.shippingAddress.name) {
                order.user = {
                    name: order.shippingAddress.name,
                    email: order.shippingAddress.email || 'No email'
                };
            }
        }
        // Calculate revenue (using the 'total' field which includes VAT and shipping)
        let totalRevenue = 0;
        const allOrders = await ordersCollection.find({
            status: 'paid'
        }).toArray();
        for (let order of allOrders){
            // Use the 'total' field which includes subtotal + tax + shipping
            if (order.total) {
                totalRevenue += order.total;
            }
        }
        // Don't disconnect - let mongoose manage connection pool
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'Dashboard statistics retrieved successfully',
            data: {
                totalUsers,
                activeUsers,
                adminUsers,
                regularUsers,
                recentUsers: recentUsers.map((user)=>({
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        status: user.status,
                        createdAt: user.createdAt
                    })),
                totalProducts,
                activeProducts,
                outOfStockProducts,
                totalOrders,
                paidOrders,
                pendingOrders,
                completedOrders,
                recentOrders: recentOrders.map((order)=>({
                        _id: order._id,
                        orderNumber: order.orderNumber,
                        user: order.user ? {
                            name: order.user.name,
                            email: order.user.email
                        } : null,
                        totalAmount: order.totalAmount,
                        status: order.status,
                        createdAt: order.createdAt
                    })),
                totalRevenue,
                userGrowthPercentage: recentUsers.length > 0 ? Math.round(recentUsers.length / totalUsers * 100) : 0,
                productGrowthPercentage: totalProducts > 0 ? Math.round(activeProducts / totalProducts * 100) : 0,
                orderGrowthPercentage: totalOrders > 0 ? Math.round(completedOrders / totalOrders * 100) : 0,
                revenueGrowthPercentage: totalRevenue > 0 ? 10 : 0 // Placeholder for revenue growth
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
        // Don't disconnect - let mongoose manage connection pool
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__5114dd8b._.js.map