import {
  ButtonItem,
  DialogButton,
  DropdownItem,
  Field,
  Focusable,
  PanelSection,
  PanelSectionRow,
  TextField,
  Navigation,
  gamepadDialogClasses,
  joinClassNames,
} from "@decky/ui";
import { toaster } from "@decky/api";
import { Fragment, useEffect, useRef, useState } from "react";

import {
  Module,
  MemoryBlock,
  TableEntry,
  Value,
  TYPE_WIDTHS,
  WORKBENCH_TYPES,
  Process,
  getAttachedProcess,
  getModules,
  getFrozen,
  loadTable,
  saveTable,
  deleteTable,
  hasSavedTable,
  readValues,
  readMemory,
  writeAddress,
  freezeValue,
  unfreezeValue,
  resolveModuleOffset,
  newId,
  formatValue,
  staticModule,
} from "../api";

const Row = joinClassNames(
  gamepadDialogClasses.Field,
  gamepadDialogClasses.WithBottomSeparatorStandard
);

const typeOptions = WORKBENCH_TYPES.map((t) => ({ data: t, label: t }));

// One row of the hex dump: "offset:  xx xx ..   ascii"
function hexRow(start: number, bytes: number[], rowIndex: number): string {
  const off = start + rowIndex * 16;
  const slice = bytes.slice(rowIndex * 16, rowIndex * 16 + 16);
  const hex = slice.map((b) => b.toString(16).padStart(2, "0")).join(" ").padEnd(47, " ");
  const ascii = slice.map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : ".")).join("");
  return `0x${off.toString(16).padStart(8, "0")}  ${hex}  ${ascii}`;
}

