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
"[project]/src/models/User.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "User",
    ()=>User
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const UserSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    firstName: {
        type: String,
        required: [
            true,
            'First name is required'
        ],
        trim: true,
        minlength: [
            2,
            'First name must be at least 2 characters long'
        ],
        maxlength: [
            50,
            'First name cannot exceed 50 characters'
        ]
    },
    lastName: {
        type: String,
        required: [
            true,
            'Last name is required'
        ],
        trim: true,
        minlength: [
            2,
            'Last name must be at least 2 characters long'
        ],
        maxlength: [
            50,
            'Last name cannot exceed 50 characters'
        ]
    },
    name: {
        type: String,
        trim: true,
        // Virtual getter for backward compatibility with mobile app
        get: function() {
            return `${this.firstName} ${this.lastName}`.trim();
        }
    },
    email: {
        type: String,
        required: [
            true,
            'Email is required'
        ],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email'
        ]
    },
    username: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    password: {
        type: String,
        required: [
            true,
            'Password is required'
        ],
        minlength: [
            6,
            'Password must be at least 6 characters long'
        ]
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    profilePicture: {
        type: String,
        default: 'default-profile.png',
        trim: true
    },
    role: {
        type: String,
        enum: {
            values: [
                'user',
                'admin'
            ],
            message: 'Role must be either user or admin'
        },
        default: 'user'
    },
    status: {
        type: String,
        enum: {
            values: [
                'active',
                'inactive'
            ],
            message: 'Status must be either active or inactive'
        },
        default: 'active'
    },
    lastLogin: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.__v;
            return ret;
        }
    },
    toObject: {
        virtuals: true
    }
});
// Pre-save middleware to handle backward compatibility
UserSchema.pre('save', async function() {
    // Handle migration from old schema to new schema
    if (this.isNew && this.name && !this.firstName) {
        const nameParts = this.name.split(' ');
        this.firstName = nameParts[0] || this.name;
        this.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    }
});
// Index for better query performance
UserSchema.index({
    role: 1
});
UserSchema.index({
    status: 1
});
const User = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.User || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model('User', UserSchema);
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
"[project]/app/api/admin/orders/dashboard/stats/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$database$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/database.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/Order.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/User.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$_lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/api/_lib/auth.ts [app-route] (ecmascript)");
;
;
;
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
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$database$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["connectToDatabase"])();
        console.log('API: Database connected');
        // Ensure models are loaded and registered
        console.log('API: Available models:', Object.keys(__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models));
        // Force model registration by accessing them
        console.log('API: User model check:', !!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["User"]);
        console.log('API: Order model check:', !!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"]);
        const totalOrders = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].countDocuments();
        const pendingOrders = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].countDocuments({
            status: 'pending'
        });
        const processingOrders = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].countDocuments({
            status: 'processing'
        });
        const shippedOrders = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].countDocuments({
            status: 'shipped'
        });
        const deliveredOrders = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].countDocuments({
            status: 'delivered'
        });
        const cancelledOrders = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].countDocuments({
            status: 'cancelled'
        });
        // Calculate total revenue
        const revenueResult = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].aggregate([
            {
                $match: {
                    status: {
                        $in: [
                            'delivered',
                            'received'
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: '$total'
                    }
                }
            }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
        // Get recent orders
        const recentOrders = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].find().populate('user', 'firstName lastName email').sort({
            createdAt: -1
        }).limit(10).select('orderNumber user total status createdAt');
        const formattedRecentOrders = recentOrders.map((order)=>({
                id: order.orderNumber,
                customer: `${order.user.firstName} ${order.user.lastName}`,
                amount: `Rs. ${order.total.toFixed(2)}`,
                status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
                date: order.createdAt.toLocaleDateString()
            }));
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: {
                totalOrders,
                pendingOrders,
                processingOrders,
                shippedOrders,
                deliveredOrders,
                cancelledOrders,
                totalRevenue,
                recentOrders: formattedRecentOrders
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
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

//# sourceMappingURL=%5Broot-of-the-server%5D__daab19cc._.js.map