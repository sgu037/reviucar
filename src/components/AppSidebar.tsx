import { History, LogOut, Car } from "lucide-react";
import { CreditCard, Settings } from "lucide-react";
import { ReviuCarLogo } from "@/components/ReviuCarLogo";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  onNavigate: (page: 'main' | 'history' | 'plans' | 'settings') => void;
  currentPage: 'main' | 'history' | 'plans' | 'settings';
}

export function AppSidebar({ onNavigate, currentPage }: AppSidebarProps) {
  const { signOut } = useAuth();

  const menuItems = [
    {
      title: "Nova Análise",
      icon: Car,
      onClick: () => onNavigate('main'),
      isActive: currentPage === 'main'
    },
    {
      title: "Histórico",
      icon: History,
      onClick: () => onNavigate('history'),
      isActive: currentPage === 'history'
    },
    {
      title: "Planos",
      icon: CreditCard,
      onClick: () => onNavigate('plans'),
      isActive: currentPage === 'plans'
    },
    {
      title: "Configurações",
      icon: Settings,
      onClick: () => onNavigate('settings'),
      isActive: currentPage === 'settings'
    }
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-center py-4">
          <ReviuCarLogo size="md" showText={true} />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={item.onClick}
                    isActive={item.isActive}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}