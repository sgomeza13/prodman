import React from "react";
import {
  Package,
  Tags,
  Menu,
  X,
  Languages,
  Store,
  ShoppingCart,
  Truck,
  Handshake,
  Receipt,
  BarChart3,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "react-router";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";

const navItems = [
  { id: "pos", icon: ShoppingCart, path: "/pos" },
  { id: "inventory", icon: Package, path: "/" },
  { id: "purchases", icon: Truck, path: "/purchases" },
  { id: "sales", icon: Receipt, path: "/sales" },
  { id: "dashboard", icon: BarChart3, path: "/reports" },
  { id: "brands", icon: Store, path: "/brands" },
  { id: "providers", icon: Handshake, path: "/providers" },
  { id: "categories", icon: Tags, path: "/categories" },
  { id: "settings", icon: Settings, path: "/settings" },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = React.useState(true);
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(nextLang);
  };

  return (
    <div 
      className={cn(
        "h-screen border-r bg-card transition-all duration-300 flex flex-col",
        isOpen ? "w-64" : "w-20"
      )}
    >
      <div className="p-6 flex items-center justify-between border-b">
        {isOpen && (
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight">Prodman</span>
          </div>
        )}
        <Button 
          onClick={() => setIsOpen(!isOpen)}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => cn(
              "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group",
              isActive 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "hover:bg-accent text-muted-foreground hover:text-foreground"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn(
                  "w-5 h-5",
                  isActive ? "text-primary-foreground" : "group-hover:text-foreground"
                )} />
                {isOpen && <span className="font-medium">{t(`sidebar.${item.id}`)}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200",
            !isOpen && "justify-center"
          )}
          onClick={toggleLanguage}
        >
          <Languages className="w-5 h-5 shrink-0" />
          {isOpen && (
            <div className="flex flex-col items-start overflow-hidden">
              <span className="text-xs font-bold uppercase tracking-tighter opacity-50">
                {t("sidebar.language")}
              </span>
              <span className="font-medium truncate">
                {i18n.language === 'es' ? 'Español' : 'English'}
              </span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
