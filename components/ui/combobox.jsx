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

export function Combobox({ options, value, onValueChange, placeholder = "Select item" }) {
  const [open, setOpen] = React.useState(false);
 
  
  // Create a ref to measure the width of the trigger button
  const triggerRef = React.useRef(null);
  const [width, setWidth] = React.useState(0);

  // Update width when the component mounts and when window resizes
  React.useEffect(() => {
    const updateWidth = () => {
      if (triggerRef.current) {
        setWidth(triggerRef.current.offsetWidth);
      }
    };

    // Initial width calculation
    updateWidth();

    // Add resize listener
    window.addEventListener('resize', updateWidth);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <Popover className="w-full" open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
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
        className="p-0" 
        style={{ width: `${width}px` }} // Set exact width to match trigger
        align="start"
        sideOffset={4}
      >
        <Command className="w-full">
          <CommandInput placeholder="Search item..." />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
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
              {/* Placeholder for "Add New" - needs proper implementation */}
              <CommandItem
                 key="add-new"
                 value="add-new"
                 onSelect={() => {
                   console.log("Add New clicked"); // Placeholder action
                   setOpen(false);
                   // TODO: Implement logic to add a new supplier (e.g., open a modal)
                 }}
              >
                 + Add New
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
