import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SearchPanel from "./SearchPanel";
import type { ArrAppWithKey, SearchFilters } from "../api/types";

const app: ArrAppWithKey = {
  id: "1",
  name: "Sonarr",
  type: "sonarr",
  url: "http://localhost:8989",
  apiKey: "abc12345",
  icon: "",
};

const filters: SearchFilters = {
  year: null,
  genres: [],
  network: null,
  language: null,
};

const baseProps = {
  apps: [app],
  selectedApp: app,
  disabledAppIds: new Set<string>(),
  onSelectApp: vi.fn(),
  query: "",
  onQueryChange: vi.fn(),
  allResults: [],
  filteredResults: [],
  filters,
  filterOptions: {
    years: [],
    genres: [],
    networks: [],
    languages: [],
  },
  onFiltersChange: vi.fn(),
  loading: false,
  error: null,
  existingItemsError: null,
  addedIds: new Set<number>(),
  onResultClick: vi.fn(),
  onAddAppClick: vi.fn(),
  isSyncing: false,
};

describe("SearchPanel", () => {
  it("shows syncing banner when syncing", () => {
    render(<SearchPanel {...baseProps} isSyncing={true} />);
    expect(screen.getByText(/syncing library/i)).toBeInTheDocument();
  });

  it("hides syncing banner when not syncing", () => {
    render(<SearchPanel {...baseProps} />);
    expect(screen.queryByText(/syncing library/i)).toBeNull();
  });

  it("shows existing items error when provided", () => {
    render(
      <SearchPanel
        {...baseProps}
        existingItemsError="Existing items sync failed"
      />,
    );

    expect(
      screen.getByText(/existing items sync failed/i),
    ).toBeInTheDocument();
  });

  it("shows setup banner when app access is required", () => {
    render(<SearchPanel {...baseProps} selectedApp={null} />);

    expect(
      screen.getByText(
        /finish setup in the setup tab to grant access to this app/i,
      ),
    ).toBeInTheDocument();
  });
});
