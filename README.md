# GearGhar - Premium Motorcycle Parts Ecommerce Platform

A modern, production-ready ecommerce platform for motorcycle parts and accessories built with Next.js, MongoDB, and TypeScript.

## 🚀 Features

### User Features
- **Home Page**: Attractive landing page with featured products and categories
- **Authentication**: Secure user registration and login with Zod validation
- **Product Catalog**: Browse products by categories (Helmets, Handlebars, Gloves, Tyres, Exhaust Systems, Accessories)
- **Product Filtering**: Filter by category and price range
- **User Dashboard**: Profile management, order history, wishlist, and settings
- **Shopping**: Add items to cart, view product details, and checkout
- **Responsive Design**: Mobile-friendly interface that works on all devices

### Admin Features
- **Admin Authentication**: Separate secure admin login portal
- **Admin Dashboard**: Overview of sales, orders, users, and products
- **Product Management**: Add, edit, and manage products
- **Order Management**: View and manage customer orders
- **User Management**: Monitor and manage customer accounts
- **Analytics**: View sales statistics and business metrics

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB Atlas
- **Authentication**: JWT with bcryptjs password hashing
- **Form Validation**: Zod + React Hook Form
- **UI Components**: Radix UI, Lucide React Icons
- **Styling**: Tailwind CSS with custom design system

## 📁 Project Structure

```
gearghar/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── admin/
│   │   ├── login/page.tsx
│   │   └── dashboard/page.tsx
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts
│   │       ├── register/route.ts
│   │       └── admin-login/route.ts
│   ├── shop/page.tsx
│   ├── dashboard/page.tsx
│   ├── categories/page.tsx
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   ├── layout.tsx
│   ├── page.tsx (home)
│   └── globals.css
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── CategoryCard.tsx
│   └── ProductCard.tsx
├── lib/
│   ├── db.ts (MongoDB connection)
│   ├── auth.ts (Authentication utilities)
│   └── validation.ts (Zod schemas)
├── public/
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.mjs
└── postcss.config.js
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17 or higher
- MongoDB Atlas account (free tier available)
- npm or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gearghar
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure MongoDB Atlas**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster
   - Get your connection string
   - Add it to `.env.local` as `MONGODB_URI`

5. **Generate JWT Secret**
   ```bash
   openssl rand -base64 32
   ```
   Add the generated secret to `.env.local` as `JWT_SECRET`

6. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📄 Pages and Routes

### Public Routes
- `/` - Home page with featured products
- `/shop` - Product listing with filters
- `/categories` - Browse all categories
- `/about` - About GearGhar
- `/contact` - Contact form
- `/login` - User login
- `/register` - User registration

### Protected Routes (Authentication Required)
- `/dashboard` - User profile and order history
- `/admin/dashboard` - Admin dashboard (Admin only)

### API Routes
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/admin-login` - Admin login

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  address: String,
  role: String ('user' | 'admin'),
  status: String ('active' | 'inactive'),
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

### Products Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  category: String,
  price: Number,
  originalPrice: Number,
  image: String,
  stock: Number,
  rating: Number,
  reviews: Array,
  createdAt: Date,
  updatedAt: Date
}
```

### Orders Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  items: Array,
  totalAmount: Number,
  status: String ('pending' | 'processing' | 'completed' | 'cancelled'),
  shippingAddress: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Authentication

The platform uses JWT (JSON Web Tokens) for authentication:

1. **Registration**: User creates account with email and password
2. **Login**: Email and password are verified against hashed passwords in database
3. **Token Generation**: Upon successful login, a JWT token is generated (expires in 7 days)
4. **Token Storage**: Token is stored in localStorage on the client
5. **Authorization**: Protected routes check for valid token in request headers

### Admin Authentication
- Admins have separate login at `/admin/login`
- Admin token includes `role: 'admin'` claim
- Admin routes check for admin role authorization

## 🔒 Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT token-based authentication
- ✅ Zod schema validation for all inputs
- ✅ Protected API routes
- ✅ Environment variable management for sensitive data
- ✅ CORS-enabled API endpoints

## 🎨 Customization

### Tailwind Configuration
Edit `tailwind.config.ts` to customize:
- Color scheme (primary color is set to orange: `#ff6b35`)
- Typography and spacing
- Responsive breakpoints

### Global Styles
Edit `app/globals.css` to modify:
- CSS variables for colors
- Base styles for HTML elements
- Component-level utility classes

## 📦 Building for Production

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

3. **Deploy to hosting platform**
   - [Vercel](https://vercel.com) - Recommended for Next.js
   - [Netlify](https://netlify.com)
   - [AWS Amplify](https://aws.amazon.com/amplify/)
   - Traditional hosting with Node.js support

## 🚀 Deployment Guide

### Vercel (Recommended)
1. Push code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Netlify
1. Connect your GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify dashboard

### MongoDB Atlas Setup for Production
1. Create a production cluster
2. Whitelist your application's IP address
3. Create a database user with strong password
4. Use the production connection string in environment variables

## 📚 Additional Setup

### Creating Admin Account
To create an admin account manually:

1. Connect to your MongoDB database
2. Insert a document in the `admins` collection:
   ```javascript
   {
     firstName: "Admin",
     lastName: "User",
     email: "admin@gearghar.com",
     password: "hashed_password_here", // Use bcryptjs to hash
     role: "admin",
     status: "active",
     createdAt: new Date(),
     updatedAt: new Date()
   }
   ```

3. Use the email and password to login at `/admin/login`

## 🛑 Future Enhancements

- [ ] Payment integration (Stripe/PayPal)
- [ ] Email notifications
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Search functionality
- [ ] Product recommendations
- [ ] Inventory management
- [ ] Invoice generation
- [ ] Shipping integration
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Advanced analytics

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For questions or support, please contact support@gearghar.com or visit our contact page at /contact.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database with [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- UI Components with [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
