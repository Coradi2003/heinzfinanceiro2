"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  CalendarMinus, 
  Users, 
  Wallet, 
  Scissors, 
  Package, 
  FileText, 
  Settings,
  LogOut,
  Menu,
  X,
  Zap
} from "lucide-react";

import { InstallAppButton } from "./InstallAppButton";

const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Agenda", href: "/agenda", icon: CalendarMinus },
  { name: "Vendas", href: "/vendas", icon: Wallet },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Serviços", href: "/servicos", icon: Scissors },
  { name: "Produtos", href: "/produtos", icon: Package },
  { name: "Documentos", href: "/contrato", icon: FileText },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Erro ao fazer signOut:', e);
    } finally {
      // Força reload completo para limpar sessão no PWA
      window.location.href = '/login';
    }
  };

  if (pathname === "/login" || pathname === "/relatorio") return null;

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100 w-full shrink-0 no-print">
        <Link href="/" className="flex items-center gap-3 group">
           <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-white bg-[#E38F85] shadow-md shadow-primary/20 ring-1 ring-primary/5 group-hover:scale-105 transition-transform duration-300">
             <Image src="/logo.jpeg" alt="Studio Paty Heinz" fill className="object-contain" sizes="40px" />
           </div>
           <span className="font-black text-lg text-gray-900 tracking-tight uppercase">Studio Paty Heinz</span>
        </Link>
        <button onClick={() => setIsOpen(true)} className="p-2 bg-gray-50 rounded-xl text-gray-700 hover:bg-gray-100">
          <Menu size={24} />
        </button>
      </div>

      {/* MOBILE BACKDROP */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* DEFAULT DRAWER ASIDE */}
      <aside className={`fixed md:relative left-0 top-0 h-screen w-72 md:w-64 bg-white border-r border-gray-100 flex flex-col shadow-2xl md:shadow-sm z-50 transform transition-transform duration-300 md:translate-x-0 no-print ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* MOBILE CLOSE BTN */}
        <button onClick={() => setIsOpen(false)} className="md:hidden absolute top-5 right-5 p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100">
           <X size={20} />
        </button>

        {/* Logo and Branding */}
      <Link href="/" onClick={() => setIsOpen(false)} className="pt-10 pb-8 border-b border-gray-50 flex flex-col items-center justify-center gap-4 group">
        <div className="relative w-32 h-32 rounded-3xl overflow-hidden border-4 border-white bg-[#E38F85] shadow-xl shadow-primary/20 ring-2 ring-primary/5 group-hover:scale-105 transition-transform duration-300">
           <Image 
             src="/logo.jpeg" 
             alt="Studio Paty Heinz" 
             fill 
             className="object-contain"
             sizes="128px"
             priority
           />
        </div>
        <span className="font-black text-xl text-gray-900 tracking-tight uppercase group-hover:text-primary transition-colors">Studio Paty Heinz</span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 focus-within:ring-0">
        
        {/* BOTÃO INSTALAR PWA */}
        <div className="px-1">
          <InstallAppButton />
        </div>

        {/* BOTÃO VENDA RÁPIDA FIXO */}
        <button 
          onClick={() => {
            setIsOpen(false);
            const { useUIStore } = require("@/store/useUIStore");
            useUIStore.getState().openVendaRapida();
          }}
          className="flex items-center gap-3 w-full px-4 py-3.5 mb-4 rounded-2xl bg-yellow-50 text-yellow-700 border-2 border-yellow-200 hover:bg-yellow-100 transition-all font-black uppercase text-[10px] tracking-widest shadow-sm"
        >
          <Zap size={18} fill="currentColor" />
          <span>Venda Rápida</span>
        </button>

        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              onClick={() => setIsOpen(false)}
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 md:py-3 rounded-2xl transition-all duration-200 group ${
                isActive 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-primary"
              }`}
            >
              <Icon size={20} className={isActive ? "text-white" : "text-gray-400 group-hover:text-primary"} />
              <span className="font-bold md:font-medium text-[15px] md:text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout / Bottom */}
      <div className="p-4 border-t border-gray-50">
        <button onClick={handleLogout} className="flex justify-center items-center gap-2 w-full px-4 py-2 text-sm text-gray-400 hover:text-red-500 transition-colors">
          <LogOut size={16} />
          <span>Sair do sistema</span>
        </button>
      </div>
    </aside>
    </>
  );
}
