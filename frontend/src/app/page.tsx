import { Truck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl mb-6 shadow-2xl">
            <Truck className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            TekMax Delivery Platform
          </h1>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Streamline your delivery operations with our comprehensive SaaS platform. 
            Manage orders, track deliveries, and scale your business effortlessly.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors shadow-lg"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-20">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white border border-white/20">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Tracking</h3>
            <p className="text-primary-100">
              Track deliveries in real-time with GPS integration and live updates.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white border border-white/20">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Assignment</h3>
            <p className="text-primary-100">
              Automatically assign deliveries to the nearest available rider.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white border border-white/20">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
            <p className="text-primary-100">
              Comprehensive analytics and insights to optimize your operations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
