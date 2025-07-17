import { useState } from "react";
import { Menu, X, History, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ReviuCarLogo } from "@/components/ReviuCarLogo";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/hooks/use-auth";

interface NavigationProps {
  onHistoryClick: () => void;
}

export const Navigation = ({ onHistoryClick }: NavigationProps) => {
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      label: "Histórico",
      icon: History,
      onClick: () => {
        onHistoryClick();
        setIsOpen(false);
      }
    },
    {
      label: "Sair",
      icon: LogOut,
      onClick: () => {
        signOut();
        setIsOpen(false);
      }
    }
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onHistoryClick}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
        >
          <History className="mr-2 h-4 w-4" />
          Histórico
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
          className="bg-black border-black text-white hover:bg-black/90 hover:text-white"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
        <UserMenu />
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b">
                <ReviuCarLogo size="md" showText={true} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 py-6">
                <div className="space-y-2">
                  {menuItems.map((item) => (
                    <Button
                      key={item.label}
                      variant="ghost"
                      className="w-full justify-start text-left h-12"
                      onClick={item.onClick}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.label}
                    </Button>
                  ))}
                </div>
              </nav>

              {/* User Info */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-3 p-2">
                  <UserMenu />
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};