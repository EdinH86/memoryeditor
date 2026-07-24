import {
  ButtonItem,
  PanelSection,
  PanelSectionRow,
  DropdownItem,
  TextField,
  ProgressBarWithInfo,
  Navigation,
  staticClasses,
  gamepadDialogClasses,
  joinClassNames,
} from "@decky/ui";

import {
  addEventListener,
  removeEventListener,
  routerHook,
  definePlugin,
  toaster,
} from "@decky/api";

import { Fragment, useEffect, useRef, useState, ReactNode } from "react";

import { FaMagic } from "react-icons/fa";

import { NumpadInput } from "./components/NumpadInput";
import { Workbench } from "./workbench/Workbench";
import { playSound } from "./util/util";
import {
  Process,
  Result,
  Value,
  FrozenEntry,
  formatValue,
  getProcesses,
  getRunningGame,
  getAttachedProcess,
  attachToProcess,
  resetScanmem,
  searchRegions,
  searchString,
  getMatches,
  readValues,
  setValueAt,
  stopScan,
  freezeValue,
  unfreezeValue,
  getFrozen,
  addTableEntry,
} from "./api";

const WORKBENCH_ROUTE = "/memoryeditor/workbench";

interface UndoEntry {
  address: string;
  match_index: number;
  value_type: string;
  oldValue: Value;
}

const FieldWithSeparator = joinClassNames(
  gamepadDialogClasses.Field,
  gamepadDialogClasses.WithBottomSeparatorStandard
);

// scanroutines.h: scan_match_type_t
const MATCH_RANGE = 5;
const MatchTypes = [
  { value: 1, label: "==" },
  { value: 2, label: "!=" },
  { value: 3, label: ">" },
  { value: 4, label: "<" },
  { value: MATCH_RANGE, label: "Range" },
  // { value: 6, label: "Update" }, -- Not Supported
  { value: 7, label: "Not Changed" },
  { value: 8, label: "Changed" },
  { value: 9, label: "Increased" },
  { value: 10, label: "Decreased" },
  { value: 11, label: "Increased By" },
  { value: 12, label: "Decreased By" },
  { value: 0, label: "Any" }, // Not overly useful, so it's last
];

const STRING_TYPE = "string";
const SearchValueTypes = [
  { value: "auto", label: "auto" },
  { value: "c_int8", label: "int8" },
  { value: "c_uint8", label: "uint8" },
  { value: "c_int16", label: "int16" },
  { value: "c_uint16", label: "uint16" },
  { value: "c_int32", label: "int32" },
  { value: "c_uint32", label: "uint32" },
  { value: "c_float", label: "float32" },
  { value: "c_double", label: "float64" },
  { value: "c_int64", label: "int64" },
  { value: "c_uint64", label: "uint64" },
  { value: STRING_TYPE, label: "string" },
];

// Match index sent to the backend to mean "change every match"
const CHANGE_ALL = 999;
// Show the results / change UI once the match count is this low
const RESULTS_LIMIT = 10;
// How often to re-read live values while results are visible (ms)
const REFRESH_INTERVAL = 1200;
// Cap on the undo history
const UNDO_LIMIT = 20;

