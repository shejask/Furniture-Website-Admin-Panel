import { Icons } from '@/components/icons';
import type { ShippingRule, ShippingFormData, ShippingRulesByCountry } from './shipping';

export interface NavItem {
  title: string;
  url: string;
  disabled?: boolean;
  external?: boolean;
  shortcut?: [string, string];
  icon?: keyof typeof Icons;
  label?: string;
  description?: string;
  isActive?: boolean;
  items?: NavItem[];
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export interface FooterItem {
  title: string;
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
}

export type MainNavItem = NavItemWithOptionalChildren;

export type SidebarNavItem = NavItemWithChildren;

// Re-export shipping types
export type { 
  ShippingRule, 
  ShippingFormData, 
  ShippingRulesByCountry,
  Country,
  State,
  City,
  CountryFormData,
  StateFormData,
  CityFormData,
  HierarchicalShippingData
} from './shipping';

// Re-export coupon types
export type {
  Coupon,
  CouponFormData,
  DiscountType,
  CouponUsage,
  CouponValidation,
  CouponStats
} from './coupon';

// Re-export tax types
export type {
  Tax,
  TaxFormData,
  TaxStats,
  TaxFilters,
  TaxSortOptions
} from './tax';
