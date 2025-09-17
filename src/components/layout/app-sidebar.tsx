'use client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { navItems } from '@/constants/data';
import { useMediaQuery } from '@/hooks/use-media-query';
import { getCurrentUser, signOut } from '@/lib/auth';
import {
  IconChevronRight,
  IconLogout,
  IconPhotoUp
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { OrgSwitcher } from '../org-switcher';
import { User } from '@/lib/auth';

export const company = {
  name: 'Acme Inc',
  logo: IconPhotoUp,
  plan: 'Enterprise'
};

const tenants = [
  { id: '1', name: 'Acme Inc' },
  { id: '2', name: 'Beta Corp' },
  { id: '3', name: 'Gamma Ltd' }
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const [user, setUser] = React.useState<User | null>(null);
  const router = useRouter();
  
  React.useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleSwitchTenant = () => {
    // Tenant switching functionality would be implemented here
    // When implementing, you can access the tenant ID from the OrgSwitcher component
  };

  const handleSignOut = () => {
    signOut();
    router.push('/auth/sign-in');
  };

  const activeTenant = tenants[0];

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <OrgSwitcher
          tenants={tenants}
          defaultTenant={activeTenant}
          onTenantSwitch={handleSwitchTenant}
        />
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden scrollbar-hide'>
        <SidebarGroup>
          <SidebarGroupLabel>
            {user?.role === 'vendor' ? 'Vendor Dashboard' : 'Overview'}
          </SidebarGroupLabel>
          <SidebarMenu>
            {navItems
              .filter((item) => {
                // Filter navigation items based on user role
                if (user?.role === 'vendor') {
                  // Show only vendor-specific items
                  return [
                    'Vendor Dashboard',
                    'Vendor Payments', 
                    'My Orders',
                    'My Products',
                    'Profile'
                  ].includes(item.title);
                } else {
                  // Show admin items (exclude vendor-specific items)
                  return ![
                    'Vendor Dashboard',
                    'Vendor Payments',
                    'My Orders',
                    'My Products'
                  ].includes(item.title);
                }
              })
              .map((item) => {
                const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                return item?.items && item?.items?.length > 0 ? (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={item.isActive}
                    className='group/collapsible'
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={pathname === item.url}
                        >
                          {item.icon && <Icon />}
                          <span>{item.title}</span>
                          <IconChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === subItem.url}
                              >
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={pathname === item.url}
                    >
                      <Link href={item.url}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between w-full p-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {user && (
                  <UserAvatarProfile
                    className='h-8 w-8 rounded-lg flex-shrink-0'
                    showInfo
                    user={user}
                  />
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                title="Sign Out"
              >
                <IconLogout className="h-4 w-4" />
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
