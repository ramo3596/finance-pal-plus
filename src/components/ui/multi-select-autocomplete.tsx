import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";

interface MultiSelectOption {
  id: string;
  name: string;
  color?: string;
}

interface MultiSelectAutocompleteProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showColors?: boolean;
}

export function MultiSelectAutocomplete({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Buscar y seleccionar...",
  className,
  disabled = false,
  showColors = false,
}: MultiSelectAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term and exclude already selected
  const filteredOptions = options.filter(option => {
    const matchesSearch = searchTerm.trim() === "" || 
      option.name.toLowerCase().includes(searchTerm.toLowerCase());
    const notSelected = !selectedValues.includes(option.id);
    return matchesSearch && notSelected;
  });

  // Get selected options for display
  const selectedOptions = options.filter(option => selectedValues.includes(option.id));

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleOptionSelect = (option: MultiSelectOption) => {
    const newSelectedValues = [...selectedValues, option.id];
    onSelectionChange(newSelectedValues);
    setSearchTerm("");
    inputRef.current?.focus();
  };

  const handleRemoveSelection = (optionId: string) => {
    const newSelectedValues = selectedValues.filter(id => id !== optionId);
    onSelectionChange(newSelectedValues);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
      inputRef.current?.blur();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions.length === 1) {
        handleOptionSelect(filteredOptions[0]);
      }
    } else if (e.key === "Backspace" && searchTerm === "" && selectedValues.length > 0) {
      // Remove last selected item when backspace is pressed on empty input
      const lastSelectedId = selectedValues[selectedValues.length - 1];
      handleRemoveSelection(lastSelectedId);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-1 items-center">
          {/* Selected items as badges */}
          {selectedOptions.map((option) => (
            <Badge
              key={option.id}
              variant="secondary"
              className="flex items-center gap-1 text-xs"
              style={showColors && option.color ? { backgroundColor: option.color, color: 'white' } : {}}
            >
              {showColors && option.color && (
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: option.color }}
                />
              )}
              {option.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemoveSelection(option.id)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          {/* Input field */}
          <div className="flex-1 min-w-[120px] relative">
            <Input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              placeholder={selectedValues.length === 0 ? placeholder : ""}
              disabled={disabled}
              className="border-0 p-0 h-6 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <ChevronDown 
              className={cn(
                "absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-transform cursor-pointer",
                isOpen && "rotate-180"
              )}
              onClick={() => setIsOpen(!isOpen)}
            />
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {filteredOptions.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              {searchTerm ? "No se encontraron resultados" : "No hay más opciones disponibles"}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.id}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleOptionSelect(option)}
              >
                <div className="flex items-center gap-2">
                  {showColors && option.color && (
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  {option.name}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}