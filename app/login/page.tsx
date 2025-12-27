import Link from 'next/link';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">⚙️</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">GearGhar</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account to continue shopping</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <LoginForm />
        </div>

        {/* Divider */}
        <div className="mt-8 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">or continue as</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Social Login */}
        <div className="mt-8 space-y-3">
          <button className="w-full py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2">
            <span>🔵</span> Google
          </button>
          <button className="w-full py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2">
            <span>📘</span> Facebook
          </button>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-600 mt-8">
          Are you an admin?{' '}
          <Link href="/admin/login" className="text-primary font-semibold hover:underline">
            Admin Login
          </Link>
        </p>
      </div>
    </div>
  );
}
