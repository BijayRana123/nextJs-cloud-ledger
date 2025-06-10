import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

/**
 * AccountAutocompleteInput
 * Props:
 * - accountOptions: array of full account paths (e.g., ["assets:Cash", ...])
 * - value: the full path of the selected account (e.g., "assets:Cash")
 * - onChange: function(fullPathOrNull) called when selection changes
 * - placeholder: input placeholder text
 * - required: boolean
 * - disabled: boolean
 */
export default function AccountAutocompleteInput({
  accountOptions = [],
  value,
  onChange,
  placeholder = "Select or type account",
  required = false,
  disabled = false,
  style = {},
  className = "",
}) {
  // Map full path to label and vice versa
  const accountLabelMap = {};
  const labelToPathMap = {};
  accountOptions.forEach((full) => {
    const label = full.split(":").slice(1).join(":") || full.split(":")[0];
    accountLabelMap[full] = label;
    labelToPathMap[label] = full;
  });

  // Show label in input, but store full path
  const [inputValue, setInputValue] = useState(value ? accountLabelMap[value] || "" : "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const inputRef = useRef(null);

  // Keep inputValue in sync with value prop
  useEffect(() => {
    setInputValue(value ? accountLabelMap[value] || "" : "");
  }, [value, accountOptions]);

  // Filter suggestions as user types
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setShowSuggestions(true);
    const filtered = Object.values(accountLabelMap).filter((label) =>
      label.toLowerCase().includes(val.toLowerCase())
    );
    setFilteredSuggestions(filtered);
    // If the input matches a label exactly, call onChange with the full path
    if (labelToPathMap[val]) {
      onChange(labelToPathMap[val]);
    } else {
      onChange(null);
    }
  };

  // When a suggestion is clicked
  const handleSuggestionClick = (label) => {
    setInputValue(label);
    setShowSuggestions(false);
    onChange(labelToPathMap[label]);
  };

  // Hide suggestions on blur (with a slight delay to allow click)
  const handleInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 100);
  };

  return (
    <div style={{ position: "relative", ...style }} className={className}>
      <Input
        ref={inputRef}
        value={inputValue}
        placeholder={placeholder}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        onBlur={handleInputBlur}
        autoComplete="off"
        required={required}
        disabled={disabled}
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div style={{
          position: "absolute",
          zIndex: 10,
          background: "white",
          border: "1px solid #ccc",
          width: "100%",
          maxHeight: "150px",
          overflowY: "auto"
        }}>
          {filteredSuggestions.map((label) => (
            <div
              key={label}
              style={{ padding: "8px", cursor: "pointer" }}
              onMouseDown={() => handleSuggestionClick(label)}
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 