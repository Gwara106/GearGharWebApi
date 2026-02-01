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
        cachedConnection = await __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connect(MONGODB_URI, options);
        console.log('✅ Connected to MongoDB successfully');
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
UserSchema.pre('save', async function(next) {
    // Handle migration from old schema to new schema
    if (this.isNew && this.name && !this.firstName) {
        const nameParts = this.name.split(' ');
        this.firstName = nameParts[0] || this.name;
        this.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    }
    next();
});
// Index for better query performance
UserSchema.index({
    role: 1
});
UserSchema.index({
    status: 1
});
UserSchema.index({
    email: 1
}, {
    unique: true
});
UserSchema.index({
    username: 1
}, {
    unique: true,
    sparse: true
});
const User = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.User || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model('User', UserSchema);
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
ProductSchema.index({
    sku: 1
});
const Product = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.Product || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model('Product', ProductSchema);
}),
"[project]/src/models/Order.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Order",
    ()=>Order
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const OrderItemSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    product: {
        type: __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"].Types.ObjectId,
        ref: 'Product',
        required: [
            true,
            'Product ID is required'
        ]
    },
    quantity: {
        type: Number,
        required: [
            true,
            'Quantity is required'
        ],
        min: [
            1,
            'Quantity must be at least 1'
        ]
    },
    price: {
        type: Number,
        required: [
            true,
            'Price is required'
        ],
        min: [
            0,
            'Price cannot be negative'
        ]
    },
    total: {
        type: Number,
        required: [
            true,
            'Total is required'
        ],
        min: [
            0,
            'Total cannot be negative'
        ]
    }
});
const OrderSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    orderNumber: {
        type: String,
        required: [
            true,
            'Order number is required'
        ],
        unique: true,
        trim: true
    },
    customer: {
        type: __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"].Types.ObjectId,
        ref: 'User',
        required: [
            true,
            'Customer ID is required'
        ]
    },
    items: {
        type: [
            OrderItemSchema
        ],
        required: [
            true,
            'Order items are required'
        ],
        validate: {
            validator: function(items) {
                return items.length > 0;
            },
            message: 'Order must have at least one item'
        }
    },
    subtotal: {
        type: Number,
        required: [
            true,
            'Subtotal is required'
        ],
        min: [
            0,
            'Subtotal cannot be negative'
        ]
    },
    tax: {
        type: Number,
        required: [
            true,
            'Tax is required'
        ],
        min: [
            0,
            'Tax cannot be negative'
        ],
        default: 0
    },
    shipping: {
        type: Number,
        required: [
            true,
            'Shipping cost is required'
        ],
        min: [
            0,
            'Shipping cannot be negative'
        ],
        default: 0
    },
    total: {
        type: Number,
        required: [
            true,
            'Total is required'
        ],
        min: [
            0,
            'Total cannot be negative'
        ]
    },
    status: {
        type: String,
        enum: {
            values: [
                'pending',
                'processing',
                'shipped',
                'delivered',
                'cancelled',
                'refunded'
            ],
            message: 'Invalid order status'
        },
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: {
            values: [
                'pending',
                'paid',
                'failed',
                'refunded'
            ],
            message: 'Invalid payment status'
        },
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        required: [
            true,
            'Payment method is required'
        ],
        enum: {
            values: [
                'credit_card',
                'debit_card',
                'paypal',
                'cash_on_delivery',
                'bank_transfer'
            ],
            message: 'Invalid payment method'
        }
    },
    shippingAddress: {
        street: {
            type: String,
            required: [
                true,
                'Street address is required'
            ]
        },
        city: {
            type: String,
            required: [
                true,
                'City is required'
            ]
        },
        state: {
            type: String,
            required: [
                true,
                'State is required'
            ]
        },
        zipCode: {
            type: String,
            required: [
                true,
                'ZIP code is required'
            ]
        },
        country: {
            type: String,
            required: [
                true,
                'Country is required'
            ]
        }
    },
    notes: {
        type: String,
        maxlength: [
            500,
            'Notes cannot exceed 500 characters'
        ]
    }
}, {
    timestamps: true
});
// Indexes for better query performance
OrderSchema.index({
    orderNumber: 1
});
OrderSchema.index({
    customer: 1
});
OrderSchema.index({
    status: 1
});
OrderSchema.index({
    paymentStatus: 1
});
OrderSchema.index({
    createdAt: -1
});
// Pre-save middleware to generate order number
OrderSchema.pre('save', async function(next) {
    if (this.isNew) {
        const count = await this.constructor.countDocuments();
        this.orderNumber = `ORD-${String(count + 1).padStart(6, '0')}`;
    }
    next();
});
const Order = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.Order || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model('Order', OrderSchema);
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

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
"[project]/lib/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "comparePasswords",
    ()=>comparePasswords,
    "extractTokenFromHeader",
    ()=>extractTokenFromHeader,
    "generateToken",
    ()=>generateToken,
    "hashPassword",
    ()=>hashPassword,
    "verifyToken",
    ()=>verifyToken
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jsonwebtoken/index.js [app-route] (ecmascript)");
;
;
const JWT_SECRET = process.env.JWT_SECRET || 'gearghar_secret_key_change_in_production';
async function hashPassword(password) {
    const salt = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].genSalt(10);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].hash(password, salt);
}
async function comparePasswords(password, hashedPassword) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].compare(password, hashedPassword);
}
function generateToken(userId, email, role = 'user') {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].sign({
        userId,
        email,
        role
    }, JWT_SECRET, {
        expiresIn: '7d'
    });
}
function verifyToken(token) {
    try {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}
function extractTokenFromHeader(authHeader) {
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1];
}
}),
"[project]/app/api/admin/dashboard/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$database$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/database.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/User.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/Product.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/Order.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-route] (ecmascript)");
;
;
;
;
;
;
const seedProducts = [
    {
        name: 'Premium Safety Helmet - HD Vision',
        description: 'High-definition vision premium safety helmet with advanced impact protection and anti-scratch visor.',
        price: 299.99,
        category: 'electronics',
        brand: 'GearGhar Premium',
        sku: 'HELM-001',
        stock: 15,
        images: [
            'https://images.unsplash.com/photo-1570995676569-90f6b56a29c4?w=400&h=400&fit=crop'
        ],
        status: 'active',
        tags: [
            'helmet',
            'safety',
            'premium',
            'hd-vision'
        ]
    },
    {
        name: 'Sport Performance Gloves',
        description: 'Professional sport performance gloves with enhanced grip and breathable material.',
        price: 89.99,
        category: 'accessories',
        brand: 'GearGhar Sport',
        sku: 'GLOV-001',
        stock: 25,
        images: [
            'https://images.unsplash.com/photo-1539077682343-0d85a6a6a9df?w=400&h=400&fit=crop'
        ],
        status: 'active',
        tags: [
            'gloves',
            'sport',
            'performance',
            'grip'
        ]
    },
    {
        name: 'High-Grip Handlebar Grips Set',
        description: 'High-grip handlebar grips set for superior control and comfort during long rides.',
        price: 59.99,
        category: 'accessories',
        brand: 'GearGhar Pro',
        sku: 'GRIP-001',
        stock: 30,
        images: [
            'https://images.unsplash.com/photo-1606405162335-5e8e9d8f8f3d?w=400&h=400&fit=crop'
        ],
        status: 'active',
        tags: [
            'handlebar',
            'grips',
            'control',
            'comfort'
        ]
    },
    {
        name: 'Premium Racing Tyres (Front)',
        description: 'High-performance racing tyres designed for maximum grip and durability on track.',
        price: 199.99,
        category: 'electronics',
        brand: 'GearGhar Racing',
        sku: 'TYRE-F001',
        stock: 12,
        images: [
            'https://images.unsplash.com/photo-1559056169-641ef2a8ec3f?w=400&h=400&fit=crop'
        ],
        status: 'active',
        tags: [
            'tyres',
            'racing',
            'performance',
            'front'
        ]
    },
    {
        name: 'Carbon Fiber Exhaust System',
        description: 'Lightweight carbon fiber exhaust system for enhanced performance and aggressive sound.',
        price: 599.99,
        category: 'electronics',
        brand: 'GearGhar Performance',
        sku: 'EXH-001',
        stock: 8,
        images: [
            'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400&h=400&fit=crop'
        ],
        status: 'active',
        tags: [
            'exhaust',
            'carbon-fiber',
            'performance',
            'lightweight'
        ]
    },
    {
        name: 'Professional Riding Suit',
        description: 'Professional riding suit with advanced protection materials and ergonomic design.',
        price: 349.99,
        category: 'clothing',
        brand: 'GearGhar Pro',
        sku: 'SUIT-001',
        stock: 10,
        images: [
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'
        ],
        status: 'active',
        tags: [
            'suit',
            'riding',
            'professional',
            'protection'
        ]
    },
    {
        name: 'Full-Face Safety Helmet Pro',
        description: 'Professional full-face safety helmet with advanced ventilation and communication system.',
        price: 399.99,
        category: 'electronics',
        brand: 'GearGhar Pro',
        sku: 'HELM-002',
        stock: 6,
        images: [
            'https://images.unsplash.com/photo-1570995676569-90f6b56a29c4?w=400&h=400&fit=crop'
        ],
        status: 'active',
        tags: [
            'helmet',
            'full-face',
            'professional',
            'safety'
        ]
    },
    {
        name: 'Leather Riding Gloves Premium',
        description: 'Premium leather riding gloves with reinforced padding and weather protection.',
        price: 129.99,
        category: 'accessories',
        brand: 'GearGhar Premium',
        sku: 'GLOV-002',
        stock: 0,
        images: [
            'https://images.unsplash.com/photo-1539077682343-0d85a6a6a9df?w=400&h=400&fit=crop'
        ],
        status: 'out_of_stock',
        tags: [
            'gloves',
            'leather',
            'premium',
            'riding'
        ]
    }
];
async function GET(request) {
    try {
        // Verify admin authentication
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: 'Authorization token required'
            }, {
                status: 401
            });
        }
        const decoded = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyToken"])(token);
        if (!decoded || decoded.role !== 'admin') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: 'Admin access required'
            }, {
                status: 403
            });
        }
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$database$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["connectToDatabase"])();
        // Auto-seed products if none exist
        const productCount = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Product"].countDocuments();
        if (productCount === 0) {
            console.log('No products found, seeding database...');
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Product"].deleteMany({});
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Product"].insertMany(seedProducts);
            console.log(`Seeded ${seedProducts.length} products to database`);
        }
        // Get real user statistics
        const totalUsers = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["User"].countDocuments();
        const activeUsers = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["User"].countDocuments({
            status: 'active'
        });
        const adminUsers = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["User"].countDocuments({
            role: 'admin'
        });
        const regularUsers = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["User"].countDocuments({
            role: 'user'
        });
        // Get recent users (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentUsers = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["User"].countDocuments({
            createdAt: {
                $gte: sevenDaysAgo
            }
        });
        // Calculate user growth percentage
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const usersThirtyDaysAgo = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["User"].countDocuments({
            createdAt: {
                $lt: thirtyDaysAgo
            }
        });
        const usersLastThirtyDays = totalUsers - usersThirtyDaysAgo;
        const userGrowthPercentage = usersThirtyDaysAgo > 0 ? Math.round(usersLastThirtyDays / usersThirtyDaysAgo * 100) : 0;
        // Get real product statistics
        const totalProducts = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Product"].countDocuments();
        const activeProducts = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Product"].countDocuments({
            status: 'active'
        });
        const outOfStockProducts = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Product"].countDocuments({
            status: 'out_of_stock'
        });
        // Calculate product growth percentage (last 30 days)
        const productsThirtyDaysAgo = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Product"].countDocuments({
            createdAt: {
                $lt: thirtyDaysAgo
            }
        });
        const productsLastThirtyDays = totalProducts - productsThirtyDaysAgo;
        const productGrowthPercentage = productsThirtyDaysAgo > 0 ? Math.round(productsLastThirtyDays / productsThirtyDaysAgo * 100) : 0;
        // Get real order statistics
        const totalOrders = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].countDocuments();
        const paidOrders = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].countDocuments({
            paymentStatus: 'paid'
        });
        const pendingOrders = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].countDocuments({
            status: 'pending'
        });
        const completedOrders = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].countDocuments({
            status: 'delivered'
        });
        // Calculate order growth percentage (last 30 days)
        const ordersThirtyDaysAgo = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].countDocuments({
            createdAt: {
                $lt: thirtyDaysAgo
            }
        });
        const ordersLastThirtyDays = totalOrders - ordersThirtyDaysAgo;
        const orderGrowthPercentage = ordersThirtyDaysAgo > 0 ? Math.round(ordersLastThirtyDays / ordersThirtyDaysAgo * 100) : 0;
        // Calculate total revenue from paid orders
        const revenueResult = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].aggregate([
            {
                $match: {
                    paymentStatus: 'paid'
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
        // Calculate revenue growth percentage (last 30 days vs previous 30 days)
        const revenueLast30Days = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].aggregate([
            {
                $match: {
                    paymentStatus: 'paid',
                    createdAt: {
                        $gte: thirtyDaysAgo
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
        const revenueLast30DaysAmount = revenueLast30Days.length > 0 ? revenueLast30Days[0].total : 0;
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const revenuePrevious30Days = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].aggregate([
            {
                $match: {
                    paymentStatus: 'paid',
                    createdAt: {
                        $gte: sixtyDaysAgo,
                        $lt: thirtyDaysAgo
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
        const revenuePrevious30DaysAmount = revenuePrevious30Days.length > 0 ? revenuePrevious30Days[0].total : 0;
        const revenueGrowthPercentage = revenuePrevious30DaysAmount > 0 ? Math.round((revenueLast30DaysAmount - revenuePrevious30DaysAmount) / revenuePrevious30DaysAmount * 100) : 0;
        // Get recent orders with customer details
        const recentOrdersData = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Order$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Order"].find().populate('customer', 'firstName lastName email').sort({
            createdAt: -1
        }).limit(5).lean();
        const recentOrders = recentOrdersData.map((order)=>({
                id: order.orderNumber,
                customer: `${order.customer.firstName} ${order.customer.lastName}`,
                amount: `$${order.total.toFixed(2)}`,
                status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
                date: new Date(order.createdAt).toLocaleDateString()
            }));
        const dashboardStats = {
            totalUsers,
            activeUsers,
            adminUsers,
            regularUsers,
            recentUsers,
            userGrowthPercentage,
            totalProducts,
            activeProducts,
            outOfStockProducts,
            productGrowthPercentage,
            totalOrders,
            paidOrders,
            pendingOrders,
            completedOrders,
            orderGrowthPercentage,
            totalRevenue,
            revenueGrowthPercentage,
            recentOrders
        };
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: dashboardStats
        });
    } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'Failed to fetch dashboard statistics'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__c344705e._.js.map