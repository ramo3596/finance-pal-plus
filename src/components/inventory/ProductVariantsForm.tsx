import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

export function ProductVariantsForm() {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="space-y-4">
          <div className="text-muted-foreground">
            No hay variantes agregadas
          </div>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Agregar variante
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}