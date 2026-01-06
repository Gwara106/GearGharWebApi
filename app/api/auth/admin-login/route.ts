import { NextRequest } from 'next/server';
import { AuthController } from '../../../../src/controllers/auth.controller';
import { connectToDatabase } from '../../../../src/config/database';

// Initialize controller
const authController = new AuthController();

export async function POST(request: NextRequest) {
  // Ensure database connection
  await connectToDatabase();
  
  // Delegate to controller
  return authController.adminLogin(request);
}

export async function GET() {
  return new Response('Method not allowed', { status: 405 });
}
