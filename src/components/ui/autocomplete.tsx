import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface AutocompleteOption {
  id: string;
  name: string;
  color?: string;
}

interface AutocompleteProps {
  options: AutocompleteOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Autocomplete({
  options,
  value,
  onValueChange,
  placeholder = "Buscar...",
  className,
  disabled = false,
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOption, setSelectedOption] = useState<AutocompleteOption | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  const filteredOptions = searchTerm.trim() === "" 
    ? options // Show all options when no search term
    : options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  // Update selected option when value changes externally
  useEffect(() => {
    if (value) {
      const option = options.find(opt => opt.id === value);
      if (option) {
        setSelectedOption(option);
        setSearchTerm(option.name);
      }
    } else {
      setSelectedOption(null);
      setSearchTerm("");
    }
  }, [value, options]);

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
        // If no option is selected, clear the search term
        if (!selectedOption) {
          setSearchTerm("");
        } else {
          setSearchTerm(selectedOption.name);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedOption]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    
    // If input is cleared, clear selection
    if (newValue === "") {
      setSelectedOption(null);
      onValueChange("");
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    // If no search term, show all options
    if (!searchTerm) {
      setSearchTerm("");
    }
  };

  const handleOptionSelect = (option: AutocompleteOption) => {
    setSelectedOption(option);
    setSearchTerm(option.name);
    setIsOpen(false);
    onValueChange(option.id);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions.length === 1) {
        handleOptionSelect(filteredOptions[0]);
      }
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
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
      
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {filteredOptions.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              {searchTerm ? "No se encontraron resultados" : "No hay opciones disponibles"}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.id}
                className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
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