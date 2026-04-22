"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode
} from "react";
import { cn } from "../lib/cn";

export type ComboboxOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type ComboboxProps<Option extends ComboboxOption> = {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  onSelect: (option: Option) => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  alwaysOpen?: boolean;
  className?: string;
  inputClassName?: string;
  listClassName?: string;
  summary?: ReactNode;
  status?: ReactNode;
  loading?: boolean;
  loadingState?: ReactNode;
  emptyState?: ReactNode;
  leadingIcon?: ReactNode;
  renderOption?: (option: Option, state: { active: boolean }) => ReactNode;
};

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function Combobox<Option extends ComboboxOption>({
  value,
  onValueChange,
  options,
  onSelect,
  placeholder = "Buscar…",
  ariaLabel,
  disabled = false,
  alwaysOpen = false,
  className,
  inputClassName,
  listClassName,
  summary,
  status,
  loading = false,
  loadingState,
  emptyState,
  leadingIcon,
  renderOption
}: ComboboxProps<Option>) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(alwaysOpen);
  const [activeIndex, setActiveIndex] = useState(0);
  const enabledOptions = options.filter((option) => !option.disabled);
  const shouldShowList = alwaysOpen || isOpen;
  const activeOption = enabledOptions[activeIndex] ?? enabledOptions[0] ?? null;

  useEffect(() => {
    if (alwaysOpen) {
      setIsOpen(true);
    }
  }, [alwaysOpen]);

  useEffect(() => {
    setActiveIndex((current) => {
      if (!enabledOptions.length) {
        return 0;
      }

      return Math.min(current, enabledOptions.length - 1);
    });
  }, [enabledOptions.length]);

  useEffect(() => {
    setActiveIndex(0);
  }, [value]);

  useEffect(() => {
    if (alwaysOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [alwaysOpen]);

  function handleSelect(option: Option) {
    if (option.disabled) {
      return;
    }

    onSelect(option);
    setActiveIndex(Math.max(enabledOptions.findIndex((candidate) => candidate.value === option.value), 0));

    if (!alwaysOpen) {
      setIsOpen(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (disabled) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      if (!enabledOptions.length) {
        return;
      }

      setActiveIndex((current) => (current + 1) % enabledOptions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      if (!enabledOptions.length) {
        return;
      }

      setActiveIndex((current) => (current - 1 + enabledOptions.length) % enabledOptions.length);
      return;
    }

    if (event.key === "Enter" && shouldShowList && activeOption) {
      event.preventDefault();
      handleSelect(activeOption);
      return;
    }

    if (event.key === "Escape" && !alwaysOpen) {
      setIsOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("space-y-2", className)}>
      {summary}

      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6f8679]">
          {leadingIcon ?? <SearchIcon />}
        </span>
        <input
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={`${id}-listbox`}
          aria-expanded={shouldShowList}
          aria-activedescendant={activeOption ? `${id}-option-${activeOption.value}` : undefined}
          aria-label={ariaLabel}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => {
            if (!alwaysOpen) {
              setIsOpen(true);
            }
            onValueChange(event.target.value);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full rounded-[10px] border border-black/10 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#52b788] focus:ring-2 focus:ring-[#52b788]/15 disabled:cursor-not-allowed disabled:bg-black/5",
            inputClassName
          )}
        />
      </div>

      {status}

      {shouldShowList ? (
        <div
          id={`${id}-listbox`}
          role="listbox"
          className={cn(
            "max-h-56 overflow-y-auto rounded-[12px] border border-black/8 bg-white p-2 pr-1",
            listClassName
          )}
        >
          {loading ? (
            loadingState ?? (
              <p className="rounded-[10px] border border-dashed border-black/10 bg-white px-3 py-3 text-xs text-black/45">
                Cargando opciones...
              </p>
            )
          ) : null}

          {!loading && !options.length ? (
            emptyState ?? (
              <p className="rounded-[10px] border border-dashed border-black/10 bg-white px-3 py-3 text-xs text-black/45">
                No encontramos coincidencias para esa búsqueda.
              </p>
            )
          ) : null}

          {!loading && options.length ? (
            <div className="space-y-1.5">
              {options.map((option) => {
                const enabledIndex = enabledOptions.findIndex((candidate) => candidate.value === option.value);
                const isActive = enabledIndex >= 0 && enabledIndex === activeIndex;

                return (
                  <button
                    key={option.value}
                    id={`${id}-option-${option.value}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    disabled={option.disabled}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => {
                      if (enabledIndex >= 0) {
                        setActiveIndex(enabledIndex);
                      }
                    }}
                    onClick={() => handleSelect(option)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-[10px] border border-black/10 px-3 py-2.5 text-left text-sm transition",
                      option.disabled
                        ? "cursor-not-allowed bg-black/[0.02] text-black/35"
                        : isActive
                          ? "border-[#52b788] bg-[#f0faf4]"
                          : "bg-white hover:border-[#52b788] hover:bg-[#f0faf4]"
                    )}
                  >
                    {renderOption ? (
                      renderOption(option, { active: isActive })
                    ) : (
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-[#132016]">{option.label}</div>
                        {option.description ? (
                          <div className="mt-0.5 text-xs text-black/45">{option.description}</div>
                        ) : null}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
