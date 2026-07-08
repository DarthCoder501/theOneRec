"use client";

import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { STARTER_QUERIES } from "@theonerec/shared";
import { searchAnimeTitles } from "@/lib/api";
import { Ship } from "lucide-react";

interface QueryInputProps {
  onSubmit: (query: string) => void;
  loading: boolean;
  disabled?: boolean;
}

export function QueryInput({ onSubmit, loading, disabled }: QueryInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    { mal_id: number; name: string }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const maxLength = 500;

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const titles = await searchAnimeTitles(query);
        setSuggestions(titles);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    onSubmit(trimmed);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      aria-labelledby="query-heading"
    >
      <div>
        <Label
          htmlFor="anime-query"
          id="query-heading"
          className="text-lg font-semibold text-treasure-gold"
        >
          What anime voyage are you seeking?
        </Label>
        <p className="mt-1 text-sm text-(--text-secondary)">
          Describe what you want ranging from genres to hidden gems!
        </p>
      </div>

      <div className="relative">
        <textarea
          id="anime-query"
          name="query"
          value={query}
          onChange={(e) => setQuery(e.target.value.slice(0, maxLength))}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="e.g. recommend action anime from the 90s similar to Cowboy Bebop"
          rows={4}
          disabled={loading || disabled}
          aria-describedby="query-hint char-count"
          aria-autocomplete="list"
          aria-controls={suggestions.length ? "query-suggestions" : undefined}
          className="w-full rounded-xl border border-(--glass-border) bg-(--deep-sea-light) py-3 text-(--text-primary) placeholder:text-(--text-secondary) focus:border-treasure-gold min-h-[120px]"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul
            id="query-suggestions"
            role="listbox"
            className="absolute z-10 mt-1 w-full rounded-xl border border-(--glass-border) bg-(--deep-sea-light) shadow-lg max-h-48 overflow-y-auto"
          >
            {suggestions.map((s) => (
              <li key={s.mal_id} role="option">
                <button
                  type="button"
                  className="w-full text-left px-4 py-3 text-sm hover:bg-(--glass) min-h-[44px]"
                  onMouseDown={() => {
                    setQuery(s.name);
                    setShowSuggestions(false);
                  }}
                >
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p id="query-hint" className="text-xs text-(--text-secondary)">
          Minimum 2 characters required
        </p>
        <p
          id="char-count"
          className="text-xs text-(--text-secondary)"
          aria-live="polite"
        >
          {query.length}/{maxLength}
        </p>
      </div>

      <div role="group" aria-label="Example queries">
        <p className="text-xs text-(--text-secondary) mb-2">
          Try these voyages:
        </p>
        <div className="flex flex-wrap gap-2">
          {STARTER_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuery(q)}
              disabled={loading || disabled}
              className="rounded-full border border-(--glass-border) bg-(--glass) px-4 py-2 text-xs text-(--text-secondary) hover:text-treasure-gold hover:border-treasure-gold min-h-[44px] transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        variant="default"
        size="lg"
        disabled={loading || disabled || query.trim().length < 2}
        className="w-full sm:w-auto"
        aria-busy={loading}
      >
        <Ship className="h-5 w-5" aria-hidden="true" />
        {loading ? "Navigating the Grand Line..." : "Set Sail"}
      </Button>
    </form>
  );
}
