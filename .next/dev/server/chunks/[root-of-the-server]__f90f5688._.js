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
"[project]/src/config/database.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "connectToDatabase",
    ()=>connectToDatabase,
    "disconnectFromDatabase",
    ()=>disconnectFromDatabase
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://luckyprajapati715_db_user:Gwara9841@ronakdemo.0yfckss.mongodb.net/gearghar';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
// Connection options (updated for MongoDB 7.0+)
const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
};
// Cached connection
let cachedConnection = null;
async function connectToDatabase() {
    if (cachedConnection) {
        return cachedConnection;
    }
    try {
        console.log('Database: Connecting to MongoDB...');
        console.log('Database: MongoDB URI:', process.env.MONGODB_URI);
        cachedConnection = await __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connect(MONGODB_URI, options);
        console.log('✅ Connected to MongoDB successfully');
        // Ensure all models are loaded
        console.log('Database: Available models:', Object.keys(__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models));
        // Handle connection events
        __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connection.on('error', (error)=>{
            console.error('❌ MongoDB connection error:', error);
        });
        __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connection.on('disconnected', ()=>{
            console.log('⚠️ MongoDB disconnected');
            cachedConnection = null;
        });
        __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connection.on('reconnected', ()=>{
            console.log('✅ MongoDB reconnected');
        });
        return cachedConnection;
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        throw error;
    }
}
async function disconnectFromDatabase() {
    if (cachedConnection) {
        await __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].disconnect();
        cachedConnection = null;
        console.log('✅ Disconnected from MongoDB');
    }
}
// Graceful shutdown
process.on('SIGINT', async ()=>{
    await disconnectFromDatabase();
    process.exit(0);
});
process.on('SIGTERM', async ()=>{
    await disconnectFromDatabase();
    process.exit(0);
});
}),
"[project]/src/models/Order.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Order",
    ()=>Order
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const orderItemSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    item: {
        type: __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"].Types.ObjectId,
        ref: 'Product',
        required: [
            true,
            "Item ID is required"
        ]
    },
    quantity: {
        type: Number,
        required: [
            true,
            "Quantity is required"
        ],
        min: [
            1,
            "Quantity must be at least 1"
        ]
    },
    price: {
        type: Number,
        required: [
            true,
            "Price is required"
        ],
        min: [
            0,
            "Price cannot be negative"
        ]
    },
    totalPrice: {
        type: Number,
        required: [
            true,
            "Total price is required"
        ],
        min: [
            0,
            "Total price cannot be negative"
        ]
    },
    itemName: {
        type: String,
        required: false
    },
    itemImages: {
        type: [
            String
        ],
        required: false
    }
}, {
    _id: false
});
const orderStatusSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    status: {
        type: String,
        required: true,
        enum: [
            'pending',
            'confirmed',
            'processing',
            'packed',
            'shipped',
            'delivered',
            'received',
            'cancelled',
            'refunded'
        ],
        default: 'pending'
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    note: {
        type: String,
        trim: true,
        maxlength: [
            500,
            "Status note cannot exceed 500 characters"
        ]
    }
}, {
    _id: false
});
const OrderSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true
    },
    user: {
        type: __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"].Types.ObjectId,
        ref: 'User',
        required: [
            true,
            "User ID is required"
        ]
    },
    items: [
        orderItemSchema
    ],
    subtotal: {
        type: Number,
        required: [
            true,
            "Subtotal is required"
        ],
        min: [
            0,
            "Subtotal cannot be negative"
        ]
    },
    tax: {
        type: Number,
        required: [
            true,
            "Tax is required"
        ],
        min: [
            0,
            "Tax cannot be negative"
        ],
        default: 0
    },
    shipping: {
        type: Number,
        required: [
            true,
            "Shipping cost is required"
        ],
        min: [
            0,
            "Shipping cost cannot be negative"
        ],
        default: 0
    },
    discount: {
        type: Number,
        required: [
            true,
            "Discount is required"
        ],
        min: [
            0,
            "Discount cannot be negative"
        ],
        default: 0
    },
    total: {
        type: Number,
        required: [
            true,
            "Total is required"
        ],
        min: [
            0,
            "Total cannot be negative"
        ]
    },
    currency: {
        type: String,
        required: true,
        default: 'USD',
        uppercase: true
    },
    status: {
        type: String,
        required: true,
        enum: [
            'pending',
            'confirmed',
            'processing',
            'packed',
            'shipped',
            'delivered',
            'received',
            'cancelled',
            'refunded'
        ],
        default: 'pending'
    },
    statusHistory: [
        orderStatusSchema
    ],
    shippingAddress: {
        type: Object,
        required: [
            true,
            "Shipping address is required"
        ]
    },
    billingAddress: {
        type: Object,
        required: [
            true,
            "Billing address is required"
        ]
    },
    paymentMethod: {
        type: String,
        required: [
            true,
            "Payment method is required"
        ]
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: [
            'pending',
            'processing',
            'completed',
            'failed',
            'refunded',
            'partially_refunded'
        ],
        default: 'pending'
    },
    paymentId: {
        type: String,
        trim: true
    },
    trackingNumber: {
        type: String,
        trim: true
    },
    carrier: {
        type: String,
        trim: true
    },
    estimatedDelivery: {
        type: Date
    },
    actualDelivery: {
        type: Date
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [
            1000,
            "Order notes cannot exceed 1000 characters"
        ]
    },
    customerNotes: {
        type: String,
        trim: true,
        maxlength: [
            500,
            "Customer notes cannot exceed 500 characters"
        ]
    },
    promoCode: {
        type: String,
        trim: true
    },
    isGift: {
        type: Boolean,
        default: false
    },
    giftMessage: {
        type: String,
        trim: true,
        maxlength: [
            500,
            "Gift message cannot exceed 500 characters"
        ],
        required: function() {
            return this.isGift;
        }
    },
    giftWrap: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});