export function Workbench() {
  const [attached, setAttached] = useState<Process | null>(null);
  const [entries, setEntries] = useState<TableEntry[]>([]);
  const [values, setValues] = useState<Record<string, Value>>({});
  const [frozen, setFrozen] = useState<Set<string>>(new Set());
  const [modules, setModules] = useState<Module[]>([]);
  const [maps, setMaps] = useState<[number, number, string][]>([]);
  const [savedExists, setSavedExists] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});

  // Add-entry form
  const [addLabel, setAddLabel] = useState("");
  const [addMode, setAddMode] = useState<"abs" | "mod">("abs");
  const [addAddress, setAddAddress] = useState("");
  const [addModule, setAddModule] = useState("");
  const [addOffset, setAddOffset] = useState("");
  const [addType, setAddType] = useState("int32");

  // Hex viewer
  const [hexAddr, setHexAddr] = useState("");
  const [hexLen, setHexLen] = useState("128");
  const [hexBlock, setHexBlock] = useState<MemoryBlock | null>(null);

  const busyRef = useRef(false);

  const refreshFrozen = async () => {
    try {
      const fr = await getFrozen();
      setFrozen(new Set(fr.map((f) => f.address)));
    } catch (e) {
      console.error("memory-editor: getFrozen failed", e);
    }
  };

  // Load everything on mount
  useEffect(() => {
    (async () => {
      try {
        setAttached(await getAttachedProcess());
      } catch {
        /* ignore */
      }
      try {
        const mods = await getModules();
        setModules(mods.modules);
        setMaps(mods.maps);
        if (mods.modules.length) setAddModule(mods.modules[0].name);
      } catch (e) {
        console.error("memory-editor: getModules failed", e);
      }
      try {
        const tbl = await loadTable();
        setEntries(tbl.map((e) => ({ ...e, id: newId() })));
        setSavedExists(await hasSavedTable());
      } catch (e) {
        console.error("memory-editor: loadTable failed", e);
      }
      refreshFrozen();
    })();
  }, []);

  // Live value refresh while there are entries
  const addrKey = entries.map((e) => e.address).join(",");
  useEffect(() => {
    if (!entries.length) return;
    const items = entries.map((e) => ({
      address: e.address,
      value_type: e.value_type,
      number_of_bytes: TYPE_WIDTHS[e.value_type] || 0,
    }));
    let cancelled = false;
    const id = setInterval(async () => {
      if (busyRef.current) return;
      try {
        const live = await readValues(items);
        if (!cancelled) setValues((v) => ({ ...v, ...live }));
      } catch {
        /* transient — next tick retries */
      }
    }, 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addrKey]);

  const toStored = (list: TableEntry[]) =>
    list.map(({ id, ...rest }) => rest); // drop runtime id

  const persist = async (list: TableEntry[]) => {
    try {
      await saveTable(toStored(list));
      setSavedExists(true);
      toaster.toast({ title: "MemoryEditor", body: "Table saved." });
    } catch (e) {
      console.error("memory-editor: saveTable failed", e);
      toaster.toast({ title: "MemoryEditor", body: "Failed to save table." });
    }
  };

  const addEntry = async () => {
    let address = addAddress.trim();
    let module: string | null = null;
    let offset: string | null = null;

    if (addMode === "mod") {
      if (!addModule) return;
      try {
        const resolved = await resolveModuleOffset(addModule, addOffset || "0");
        if (!resolved) {
          toaster.toast({ title: "MemoryEditor", body: "Could not resolve module + offset." });
          return;
        }
        address = resolved;
        module = addModule;
        offset = addOffset || "0";
      } catch (e) {
        console.error("memory-editor: resolve failed", e);
        return;
      }
    }

    if (!/^0x[0-9a-fA-F]+$/.test(address)) {
      toaster.toast({ title: "MemoryEditor", body: "Enter a valid address like 0x1a2b3c." });
      return;
    }

    setEntries((prev) => [
      ...prev,
      {
        id: newId(),
        label: addLabel.trim() || address,
        address,
        value_type: addType,
        module,
        offset,
      },
    ]);
    setAddLabel("");
    setAddAddress("");
    setAddOffset("");
  };

  const removeEntry = (id: string) =>
    setEntries((prev) => prev.filter((e) => e.id !== id));

  const applyEdit = async (entry: TableEntry) => {
    const value = edits[entry.id];
    if (value === undefined || value === "") return;
    busyRef.current = true;
    try {
      const ok = await writeAddress(entry.address, value, entry.value_type);
      if (!ok) {
        toaster.toast({ title: "MemoryEditor", body: "Failed to write value." });
      } else {
        // keep a frozen entry pinned at the new value
        if (frozen.has(entry.address)) {
          await freezeValue(entry.address, value, entry.value_type).catch(() => {});
        }
        const num = parseFloat(value);
        setValues((v) => ({ ...v, [entry.address]: isNaN(num) ? v[entry.address] : num }));
      }
    } catch (e) {
      console.error("memory-editor: write failed", e);
      toaster.toast({ title: "MemoryEditor", body: "Failed to write value." });
    }
    busyRef.current = false;
  };

  const toggleFreeze = async (entry: TableEntry) => {
    try {
      if (frozen.has(entry.address)) {
        await unfreezeValue(entry.address);
      } else {
        const current = values[entry.address];
        if (current === null || current === undefined) {
          toaster.toast({ title: "MemoryEditor", body: "No current value to freeze yet." });
          return;
        }
        const ok = await freezeValue(entry.address, String(current), entry.value_type);
        if (!ok) {
          toaster.toast({ title: "MemoryEditor", body: "Can't freeze this type." });
          return;
        }
      }
      await refreshFrozen();
    } catch (e) {
      console.error("memory-editor: toggle freeze failed", e);
    }
  };

  const readHex = async (addr?: string) => {
    const target = (addr ?? hexAddr).trim();
    if (!/^0x[0-9a-fA-F]+$/.test(target)) {
      toaster.toast({ title: "MemoryEditor", body: "Enter a valid address like 0x1a2b3c." });
      return;
    }
    setHexAddr(target);
    try {
      const len = Math.max(16, Math.min(parseInt(hexLen, 10) || 128, 4096));
      const block = await readMemory(target, len);
      setHexBlock(block);
      if (!block) {
        toaster.toast({ title: "MemoryEditor", body: "Could not read that memory." });
      }
    } catch (e) {
      console.error("memory-editor: readMemory failed", e);
    }
  };

  if (!attached) {
    return (
      <div style={{ margin: "40px", color: "white" }}>
        <h1>MemoryEditor — Workbench</h1>
        <p>No process attached. Open the MemoryEditor Quick Access panel and attach to a game first.</p>
        <DialogButton onClick={() => Navigation.NavigateBack()}>Back</DialogButton>
      </div>
    );
  }

  const rows = hexBlock ? Math.ceil(hexBlock.bytes.length / 16) : 0;

  return (
    <div style={{ margin: "40px", marginBottom: "80px", color: "white" }}>
      <Focusable style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0 }}>MemoryEditor — Workbench</h1>
          <div style={{ opacity: 0.7 }}>
            {attached.name} (pid {attached.pid}
            {attached.app_id ? `, app ${attached.app_id}` : ""})
          </div>
        </div>
        <DialogButton style={{ width: "120px" }} onClick={() => Navigation.NavigateBack()}>
          Back
        </DialogButton>
      </Focusable>

      <PanelSection title="Cheat Table">
        <Focusable style={{ display: "flex", gap: "0.5rem" }}>
          <DialogButton onClick={() => persist(entries)}>Save Table</DialogButton>
          <DialogButton
            onClick={async () => {
              const tbl = await loadTable().catch(() => []);
              setEntries(tbl.map((e) => ({ ...e, id: newId() })));
            }}
            disabled={!savedExists}
          >
            Reload Saved
          </DialogButton>
          <DialogButton onClick={() => setEntries([])}>Clear List</DialogButton>
          <DialogButton
            disabled={!savedExists}
            onClick={async () => {
              await deleteTable().catch(() => {});
              setSavedExists(false);
              toaster.toast({ title: "MemoryEditor", body: "Saved table deleted." });
            }}
          >
            Delete Saved
          </DialogButton>
        </Focusable>
      </PanelSection>

      <PanelSection title={`Addresses (${entries.length})`}>
        {entries.length === 0 && (
          <PanelSectionRow>
            <div style={{ opacity: 0.7 }}>
              No addresses yet. Add one below, or use "Add to Workbench" from a search result.
            </div>
          </PanelSectionRow>
        )}

        {entries.map((entry) => {
          const mod = staticModule(entry.address, maps);
          const isFrozen = frozen.has(entry.address);
          return (
            <Fragment key={entry.id}>
              <div className={Row}>
                <div className={gamepadDialogClasses.FieldLabelRow}>
                  <div className={gamepadDialogClasses.FieldLabel} style={{ wordBreak: "break-all" }}>
                    {isFrozen ? "🔒 " : ""}
                    {entry.label}
                    <div style={{ fontSize: "0.8em", opacity: 0.7 }}>
                      {entry.address} · {entry.value_type}
                      {entry.module ? ` · ${entry.module}+${entry.offset}` : mod ? ` · ${mod}` : ""}
                    </div>
                  </div>
                  <div
                    className={gamepadDialogClasses.FieldChildrenInner}
                    style={{ textAlign: "end", wordBreak: "break-all" }}
                  >
                    {formatValue(values[entry.address] ?? null, entry.value_type)}
                  </div>
                </div>
              </div>
              <Focusable style={{ display: "flex", gap: "0.5rem", padding: "4px 0" }}>
                <div style={{ flex: 2 }}>
                  <TextField
                    label="New value"
                    value={edits[entry.id] ?? ""}
                    onChange={(e) => setEdits((s) => ({ ...s, [entry.id]: e.target.value }))}
                  />
                </div>
                <DialogButton style={{ flex: 1 }} onClick={() => applyEdit(entry)}>
                  Set
                </DialogButton>
                <DialogButton style={{ flex: 1 }} onClick={() => toggleFreeze(entry)}>
                  {isFrozen ? "Unfreeze" : "Freeze"}
                </DialogButton>
                <DialogButton style={{ flex: 1 }} onClick={() => readHex(entry.address)}>
                  Hex
                </DialogButton>
                <DialogButton style={{ flex: 1 }} onClick={() => removeEntry(entry.id)}>
                  Remove
                </DialogButton>
              </Focusable>
            </Fragment>
          );
        })}
      </PanelSection>

      <PanelSection title="Add Address">
        <PanelSectionRow>
          <TextField label="Label" value={addLabel} onChange={(e) => setAddLabel(e.target.value)} />
        </PanelSectionRow>
        <DropdownItem
          label="Entry Type"
          rgOptions={[
            { data: "abs", label: "Absolute address" },
            { data: "mod", label: "Module + offset" },
          ]}
          selectedOption={addMode}
          onChange={(o) => setAddMode(o.data as "abs" | "mod")}
        />
        {addMode === "abs" ? (
          <PanelSectionRow>
            <TextField
              label="Address (0x…)"
              value={addAddress}
              onChange={(e) => setAddAddress(e.target.value)}
            />
          </PanelSectionRow>
        ) : (
          <>
            <DropdownItem
              label="Module"
              rgOptions={modules.map((m) => ({ data: m.name, label: m.name }))}
              selectedOption={addModule}
              onChange={(o) => setAddModule(o.data as string)}
            />
            <PanelSectionRow>
              <TextField
                label="Offset (0x…)"
                value={addOffset}
                onChange={(e) => setAddOffset(e.target.value)}
              />
            </PanelSectionRow>
          </>
        )}
        <DropdownItem
          label="Value Type"
          rgOptions={typeOptions}
          selectedOption={addType}
          onChange={(o) => setAddType(o.data as string)}
        />
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => addEntry()}>
            Add to List
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Memory Viewer">
        <Focusable style={{ display: "flex", gap: "0.5rem", alignItems: "end" }}>
          <div style={{ flex: 3 }}>
            <TextField
              label="Address (0x…)"
              value={hexAddr}
              onChange={(e) => setHexAddr(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <TextField label="Bytes" value={hexLen} onChange={(e) => setHexLen(e.target.value)} />
          </div>
          <DialogButton style={{ flex: 1 }} onClick={() => readHex()}>
            Read
          </DialogButton>
        </Focusable>
        {hexBlock && (
          <pre
            style={{
              fontFamily: "monospace",
              fontSize: "0.85em",
              whiteSpace: "pre",
              overflowX: "auto",
              background: "rgba(0,0,0,0.3)",
              padding: "8px",
              marginTop: "8px",
            }}
          >
            {Array.from({ length: rows }, (_, r) => hexRow(hexBlock.start, hexBlock.bytes, r)).join("\n")}
          </pre>
        )}
      </PanelSection>

      <Field label="" />
    </div>
  );
}
