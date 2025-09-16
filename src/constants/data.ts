import { NavItem } from '@/types';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: [] // Empty array as there are no child items for Dashboard
  },
  {
    title: 'Product Management',
    url: '/dashboard/product',
    icon: 'product',
    shortcut: ['p', 'p'],
    isActive: true,
    items: [
      {
        title: 'All Products',
        url: '/dashboard/product',
        icon: 'product',
        shortcut: ['p', 'a']
      },
      {
        title: 'Add Product',
        url: '/dashboard/product/add',
        icon: 'plus',
        shortcut: ['p', 'n']
      },
      {
        title: 'Tags',
        url: '/dashboard/product/tags',
        icon: 'tag',
        shortcut: ['p', 'g']
      },
      {
        title: 'Brands',
        url: '/dashboard/product/brands',
        icon: 'brand',
        shortcut: ['p', 'b']
      },
      {
        title: 'Categories',
        url: '/dashboard/product/categories',
        icon: 'tag',
        shortcut: ['p', 'c']
      }
    ]
  },
  
  {
    title: 'FAQ',
    url: '/dashboard/faq',
    icon: 'help',
    shortcut: ['f', 'f'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'Coupons',
    url: '/dashboard/coupons',
    icon: 'tag',
    shortcut: ['c', 'c'],
    isActive: false,
    items: [] // No child items
  },
  
  {
    title: 'Customers',
    url: '/dashboard/customers',
    icon: 'user',
    shortcut: ['c', 'u'],
    isActive: false,
    items: [] // No child items
  },

  {
    title: 'Media',
    url: '/dashboard/media',
    icon: 'media',
    shortcut: ['m', 'e'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'Testimonials',
    url: '/dashboard/testimonials',
    icon: 'messageSquare',
    shortcut: ['t', 'e'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'Blogs',
    url: '/dashboard/blogs',
    icon: 'fileText',
    shortcut: ['b', 'l'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'Vendors',
    url: '/dashboard/vendors',
    icon: 'store',
    shortcut: ['v', 'e'],
    isActive: false,
    items: [
      {
        title: 'All Vendors',
        url: '/dashboard/vendors',
        description: 'Manage vendor accounts'
      },
      {
        title: 'Products',
        url: '/dashboard/vendors/products',
        description: 'Browse all vendor products'
      },
      {
        title: 'Signups',
        url: '/dashboard/vendors/signups',
        description: 'Review vendor applications'
      }
    ]
  },
  {
    title: 'Orders',
    url: '/dashboard/orders',
    icon: 'shoppingCart',
    shortcut: ['o', 'r'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'Reviews',
    url: '/dashboard/reviews',
    icon: 'reviews',
    shortcut: ['r', 'v'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'Payments',
    url: '/dashboard/payments',
    icon: 'payments',
    shortcut: ['p', 'y'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'Notifications',
    url: '/dashboard/notifications',
    icon: 'bell',
    shortcut: ['n', 'o'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'Shipping',
    url: '/dashboard/shipping',
    icon: 'truck',
    shortcut: ['s', 'h'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'Taxes',
    url: '/dashboard/taxes',
    icon: 'percent',
    shortcut: ['t', 'x'],
    isActive: false,
    items: [] // No child items
  }
];

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: '+$1,999.00',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'OM'
  },
  {
    id: 2,
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'JL'
  },
  {
    id: 3,
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: '+$299.00',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'IN'
  },
  {
    id: 4,
    name: 'William Kim',
    email: 'will@email.com',
    amount: '+$99.00',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'WK'
  },
  {
    id: 5,
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'SD'
  }
];