function Content() {
  const [processList, setProcessList] = useState<Process[]>([]);
  const [searchValue, setSearchValue] = useState<string>("0");
  const [rangeEnd, setRangeEnd] = useState<string>("0");
  const [searchValueType, setSearchValueType] = useState<string>("auto");
  const [selectedMode, setSelectedMode] = useState<number>(1);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [numberOfMatches, setNumberOfMatches] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [newValue, setNewValue] = useState<string>("0");
  const [results, setResults] = useState<Result[]>([]);
  const [detectedGame, setDetectedGame] = useState<Process | null>(null);
  const [frozenList, setFrozenList] = useState<FrozenEntry[]>([]);
  const [undoStack, setUndoStack] = useState<UndoEntry[][]>([]);

  // Ref mirror of `loading` so the refresh interval can skip mid-edit ticks
  // without having to re-subscribe every time loading flips.
  const loadingRef = useRef(false);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const isStringSearch = searchValueType === STRING_TYPE;
  const isRangeSearch = selectedMode === MATCH_RANGE && !isStringSearch;
  const frozenAddrs = new Set(frozenList.map((f) => f.address));

  const syncFrozen = async () => {
    try {
      setFrozenList(await getFrozen());
    } catch (e) {
      console.error("memory-editor: get_frozen failed", e);
    }
  };

  // When selectedProcess is updated, attach to it on the backend.
  // Attaching to a new process resets the scan and drops frozen values;
  // re-attaching to the same one (e.g. after a frontend reload) keeps them,
  // so sync the freeze state from the backend once the attach settles.
  useEffect(() => {
    setNumberOfMatches(0);
    setResults([]);
    setUndoStack([]);
    setFrozenList([]);

    if (selectedProcess) {
      attachToProcess(selectedProcess.pid, selectedProcess.name)
        .then(() => syncFrozen())
        .catch((e) => console.error("memory-editor: attach failed", e));
    }
  }, [selectedProcess]);

  const loadProcessList = async () => {
    try {
      const [list, game] = await Promise.all([getProcesses(), getRunningGame()]);
      setProcessList(list);
      setDetectedGame(game);
    } catch (e) {
      console.error("memory-editor: get_processes failed", e);
      toaster.toast({ title: "MemoryEditor", body: "Failed to load process list." });
    }
  };

  const loadExistingProcess = async () => {
    try {
      const process = await getAttachedProcess();
      if (process) {
        setSelectedProcess(process);
        return;
      }
      // Nothing attached yet — try to detect the running game
      setDetectedGame(await getRunningGame());
    } catch (e) {
      console.error("memory-editor: process detection failed", e);
    }
  };

  const loadResults = async () => {
    const matches = await getMatches();
    setNumberOfMatches(matches.length);
    setResults(matches);
  };

  const search = async () => {
    setScanProgress(0);
    setScanning(true);
    setUndoStack([]);
    try {
      const matches = isStringSearch
        ? await searchString(searchValue)
        : await searchRegions(selectedMode, searchValue, searchValueType, rangeEnd);

      if (matches === false) {
        toaster.toast({
          title: "MemoryEditor",
          body: isStringSearch
            ? "String search failed (need an attached process and a value)."
            : `Could not parse "${searchValue}" as ${searchValueType}.`,
        });
      } else {
        setNumberOfMatches(matches);
        if (matches <= RESULTS_LIMIT) {
          await loadResults();
        } else {
          setResults([]);
        }
      }
    } catch (e) {
      console.error("memory-editor: search failed", e);
      toaster.toast({ title: "MemoryEditor", body: "Search failed, check the logs." });
    }
    setScanning(false);
  };

  const reset = async () => {
    try {
      await resetScanmem();
      setNumberOfMatches(0);
      setResults([]);
      setUndoStack([]);
    } catch (e) {
      console.error("memory-editor: reset failed", e);
    }
  };

  // Re-freeze any affected addresses at `value` so a frozen entry doesn't
  // immediately revert a change, and keep the panel's shown value in sync.
  const refreezeAffected = (isAffected: (r: Result) => boolean, value: string) => {
    const touched = results.filter((r) => isAffected(r) && frozenAddrs.has(r.address));
    for (const r of touched) {
      freezeValue(r.address, value, r.value_type).catch((e) =>
        console.error("memory-editor: refreeze failed", e)
      );
    }
    if (touched.length) {
      const addrs = new Set(touched.map((r) => r.address));
      setFrozenList((prev) =>
        prev.map((f) => (addrs.has(f.address) ? { ...f, value } : f))
      );
    }
  };

  const applyValue = async (address: string, match_index: number, value: string) => {
    const isAffected = (r: Result) =>
      match_index === CHANGE_ALL || r.match_index === match_index;

    const ok = await setValueAt(address, match_index, value);
    if (!ok) {
      toaster.toast({ title: "MemoryEditor", body: "Failed to set value." });
      return false;
    }

    refreezeAffected(isAffected, value);

    const parsed = parseFloat(value);
    setResults((prev) =>
      prev.map((r) =>
        isAffected(r) ? { ...r, value: isNaN(parsed) ? r.value : parsed } : r
      )
    );
    return true;
  };

  const setValue = async (address: string, match_index: number) => {
    playSound("https://steamloopback.host/sounds/deck_ui_default_activation.wav");
    setLoading(true);
    try {
      // Capture current values for undo before overwriting
      const captured: UndoEntry[] = results
        .filter((r) => match_index === CHANGE_ALL || r.match_index === match_index)
        .map((r) => ({
          address: r.address,
          match_index: r.match_index,
          value_type: r.value_type,
          oldValue: r.value,
        }));

      const ok = await applyValue(address, match_index, newValue);
      if (ok && captured.length) {
        setUndoStack((prev) => [...prev, captured].slice(-UNDO_LIMIT));
      }
    } catch (e) {
      console.error("memory-editor: set_value failed", e);
      toaster.toast({ title: "MemoryEditor", body: "Failed to set value." });
    }
    setLoading(false);
  };

  const undo = async () => {
    const op = undoStack[undoStack.length - 1];
    if (!op) return;
    setLoading(true);
    try {
      for (const entry of op) {
        if (entry.oldValue === null || typeof entry.oldValue === "string") {
          continue; // only numeric values can be rewritten
        }
        await applyValue(entry.address, entry.match_index, String(entry.oldValue));
      }
      setUndoStack((prev) => prev.slice(0, -1));
    } catch (e) {
      console.error("memory-editor: undo failed", e);
      toaster.toast({ title: "MemoryEditor", body: "Undo failed, check the logs." });
    }
    setLoading(false);
  };

  const toggleFreeze = async (result: Result) => {
    try {
      if (frozenAddrs.has(result.address)) {
        await unfreezeValue(result.address);
        setFrozenList((prev) => prev.filter((f) => f.address !== result.address));
      } else {
        if (result.value === null) {
          toaster.toast({ title: "MemoryEditor", body: "Can't freeze an unknown value." });
          return;
        }
        const value = String(result.value);
        const ok = await freezeValue(result.address, value, result.value_type);
        if (ok) {
          setFrozenList((prev) => [
            ...prev.filter((f) => f.address !== result.address),
            { address: result.address, value, value_type: result.value_type },
          ]);
        } else {
          toaster.toast({ title: "MemoryEditor", body: "Failed to freeze value." });
        }
      }
    } catch (e) {
      console.error("memory-editor: toggle freeze failed", e);
    }
  };

  const unfreezeAddress = async (address: string) => {
    try {
      await unfreezeValue(address);
      setFrozenList((prev) => prev.filter((f) => f.address !== address));
    } catch (e) {
      console.error("memory-editor: unfreeze failed", e);
    }
  };

  const addToWorkbench = async (result: Result) => {
    try {
      await addTableEntry({
        label: `${result.value_type} @ ${result.address}`,
        address: result.address,
        value_type: result.value_type,
        module: null,
        offset: null,
      });
      toaster.toast({ title: "MemoryEditor", body: "Added to workbench table." });
    } catch (e) {
      console.error("memory-editor: addTableEntry failed", e);
      toaster.toast({ title: "MemoryEditor", body: "Failed to add to workbench." });
    }
  };

  const openWorkbench = () => {
    Navigation.Navigate(WORKBENCH_ROUTE);
    Navigation.CloseSideMenus();
  };

  const showResults = numberOfMatches > 0 && numberOfMatches <= RESULTS_LIMIT && results.length > 0;
  // Re-subscribe the refresh loop only when the *set* of addresses changes,
  // not on every value tick, so the interval isn't constantly torn down.
  const resultAddrKey = results.map((r) => r.address).join(",");

  // Poll the backend for live values while results are visible
  useEffect(() => {
    if (!showResults || scanning) {
      return;
    }
    const items = results.map((r) => ({
      address: r.address,
      value_type: r.value_type,
      number_of_bytes: r.number_of_bytes,
    }));
    let cancelled = false;

    const id = setInterval(async () => {
      if (loadingRef.current) return;
      try {
        const live = await readValues(items);
        if (cancelled) return;
        setResults((prev) =>
          prev.map((r) => (r.address in live ? { ...r, value: live[r.address] } : r))
        );
      } catch {
        /* transient read failure — ignore, next tick retries */
      }
    }, REFRESH_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResults, scanning, resultAddrKey]);

  // On mount: load the process list and listen for backend events
  useEffect(() => {
    const progressListener = addEventListener<[progress: number]>(
      "scan_progress",
      (progress) => setScanProgress(progress)
    );

    // Backend drops a freeze after repeated write failures (e.g. game exited)
    const droppedListener = addEventListener<[address: string]>(
      "freeze_dropped",
      (address) => {
        setFrozenList((prev) => prev.filter((f) => f.address !== address));
        toaster.toast({
          title: "MemoryEditor",
          body: `Stopped freezing ${address} (write failed).`,
        });
      }
    );

    loadProcessList();
    loadExistingProcess();

    return () => {
      removeEventListener("scan_progress", progressListener);
      removeEventListener("freeze_dropped", droppedListener);
    };
  }, []);

  const ProcessSelection = (
    <PanelSection title="Process Selection">
      {detectedGame && (
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            bottomSeparator="thick"
            onClick={() => setSelectedProcess(detectedGame)}
          >
            🎮 Attach to {detectedGame.name} (detected game)
          </ButtonItem>
        </PanelSectionRow>
      )}
      <PanelSectionRow>
        <ButtonItem layout="below" onClick={() => loadProcessList()}>
          Reload Process List
        </ButtonItem>
      </PanelSectionRow>

      {processList.map((process) => (
        <PanelSectionRow key={process.pid}>
          <ButtonItem onClick={() => setSelectedProcess(process)} layout="below">
            {process.name}
          </ButtonItem>
        </PanelSectionRow>
      ))}
    </PanelSection>
  );

  const infoRow = (label: string, value: ReactNode) => (
    <PanelSectionRow>
      <div className={FieldWithSeparator}>
        <div className={gamepadDialogClasses.FieldLabelRow}>
          <div
            className={gamepadDialogClasses.FieldLabel}
            style={{ maxWidth: "40%", wordBreak: "break-all" }}
          >
            {label}
          </div>
          <div
            className={gamepadDialogClasses.FieldChildrenInner}
            style={{ maxWidth: "60%", width: "100%", wordBreak: "break-all", textAlign: "end" }}
          >
            {value}
          </div>
        </div>
      </div>
    </PanelSectionRow>
  );

  const ProcessInfo = (
    <PanelSection title="Process Info">
      {infoRow("Name", selectedProcess?.name)}
      {infoRow("PID", selectedProcess?.pid)}
      <PanelSectionRow>
        <ButtonItem layout="below" disabled={scanning} onClick={() => setSelectedProcess(null)}>
          Choose Another Process
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem layout="below" disabled={scanning} onClick={() => reset()}>
          Reset Search
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem layout="below" onClick={() => openWorkbench()}>
          Open Memory Workbench
        </ButtonItem>
      </PanelSectionRow>
    </PanelSection>
  );

  const Search = (
    <PanelSection title="Search">
      {isStringSearch ? (
        <PanelSectionRow>
          <TextField
            label="Search String"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </PanelSectionRow>
      ) : (
        <NumpadInput label="Search Value" value={searchValue} onChange={(v) => setSearchValue(v)} />
      )}

      {isRangeSearch && (
        <NumpadInput label="Range End" value={rangeEnd} onChange={(v) => setRangeEnd(v)} />
      )}

      <PanelSectionRow>
        <DropdownItem
          label="Value Type"
          description="What type of value to search."
          menuLabel="Value Type"
          rgOptions={SearchValueTypes.map((o) => ({
            data: o.value,
            label: o.label,
          }))}
          selectedOption={searchValueType}
          onChange={(newVal: { data: string; label: string }) => {
            setSearchValueType(newVal.data);
            reset();
          }}
        />
        {!isStringSearch && (
          <DropdownItem
            label="Search Type"
            description="What type of search to make."
            menuLabel="Search Type"
            rgOptions={MatchTypes.map((o) => ({
              data: o.value,
              label: o.label,
            }))}
            selectedOption={selectedMode}
            onChange={(newVal: { data: number; label: string }) => {
              setSelectedMode(newVal.data);
            }}
          />
        )}
      </PanelSectionRow>

      <PanelSectionRow>
        {!scanning ? (
          <ButtonItem layout="below" onClick={() => search()}>
            Search
          </ButtonItem>
        ) : (
          <ProgressBarWithInfo
            layout="below"
            bottomSeparator="none"
            nProgress={scanProgress * 100}
            nTransitionSec={0.3}
            sOperationText={`Scanning... ${Math.round(scanProgress * 100)}%`}
          />
        )}
      </PanelSectionRow>
      {scanning && (
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => {
              stopScan().catch((e) => console.error("memory-editor: stop_scan failed", e));
            }}
          >
            Cancel
          </ButtonItem>
        </PanelSectionRow>
      )}
    </PanelSection>
  );

  const Stats = (
    <PanelSection title="Stats">{infoRow("Number of Matches", numberOfMatches)}</PanelSection>
  );

  const FrozenPanel = frozenList.length > 0 && (
    <PanelSection title="Frozen Values">
      {frozenList.map((f) => (
        <Fragment key={f.address}>
          {infoRow(`🔒 ${f.address}`, `${formatValue(isNaN(Number(f.value)) ? f.value : Number(f.value), f.value_type)}`)}
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={() => unfreezeAddress(f.address)}>
              Unfreeze
            </ButtonItem>
          </PanelSectionRow>
        </Fragment>
      ))}
    </PanelSection>
  );

  const Results = (
    <PanelSection title="Results">
      {results.map((result) => {
        const editable = result.value_type !== STRING_TYPE;
        const isFrozen = frozenAddrs.has(result.address);
        return (
          <Fragment key={result.match_index}>
            {infoRow(
              `${isFrozen ? "🔒 " : ""}${result.address} (${result.value_type})`,
              formatValue(result.value, result.value_type)
            )}
            {editable && (
              <>
                <PanelSectionRow>
                  <ButtonItem
                    layout="below"
                    disabled={loading}
                    onClick={() => setValue(result.address, result.match_index)}
                  >
                    Change
                  </ButtonItem>
                </PanelSectionRow>
                <PanelSectionRow>
                  <ButtonItem layout="below" onClick={() => toggleFreeze(result)}>
                    {isFrozen ? "Unfreeze" : "Freeze"}
                  </ButtonItem>
                </PanelSectionRow>
                <PanelSectionRow>
                  <ButtonItem layout="below" onClick={() => addToWorkbench(result)}>
                    Add to Workbench
                  </ButtonItem>
                </PanelSectionRow>
              </>
            )}
          </Fragment>
        );
      })}
      <br />
      {results.some((r) => r.value_type !== STRING_TYPE) && (
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={loading} onClick={() => setValue("0x0", CHANGE_ALL)}>
            Change All
          </ButtonItem>
        </PanelSectionRow>
      )}
      {undoStack.length > 0 && (
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={loading} onClick={() => undo()}>
            Undo Last Change
          </ButtonItem>
        </PanelSectionRow>
      )}
    </PanelSection>
  );

  // Only numeric results use the numeric Change field
  const Change = results.some((r) => r.value_type !== STRING_TYPE) && (
    <PanelSection>
      <NumpadInput label="Change Value" value={newValue} onChange={(v) => setNewValue(v)} />
    </PanelSection>
  );

  return (
    <>
      {selectedProcess && ProcessInfo}
      {selectedProcess && Search}
      {selectedProcess && Stats}

      {selectedProcess && FrozenPanel}

      {selectedProcess && showResults && Change}
      {selectedProcess && showResults && Results}

      {!selectedProcess && ProcessSelection}
    </>
  );
}

export default definePlugin(() => {
  routerHook.addRoute(WORKBENCH_ROUTE, Workbench, { exact: true });

  return {
    name: "MemoryEditor",
    titleView: <div className={staticClasses.Title}>MemoryEditor</div>,
    content: <Content />,
    icon: <FaMagic />,
    alwaysRender: true,
    onDismount() {
      routerHook.removeRoute(WORKBENCH_ROUTE);
    },
  };
});
