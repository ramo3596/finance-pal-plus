import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";

interface MultiSelectOption {
  id: string;
  name: string;
  color?: string;
}

interface MultiSelectAutocompleteProps {
  options: MultiSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelectAutocomplete({
  options,
  value,
  onValueChange,
  placeholder = "Buscar...",
  className,
  disabled = false,
}: MultiSelectAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term and exclude already selected
  const filteredOptions = options.filter(option => {
    const matchesSearch = searchTerm.trim() === "" || 
      option.name.toLowerCase().includes(searchTerm.toLowerCase());
    const notSelected = !value.includes(option.id);
    return matchesSearch && notSelected;
  });

  // Get selected options for display
  const selectedOptions = options.filter(option => value.includes(option.id));

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
    const newValue = [...value, option.id];
    onValueChange(newValue);
    setSearchTerm("");
    inputRef.current?.focus();
  };

  const handleRemoveOption = (optionId: string) => {
    const newValue = value.filter(id => id !== optionId);
    onValueChange(newValue);
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
    } else if (e.key === "Backspace" && searchTerm === "" && value.length > 0) {
      // Remove last selected option when backspace is pressed on empty input
      const newValue = value.slice(0, -1);
      onValueChange(newValue);
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Selected options display */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedOptions.map((option) => (
            <Badge
              key={option.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
              style={option.color ? { 
                backgroundColor: `${option.color}20`, 
                color: option.color,
                borderColor: `${option.color}40`
              } : {}}
            >
              {option.color && (
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: option.color }}
                />
              )}
              <span className="text-xs">{option.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveOption(option.id)}
                className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      
      {/* Input field */}
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={selectedOptions.length > 0 ? "Agregar más..." : placeholder}
          disabled={disabled}
          className="pr-10"
        />
        <ChevronDown 
          className={cn(
            "absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </div>
      
      {/* Dropdown */}
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
                className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleOptionSelect(option)}
              >
                {option.color && (
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: option.color }}
                  />
                )}
                <span>{option.name}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}