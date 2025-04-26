"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// This is a basic combobox component based on shadcn/ui's example.
// It will need to be adapted to fetch and filter supplier data,
// and handle the "Add New" functionality.

export function Combobox({ options, value, onValueChange, placeholder = "Select item", onAddNew }) { // Added onAddNew prop
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  
  // Filter options based on search query (case-insensitive)
  const filteredOptions = React.useMemo(() => {
    if (!Array.isArray(options)) return [];
    
    if (!inputValue) return options;
    
    return options.filter(option => 
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [options, inputValue]);
  
  // Limit displayed options to maximum 4
  const displayedOptions = React.useMemo(() => {
    return filteredOptions.slice(0, 4);
  }, [filteredOptions]);
  
  // Debug the filtering
  React.useEffect(() => {
    console.log("Input value:", inputValue);
    console.log("Filtered options:", filteredOptions);
    console.log("Displayed options:", displayedOptions);
  }, [inputValue, filteredOptions, displayedOptions]);
  
  return (
    <Popover className="w-full" open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
            
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={4}
      >
        <Command className="w-full" shouldFilter={false}>
          <CommandInput 
            placeholder="Search item..." 
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {displayedOptions.length === 0 && inputValue !== "" ? (
              <CommandEmpty>No item found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {/* Display maximum 4 filtered options */}
                {displayedOptions.map((option) => (
                  <CommandItem
                    key={option.value || `option-${Math.random()}`}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                      setInputValue(""); // Reset search query when an item is selected
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
                {/* Always show Add New option */}
                <CommandItem
                  key="add-new"
                  value="add-new"
                  onSelect={() => {
                    setOpen(false);
                    setInputValue(""); // Reset search query when Add New is selected
                    if (onAddNew) { // Call onAddNew if provided
                      onAddNew();
                    }
                  }}
                >
                  + Add New
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