// Index for faster queries
OrderSchema.index({
    user: 1,
    createdAt: -1
});
OrderSchema.index({
    status: 1
});
OrderSchema.index({
    paymentStatus: 1
});
// Virtual for item count
OrderSchema.virtual('itemCount').get(function() {
    return this.items.reduce((total, item)=>total + item.quantity, 0);
});
// Virtual for formatted total
OrderSchema.virtual('formattedTotal').get(function() {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.currency
    }).format(this.total);
});
// Virtual for current status info
OrderSchema.virtual('currentStatus').get(function() {
    if (this.statusHistory.length > 0) {
        return this.statusHistory[this.statusHistory.length - 1];
    }
    return {
        status: this.status,
        timestamp: this.createdAt,
        note: 'Order created'
    };
});
// Static method to get order statistics
OrderSchema.statics.getStats = function(userId) {
    return this.aggregate([
        {
            $match: {
                user: new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: '$status',
                count: {
                    $sum: 1
                },
                total: {
                    $sum: '$total'
                }
            }
        }
    ]);
};
// Static method to get all orders for admin
OrderSchema.statics.getAllOrders = function(page = 1, limit = 10, status) {
    const query = {};
    if (status) {
        query.status = status;
    }
    const queryBuilder = this.find(query).populate('user', 'firstName lastName email').sort({
        createdAt: -1
    }).skip((page - 1) * limit).limit(limit);
    // Only populate items.item if Product model is available
    if (__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.Product) {
        return queryBuilder.populate('items.item', 'name images');
    } else {
        console.warn('Product model not available, skipping item population');
        return queryBuilder;
    }
};
// Static method to get order counts by status
OrderSchema.statics.getOrderCounts = function() {
    return this.aggregate([
        {
            $group: {
                _id: '$status',
                count: {
                    $sum: 1
                }
            }
        }
    ]);
};
// Generate unique order number function
const generateOrderNumber = ()=>{
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
};
// Pre-save middleware to generate order number
OrderSchema.pre('save', async function() {
    if (this.isNew) {
        this.orderNumber = generateOrderNumber();
    }
});
const Order = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.Order || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model('Order', OrderSchema);
}),
"[project]/src/models/Product.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Product",
    ()=>Product
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const ProductSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    name: {
        type: String,
        required: [
            true,
            'Product name is required'
        ],
        trim: true,
        maxlength: [
            100,
            'Product name cannot exceed 100 characters'
        ]
    },
    description: {
        type: String,
        required: [
            true,
            'Product description is required'
        ],
        maxlength: [
            1000,
            'Description cannot exceed 1000 characters'
        ]
    },
    price: {
        type: Number,
        required: [
            true,
            'Product price is required'
        ],
        min: [
            0,
            'Price cannot be negative'
        ]
    },
    currency: {
        type: String,
        required: [
            true,
            'Currency is required'
        ],
        enum: [
            'INR',
            'USD'
        ],
        default: 'INR'
    },
    originalPriceUSD: {
        type: Number,
        min: [
            0,
            'Original price cannot be negative'
        ]
    },
    category: {
        type: String,
        required: [
            true,
            'Product category is required'
        ],
        enum: {
            values: [
                'electronics',
                'clothing',
                'accessories',
                'sports',
                'home',
                'other'
            ],
            message: 'Invalid category'
        }
    },
    brand: {
        type: String,
        required: [
            true,
            'Product brand is required'
        ],
        trim: true
    },
    sku: {
        type: String,
        required: [
            true,
            'Product SKU is required'
        ],
        unique: true,
        trim: true
    },
    stock: {
        type: Number,
        required: [
            true,
            'Stock quantity is required'
        ],
        min: [
            0,
            'Stock cannot be negative'
        ],
        default: 0
    },
    images: {
        type: [
            String
        ],
        default: []
    },
    status: {
        type: String,
        enum: {
            values: [
                'active',
                'inactive',
                'out_of_stock'
            ],
            message: 'Status must be active, inactive, or out_of_stock'
        },
        default: 'active'
    },
    tags: {
        type: [
            String
        ],
        default: []
    }
}, {
    timestamps: true
});
// Indexes for better query performance
ProductSchema.index({
    category: 1
});
ProductSchema.index({
    brand: 1
});
ProductSchema.index({
    status: 1
});
ProductSchema.index({
    price: 1
});
const Product = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.Product || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model('Product', ProductSchema);
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
"[project]/app/api/admin/orders/[id]/status/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PUT",
    ()=>PUT
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$database$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/database.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/Order.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/Product.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$_lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/api/_lib/auth.ts [app-route] (ecmascript)");
;
;
;
;
;
async function PUT(request, { params }) {
    try {
        const { id } = await params;
        console.log('API: Update order status request received for ID:', id);
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
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$database$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["connectToDatabase"])();
        console.log('API: Database connected');
        // Direct database test for debugging
        const directTest = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].findById(id);
        console.log('API: Direct database test result:', !!directTest);
        if (!directTest) {
            const directTestByNumber = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].findOne({
                orderNumber: id
            });
            console.log('API: Direct database test by orderNumber result:', !!directTestByNumber);
        }
        const body = await request.json();
        const { status, note, trackingNumber, carrier, estimatedDelivery } = body;
        if (![
            'pending',
            'confirmed',
            'processing',
            'packed',
            'shipped',
            'delivered',
            'received',
            'cancelled',
            'refunded'
        ].includes(status)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: "Invalid order status"
            }, {
                status: 400
            });
        }
        // Try to find order by ID or orderNumber
        let order = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].findById(id);
        console.log('API: Order found by ID:', !!order);
        if (!order) {
            // If not found by ID, try by orderNumber
            console.log('API: Trying to find by orderNumber:', id);
            order = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].findOne({
                orderNumber: id
            });
            console.log('API: Order found by orderNumber:', !!order);
        }
        if (!order) {
            // Log all orders for debugging
            console.log('API: Order not found, listing all orders for debugging...');
            const allOrders = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].find({}).select('orderNumber _id').limit(5);
            console.log('API: Available orders:', allOrders.map((o)=>({
                    orderNumber: o.orderNumber,
                    _id: o._id
                })));
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: "Order not found"
            }, {
                status: 404
            });
        }
        // Update order status and add to history
        order.status = status;
        order.statusHistory.push({
            status,
            timestamp: new Date(),
            note: note || `Status updated to ${status}`
        });
        // Update tracking information if provided
        if (trackingNumber) {
            order.trackingNumber = trackingNumber;
        }
        if (carrier) {
            order.carrier = carrier;
        }
        if (estimatedDelivery) {
            order.estimatedDelivery = new Date(estimatedDelivery);
        }
        // Update actual delivery date if status is delivered
        if (status === 'delivered') {
            order.actualDelivery = new Date();
            order.paymentStatus = 'completed';
        }
        // Update payment status based on order status
        if (status === 'cancelled') {
            order.paymentStatus = 'refunded';
            // Restore item stock
            for (const orderItem of order.items){
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Product"].findByIdAndUpdate(orderItem.item, {
                    $inc: {
                        stock: orderItem.quantity
                    }
                });
            }
        }
        await order.save();
        // Populate user and item data before returning
        await order.populate('user', 'firstName lastName email');
        await order.populate('items.item', 'name images');
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Error updating admin order status:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            message: "Server error",
            error: error instanceof Error ? error.message : 'Unknown error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__f90f5688._.js.map