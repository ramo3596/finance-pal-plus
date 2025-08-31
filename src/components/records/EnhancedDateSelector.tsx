import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";

interface EnhancedDateSelectorProps {
  dateRange: { from: Date | null; to: Date | null };
  onDateRangeChange: (range: { from: Date | null; to: Date | null }) => void;
}

type IntervalType = "interval" | "weeks" | "months" | "years";
type PresetType = "last7" | "last30" | "last90" | "last12months" | "thisweek" | "thismonth" | "thisyear" | "custom";

export function EnhancedDateSelector({ dateRange, onDateRangeChange }: EnhancedDateSelectorProps) {
  const [selectedTab, setSelectedTab] = useState<IntervalType>("interval");
  const [selectedPreset, setSelectedPreset] = useState<PresetType>("last30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [currentPeriod, setCurrentPeriod] = useState(new Date());
  const isMobile = useIsMobile();

  const presetOptions = [
    { id: "last7", label: "Últimos 7 días" },
    { id: "last30", label: "Últimos 30 días" },
    { id: "last90", label: "Últimos 90 días" },
    { id: "last12months", label: "Últimos 12 meses" },
    { id: "thisweek", label: "Esta semana" },
    { id: "thismonth", label: "Este mes" },
    { id: "thisyear", label: "Este año" },
    { id: "custom", label: "Intervalo personalizado" }
  ];

  const getPresetRange = (preset: PresetType): { from: Date; to: Date } | null => {
    const now = new Date();
    
    switch (preset) {
      case "last7":
        return { from: subDays(now, 6), to: now };
      case "last30":
        return { from: subDays(now, 29), to: now };
      case "last90":
        return { from: subDays(now, 89), to: now };
      case "last12months":
        return { from: subYears(now, 1), to: now };
      case "thisweek":
        return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
      case "thismonth":
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case "thisyear":
        return { from: startOfYear(now), to: endOfYear(now) };
      default:
        return null;
    }
  };

  const getCurrentPeriodRange = (type: IntervalType): { from: Date; to: Date } => {
    switch (type) {
      case "weeks":
        return { 
          from: startOfWeek(currentPeriod, { weekStartsOn: 1 }), 
          to: endOfWeek(currentPeriod, { weekStartsOn: 1 }) 
        };
      case "months":
        return { 
          from: startOfMonth(currentPeriod), 
          to: endOfMonth(currentPeriod) 
        };
      case "years":
        return { 
          from: startOfYear(currentPeriod), 
          to: endOfYear(currentPeriod) 
        };
      default:
        return { from: currentPeriod, to: currentPeriod };
    }
  };

  const navigatePeriod = (direction: "prev" | "next", type: IntervalType) => {
    let newPeriod: Date;
    
    switch (type) {
      case "weeks":
        newPeriod = direction === "next" ? addWeeks(currentPeriod, 1) : subWeeks(currentPeriod, 1);
        break;
      case "months":
        newPeriod = direction === "next" ? addMonths(currentPeriod, 1) : subMonths(currentPeriod, 1);
        break;
      case "years":
        newPeriod = direction === "next" ? addYears(currentPeriod, 1) : subYears(currentPeriod, 1);
        break;
      default:
        newPeriod = direction === "next" ? addDays(currentPeriod, 1) : subDays(currentPeriod, 1);
    }
    
    setCurrentPeriod(newPeriod);
    const range = getCurrentPeriodRange(type);
    onDateRangeChange(range);
  };

  const handlePresetSelect = (preset: PresetType) => {
    setSelectedPreset(preset);
    const range = getPresetRange(preset);
    if (range) {
      onDateRangeChange(range);
    }
  };

  const handleCustomDateApply = () => {
    if (customFrom && customTo) {
      onDateRangeChange({
        from: new Date(customFrom),
        to: new Date(customTo)
      });
    }
  };

  const handleTabChange = (tab: IntervalType) => {
    setSelectedTab(tab);
    if (tab !== "interval") {
      const range = getCurrentPeriodRange(tab);
      onDateRangeChange(range);
    }
  };

  const getPeriodLabel = (type: IntervalType): string => {
    const range = getCurrentPeriodRange(type);
    switch (type) {
      case "weeks":
        return `${format(range.from, "dd MMM", { locale: es })} - ${format(range.to, "dd MMM yyyy", { locale: es })}`;
      case "months":
        return format(currentPeriod, "MMMM yyyy", { locale: es });
      case "years":
        return format(currentPeriod, "yyyy", { locale: es });
      default:
        return format(currentPeriod, "dd MMM yyyy", { locale: es });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={isMobile ? "outline" : "outline"}
          size={isMobile ? "icon" : "default"}
          className={cn(
            isMobile ? "w-10 h-10 p-0" : "w-[280px] justify-start text-left font-normal",
            !dateRange.from && "text-muted-foreground"
          )}
        >
          <CalendarIcon className={isMobile ? "h-5 w-5" : "mr-2 h-4 w-4"} />
          {!isMobile && dateRange.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "dd MMM", { locale: es })} -{" "}
                {format(dateRange.to, "dd MMM yyyy", { locale: es })}
              </>
            ) : (
              format(dateRange.from, "dd MMM yyyy", { locale: es })
            )
          ) : (
            !isMobile && <span>Seleccionar fechas</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          <Tabs value={selectedTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="interval">Intervalo</TabsTrigger>
              <TabsTrigger value="weeks">Semanas</TabsTrigger>
              <TabsTrigger value="months">Meses</TabsTrigger>
              <TabsTrigger value="years">Años</TabsTrigger>
            </TabsList>

            <TabsContent value="interval" className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {presetOptions.map((option) => (
                  <Button
                    key={option.id}
                    variant={selectedPreset === option.id ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => handlePresetSelect(option.id as PresetType)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              
              {selectedPreset === "custom" && (
                <div className="space-y-3 pt-3 border-t">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="from-date" className="text-xs">Desde</Label>
                      <Input
                        id="from-date"
                        type="date"
                        value={customFrom}
                        onChange={(e) => setCustomFrom(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="to-date" className="text-xs">Hasta</Label>
                      <Input
                        id="to-date"
                        type="date"
                        value={customTo}
                        onChange={(e) => setCustomTo(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={handleCustomDateApply}
                  >
                    Aplicar Fechas
                  </Button>
                </div>
              )}
            </TabsContent>

            {["weeks", "months", "years"].map((tabValue) => (
              <TabsContent key={tabValue} value={tabValue} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigatePeriod("prev", tabValue as IntervalType)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <span className="font-medium text-sm">
                    {getPeriodLabel(tabValue as IntervalType)}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigatePeriod("next", tabValue as IntervalType)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  );
}