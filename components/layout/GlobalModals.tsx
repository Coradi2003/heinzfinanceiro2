"use client";

import { ModalVendaRapida } from "@/components/produtos/ModalVendaRapida";
import { useUIStore } from "@/store/useUIStore";

export function GlobalModals() {
  const { isVendaRapidaOpen, closeVendaRapida } = useUIStore();

  return (
    <>
      <ModalVendaRapida 
        isOpen={isVendaRapidaOpen} 
        onClose={closeVendaRapida} 
      />
    </>
  );
}
