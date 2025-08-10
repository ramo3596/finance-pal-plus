import * as React from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface FloatingActionButtonProps {
  onClick: () => void
  label?: string
}

export function FloatingActionButton({ onClick, label = "Añadir" }: FloatingActionButtonProps) {
  return (
    <Button
      aria-label={label}
      title={label}
      onClick={onClick}
      className="md:hidden fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full shadow-lg"
      size="icon"
    >
      <Plus className="h-6 w-6" />
    </Button>
  )
}
