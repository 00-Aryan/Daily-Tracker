import { useState, useEffect, useRef } from 'react';

export default function ComboboxCreatable({
  items = [],
  value = null,
  onChange,
  onCreateNew,
  placeholder = 'Search or create...',
  loading = false,
  disabled = false,
  multiSelect = false,
}) {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [localError, setLocalError] = useState('');

  const selectedSingle = !multiSelect && value
    ? items.find((item) => item.id === value)
    : null;

  const selectedMulti = multiSelect && Array.isArray(value) ? value : [];

  const isBusy = loading || creating || disabled;

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  const trimmedQuery = query.trim();
  const exactMatch = trimmedQuery
    ? items.some((item) => item.name.toLowerCase() === trimmedQuery.toLowerCase())
    : false;

  const showCreateOption = trimmedQuery.length > 0 && !exactMatch;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        if (!multiSelect && selectedSingle) {
          setQuery('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [multiSelect, selectedSingle]);

  const handleSelect = (item) => {
    setLocalError('');
    if (multiSelect) {
      const exists = selectedMulti.some((s) => s.id === item.id);
      if (!exists) {
        onChange([...selectedMulti, { id: item.id, name: item.name }]);
      }
      setQuery('');
      inputRef.current?.focus();
    } else {
      onChange(item.id, item.name);
      setQuery('');
      setOpen(false);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setLocalError('');
    if (multiSelect) {
      onChange([]);
    } else {
      onChange(null, '');
    }
    setQuery('');
    setOpen(false);
  };

  const handleRemoveTag = (id) => {
    onChange(selectedMulti.filter((s) => s.id !== id));
  };

  const handleCreate = async () => {
    if (!trimmedQuery || !onCreateNew) return;
    setCreating(true);
    setLocalError('');
    try {
      await onCreateNew(trimmedQuery);
      setQuery('');
      if (!multiSelect) {
        setOpen(false);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      setLocalError(typeof detail === 'string' ? detail : 'Failed to create item');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const displayValue = !multiSelect && selectedSingle && !open ? selectedSingle.name : query;

  const hasSelection = multiSelect ? selectedMulti.length > 0 : Boolean(selectedSingle);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setLocalError('');
            if (!multiSelect && selectedSingle) {
              onChange(null, '');
            }
          }}
          onFocus={() => {
            if (!isBusy) {
              setOpen(true);
              if (!multiSelect && selectedSingle) {
                setQuery(selectedSingle.name);
              }
            }
          }}
          placeholder={placeholder}
          disabled={isBusy}
          className={`w-full border rounded-lg px-3 py-2 text-sm text-[#1C1917] placeholder:text-[#A8A29E] bg-white transition-all duration-150 focus:outline-none disabled:bg-stone-50 disabled:text-stone-400 ${
            hasSelection && !open
              ? 'border-[#F97316] ring-2 ring-[#F97316]/20'
              : 'border-[#E7E5E4] focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]'
          }`}
        />
        {(creating || loading) && (
          <span
            className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#E7E5E4] border-t-[#F97316] rounded-full animate-spin"
            aria-hidden="true"
          />
        )}
        {hasSelection && !isBusy && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#1C1917] w-5 h-5 flex items-center justify-center rounded"
            aria-label="Clear selection"
          >
            ×
          </button>
        )}
      </div>

      {multiSelect && selectedMulti.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedMulti.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFF7ED] text-[#F97316] border border-[#FED7AA]"
            >
              {item.name}
              <button
                type="button"
                onClick={() => handleRemoveTag(item.id)}
                className="hover:text-[#EA6C00] leading-none"
                aria-label={`Remove ${item.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {localError && (
        <p className="mt-1 text-xs text-red-600">{localError}</p>
      )}

      {open && !isBusy && (
        <ul className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-white border border-[#E7E5E4] rounded-lg shadow-lg py-1">
          {filteredItems.length === 0 && !showCreateOption && (
            <li className="px-3 py-2 text-sm text-[#A8A29E]">No matches</li>
          )}
          {filteredItems.map((item) => {
            const isSelected = multiSelect && selectedMulti.some((s) => s.id === item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(item)}
                  disabled={isSelected}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    isSelected
                      ? 'text-[#A8A29E] cursor-default'
                      : 'text-[#1C1917] hover:bg-[#FFF7ED]'
                  }`}
                >
                  {item.name}
                  {isSelected && <span className="text-[#A8A29E] ml-1">(added)</span>}
                </button>
              </li>
            );
          })}
          {showCreateOption && (
            <li className="border-t border-[#E7E5E4] mt-1 pt-1">
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="w-full text-left px-3 py-2 text-sm text-[#F97316] font-medium hover:bg-[#FFF7ED] transition-colors"
              >
                ➕ Create &apos;{trimmedQuery}&apos;
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
