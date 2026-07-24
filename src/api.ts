// Shared backend bindings and types for MemoryEditor.
// All arguments are passed positionally to the Python plugin methods.

import { callable } from "@decky/api";

export type Value = number | string | null;

export interface Process {
  name: string;
  pid: number;
  app_id?: string | null;
}

export interface Result {
  match_index: number;
  first_byte_in_child: number;
  address: string;
  value: Value;
  value_type: string;
  match_info: number;
  number_of_bytes: number;
  variable_bytes: number[];
}

export interface FrozenEntry {
  address: string;
  value: string;
  value_type: string;
}

export interface Module {
  name: string;
  base: number;
}

export interface ModulesResult {
  modules: Module[];
  maps: [number, number, string][];
}

export interface MemoryBlock {
  address: string;
  start: number;
  bytes: number[];
}

export interface TableEntry {
  id: string;
  label: string;
  address: string;
  value_type: string;
  module?: string | null;
  offset?: string | null;
}

// Byte width per concrete numeric type (mirrors scanmem.py TYPE_WIDTHS)
export const TYPE_WIDTHS: Record<string, number> = {
  int8: 1, uint8: 1,
  int16: 2, uint16: 2,
  int32: 4, uint32: 4,
  int64: 8, uint64: 8,
  float32: 4, float64: 8,
};

// Concrete types the workbench can read/write/freeze
export const WORKBENCH_TYPES = [
  "int8", "uint8", "int16", "uint16", "int32", "uint32",
  "int64", "uint64", "float32", "float64",
];

// --- process / attach ---
export const getProcesses = callable<[], Process[]>("get_processes");
export const getRunningGame = callable<[], Process | null>("get_running_game");
export const getAttachedProcess = callable<[], Process | null>("get_attached_process");
export const attachToProcess = callable<[pid: number, name: string], boolean>("attach");
export const resetScanmem = callable<[], boolean>("reset_scanmem");

// --- scanning ---
export const searchRegions = callable<
  [match_type: number, searchValue: string, searchValueType: string, rangeEnd: string],
  number | false
>("search_regions");
export const searchString = callable<[searchValue: string], number | false>("search_string");
export const getMatches = callable<[], Result[]>("get_matches");
export const stopScan = callable<[], boolean>("stop_scan");

// --- values ---
export const readValues = callable<
  [items: { address: string; value_type: string; number_of_bytes: number }[]],
  Record<string, Value>
>("read_values");
export const setValueAt = callable<
  [address: string, match_index: number, value: string],
  boolean
>("set_value");
export const writeAddress = callable<
  [address: string, value: string, value_type: string],
  boolean
>("write_address");

// --- freezing ---
export const freezeValue = callable<
  [address: string, value: string, value_type: string],
  boolean
>("freeze");
export const unfreezeValue = callable<[address: string], boolean>("unfreeze");
export const getFrozen = callable<[], FrozenEntry[]>("get_frozen");

// --- workbench: modules, memory, tables ---
export const getModules = callable<[], ModulesResult>("get_modules");
export const resolveModuleOffset = callable<
  [module: string, offset: string],
  string | null
>("resolve_module_offset");
export const readMemory = callable<
  [address: string, length: number],
  MemoryBlock | null
>("read_memory");
export const saveTable = callable<[entries: Omit<TableEntry, "id">[]], boolean>("save_table");
export const loadTable = callable<[], Omit<TableEntry, "id">[]>("load_table");
export const addTableEntry = callable<[entry: Omit<TableEntry, "id">], boolean>("add_table_entry");
export const hasSavedTable = callable<[], boolean>("has_saved_table");
export const deleteTable = callable<[], boolean>("delete_table");

// --- small shared helpers ---

let _idCounter = 0;
export const newId = (): string => `e${Date.now().toString(36)}_${_idCounter++}`;

// Trim float display noise (0.10000000149011612 -> 0.1)
export const formatValue = (value: Value, value_type: string): string => {
  if (value === null || value === undefined) return "?";
  if (typeof value === "string") return value;
  if (value_type === "float32") return String(Number(value.toPrecision(7)));
  if (value_type === "float64") return String(Number(value.toPrecision(15)));
  return String(value);
};

// Name of the loaded module a static address falls inside, or null
export const staticModule = (
  address: string,
  maps: [number, number, string][]
): string | null => {
  const addr = parseInt(address, 16);
  if (isNaN(addr)) return null;
  for (const [start, end, name] of maps) {
    if (addr >= start && addr < end) return name;
  }
  return null;
};
