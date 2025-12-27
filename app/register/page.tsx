import Link from 'next/link';
import RegisterForm from '@/components/RegisterForm';

export default function RegisterPage() {
  //safasf
  //register page UI
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
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join GearGhar and start shopping for premium motorcycle parts</p>
        </div>

        {/* Register Form Card */}
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <RegisterForm />
        </div>

        {/* Divider */}
        <div className="mt-8 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">or sign up with</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Social Signup */}
        <div className="mt-8 space-y-3">
          <button className="w-full py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2">
            <span>🔵</span> Google
          </button>
          <button className="w-full py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2">
            <span>📘</span> Facebook
          </button>
        </div>
      </div>
    </div>
  );
}
