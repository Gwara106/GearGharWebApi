module.exports = [
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
];

//# sourceMappingURL=src_models_Product_ts_fe7c229f._.js.map