'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Truck, 
  Users, 
  Settings, 
  LogOut,
  Store,
  Package
} from 'lucide-react';

interface SidebarProps {
  userRole: string;
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = {
    admin: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/restaurants', label: 'Restaurants', icon: Store },
      { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/admin/deliveries', label: 'Deliveries', icon: Truck },
      { href: '/admin/riders', label: 'Riders', icon: Users },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
    restaurant_owner: [
      { href: '/restaurant/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/restaurant/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/restaurant/deliveries', label: 'Deliveries', icon: Truck },
      { href: '/restaurant/riders', label: 'Riders', icon: Users },
      { href: '/restaurant/settings', label: 'Settings', icon: Settings },
    ],
    rider: [
      { href: '/rider/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/rider/deliveries', label: 'My Deliveries', icon: Package },
      { href: '/rider/settings', label: 'Settings', icon: Settings },
    ],
  };

  const items = menuItems[userRole as keyof typeof menuItems] || menuItems.restaurant_owner;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col flex-shrink-0">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">TekMax</h1>
        <p className="text-sm text-gray-400 mt-1">Delivery Platform</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white w-full transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}
