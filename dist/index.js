const manifest = {"name":"MemoryEditor"};
const API_VERSION = 2;
const internalAPIConnection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
if (!internalAPIConnection) {
    throw new Error('[@decky/api]: Failed to connect to the loader as as the loader API was not initialized. This is likely a bug in Decky Loader.');
}
let api;
try {
    api = internalAPIConnection.connect(API_VERSION, manifest.name);
}
catch {
    api = internalAPIConnection.connect(1, manifest.name);
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version 1. Some features may not work.`);
}
if (api._version != API_VERSION) {
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version ${api._version}. Some features may not work.`);
}
const callable = api.callable;
const addEventListener = api.addEventListener;
const removeEventListener = api.removeEventListener;
const routerHook = api.routerHook;
const toaster = api.toaster;
const definePlugin = (fn) => {
    return (...args) => {
        return fn(...args);
    };
};

var DefaultContext = {
  color: undefined,
  size: undefined,
  className: undefined,
  style: undefined,
  attr: undefined
};
var IconContext = SP_REACT.createContext && /*#__PURE__*/SP_REACT.createContext(DefaultContext);

var _excluded = ["attr", "size", "title"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), true).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Tree2Element(tree) {
  return tree && tree.map((node, i) => /*#__PURE__*/SP_REACT.createElement(node.tag, _objectSpread({
    key: i
  }, node.attr), Tree2Element(node.child)));
}
function GenIcon(data) {
  return props => /*#__PURE__*/SP_REACT.createElement(IconBase, _extends({
    attr: _objectSpread({}, data.attr)
  }, props), Tree2Element(data.child));
}
function IconBase(props) {
  var elem = conf => {
    var attr = props.attr,
      size = props.size,
      title = props.title,
      svgProps = _objectWithoutProperties(props, _excluded);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return /*#__PURE__*/SP_REACT.createElement("svg", _extends({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className: className,
      style: _objectSpread(_objectSpread({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && /*#__PURE__*/SP_REACT.createElement("title", null, title), props.children);
  };
  return IconContext !== undefined ? /*#__PURE__*/SP_REACT.createElement(IconContext.Consumer, null, conf => elem(conf)) : elem(DefaultContext);
}

// THIS FILE IS AUTO GENERATED
function FaMagic (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M224 96l16-32 32-16-32-16-16-32-16 32-32 16 32 16 16 32zM80 160l26.66-53.33L160 80l-53.34-26.67L80 0 53.34 53.33 0 80l53.34 26.67L80 160zm352 128l-26.66 53.33L352 368l53.34 26.67L432 448l26.66-53.33L512 368l-53.34-26.67L432 288zm70.62-193.77L417.77 9.38C411.53 3.12 403.34 0 395.15 0c-8.19 0-16.38 3.12-22.63 9.38L9.38 372.52c-12.5 12.5-12.5 32.76 0 45.25l84.85 84.85c6.25 6.25 14.44 9.37 22.62 9.37 8.19 0 16.38-3.12 22.63-9.37l363.14-363.15c12.5-12.48 12.5-32.75 0-45.24zM359.45 203.46l-50.91-50.91 86.6-86.6 50.91 50.91-86.6 86.6z"},"child":[]}]})(props);
}

const playSound = (sound) => {
    const audio = new Audio(sound);
    audio.play();
};

const FieldWithSeparator$1 = DFL.joinClassNames(DFL.gamepadDialogClasses.Field, DFL.gamepadDialogClasses.WithBottomSeparatorStandard);
const CLICK = "https://steamloopback.host/sounds/deck_ui_misc_10.wav";
const DENY = "https://steamloopback.host/sounds/deck_ui_default_activation.wav";
const NumpadInput = (props) => {
    const { label, value, onChange } = props;
    const [inputValue, setInputValue] = SP_REACT.useState(value);
    const [hex, setHex] = SP_REACT.useState(false);
    // Resync when the parent resets the value externally (e.g. Reset Search)
    SP_REACT.useEffect(() => {
        setInputValue(value);
    }, [value]);
    const commit = (next) => {
        setInputValue(next);
        onChange(next);
    };
    const enterDigit = (digit) => {
        // Only one decimal point, and no decimals in hex mode
        if (digit === "." && (hex || inputValue.includes("."))) {
            playSound(DENY);
            return;
        }
        playSound(CLICK);
        const negative = inputValue.startsWith("-");
        const body = negative ? inputValue.slice(1) : inputValue;
        let newBody;
        if (body === "0" && digit !== ".") {
            // Replace a leading solitary zero
            newBody = digit;
        }
        else if (body === "0x0") {
            newBody = "0x" + digit;
        }
        else {
            newBody = body + digit;
        }
        commit((negative ? "-" : "") + newBody);
    };
    const backspace = () => {
        playSound(CLICK);
        let next = inputValue.length > 1 ? inputValue.slice(0, -1) : "0";
        // Don't leave a dangling sign / prefix
        if (next === "-" || next === "" || next === "0x" || next === "-0x") {
            next = "0";
        }
        commit(next);
    };
    const toggleSign = () => {
        playSound(CLICK);
        if (inputValue === "0" || inputValue === "0x0") {
            return; // -0 is pointless
        }
        commit(inputValue.startsWith("-") ? inputValue.slice(1) : "-" + inputValue);
    };
    const toggleHex = () => {
        playSound(CLICK);
        const negative = inputValue.startsWith("-");
        const body = negative ? inputValue.slice(1) : inputValue;
        if (hex) {
            // hex -> decimal: convert current value if possible
            const parsed = parseInt(body, 16);
            commit((negative ? "-" : "") + (isNaN(parsed) ? "0" : String(parsed)));
        }
        else {
            // decimal -> hex: drop any fractional part, convert the integer
            const parsed = parseInt(body, 10);
            commit((negative ? "-" : "") + "0x" + (isNaN(parsed) ? "0" : parsed.toString(16)));
        }
        setHex(!hex);
    };
    const hexKeys = ["A", "B", "C", "D", "E", "F"];
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { className: FieldWithSeparator$1, children: SP_JSX.jsxs("div", { className: DFL.gamepadDialogClasses.FieldLabelRow, children: [SP_JSX.jsx("div", { className: DFL.gamepadDialogClasses.FieldLabel, style: { maxWidth: "50%", wordBreak: "keep-all" }, children: label }), SP_JSX.jsx("div", { className: DFL.gamepadDialogClasses.FieldChildrenInner, style: { maxWidth: "50%", width: "100%", wordBreak: "break-all", textAlign: "end" }, children: inputValue })] }) }) }), SP_JSX.jsx("style", { children: `
        .NumpadGrid button {
          min-width: 0 !important;
        }
      ` }), SP_JSX.jsxs(DFL.Focusable, { className: "NumpadGrid", style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridGap: "0.5rem", padding: "8px 0" }, children: [SP_JSX.jsx(DFL.DialogButton, { onClick: () => enterDigit("7"), children: "7" }), SP_JSX.jsx(DFL.DialogButton, { onClick: () => enterDigit("8"), children: "8" }), SP_JSX.jsx(DFL.DialogButton, { onClick: () => enterDigit("9"), children: "9" }), SP_JSX.jsx(DFL.DialogButton, { onClick: () => enterDigit("4"), children: "4" }), SP_JSX.jsx(DFL.DialogButton, { onClick: () => enterDigit("5"), children: "5" }), SP_JSX.jsx(DFL.DialogButton, { onClick: () => enterDigit("6"), children: "6" }), SP_JSX.jsx(DFL.DialogButton, { onClick: () => enterDigit("1"), children: "1" }), SP_JSX.jsx(DFL.DialogButton, { onClick: () => enterDigit("2"), children: "2" }), SP_JSX.jsx(DFL.DialogButton, { onClick: () => enterDigit("3"), children: "3" }), SP_JSX.jsx(DFL.DialogButton, { onClick: () => toggleSign(), children: "\u00B1" }), SP_JSX.jsx(DFL.DialogButton, { onClick: () => enterDigit("0"), children: "0" }), SP_JSX.jsx(DFL.DialogButton, { onClick: () => enterDigit("."), disabled: hex, children: "." }), hex && hexKeys.map((k) => (SP_JSX.jsx(DFL.DialogButton, { onClick: () => enterDigit(k), children: k }, k))), SP_JSX.jsx(DFL.DialogButton, { onClick: () => backspace(), style: { gridColumn: "1 / span 2" }, children: "\u2190" }), SP_JSX.jsx(DFL.DialogButton, { onClick: () => toggleHex(), children: hex ? "hex" : "dec" })] })] }));
};

// Shared backend bindings and types for MemoryEditor.
// All arguments are passed positionally to the Python plugin methods.
// Byte width per concrete numeric type (mirrors scanmem.py TYPE_WIDTHS)
const TYPE_WIDTHS = {
    int8: 1, uint8: 1,
    int16: 2, uint16: 2,
    int32: 4, uint32: 4,
    int64: 8, uint64: 8,
    float32: 4, float64: 8,
};
// Concrete types the workbench can read/write/freeze
const WORKBENCH_TYPES = [
    "int8", "uint8", "int16", "uint16", "int32", "uint32",
    "int64", "uint64", "float32", "float64",
];
// --- process / attach ---
const getProcesses = callable("get_processes");
const getRunningGame = callable("get_running_game");
const getAttachedProcess = callable("get_attached_process");
const attachToProcess = callable("attach");
const resetScanmem = callable("reset_scanmem");
// --- scanning ---
const searchRegions = callable("search_regions");
const searchString = callable("search_string");
const getMatches = callable("get_matches");
const stopScan = callable("stop_scan");
// --- values ---
const readValues = callable("read_values");
const setValueAt = callable("set_value");
const writeAddress = callable("write_address");
// --- freezing ---
const freezeValue = callable("freeze");
const unfreezeValue = callable("unfreeze");
const getFrozen = callable("get_frozen");
// --- workbench: modules, memory, tables ---
const getModules = callable("get_modules");
const resolveModuleOffset = callable("resolve_module_offset");
const readMemory = callable("read_memory");
const saveTable = callable("save_table");
const loadTable = callable("load_table");
const addTableEntry = callable("add_table_entry");
const hasSavedTable = callable("has_saved_table");
const deleteTable = callable("delete_table");
// --- small shared helpers ---
let _idCounter = 0;
const newId = () => `e${Date.now().toString(36)}_${_idCounter++}`;
// Trim float display noise (0.10000000149011612 -> 0.1)
const formatValue = (value, value_type) => {
    if (value === null || value === undefined)
        return "?";
    if (typeof value === "string")
        return value;
    if (value_type === "float32")
        return String(Number(value.toPrecision(7)));
    if (value_type === "float64")
        return String(Number(value.toPrecision(15)));
    return String(value);
};
// Name of the loaded module a static address falls inside, or null
const staticModule = (address, maps) => {
    const addr = parseInt(address, 16);
    if (isNaN(addr))
        return null;
    for (const [start, end, name] of maps) {
        if (addr >= start && addr < end)
            return name;
    }
    return null;
};

const Row = DFL.joinClassNames(DFL.gamepadDialogClasses.Field, DFL.gamepadDialogClasses.WithBottomSeparatorStandard);
const typeOptions = WORKBENCH_TYPES.map((t) => ({ data: t, label: t }));
// One row of the hex dump: "offset:  xx xx ..   ascii"
function hexRow(start, bytes, rowIndex) {
    const off = start + rowIndex * 16;
    const slice = bytes.slice(rowIndex * 16, rowIndex * 16 + 16);
    const hex = slice.map((b) => b.toString(16).padStart(2, "0")).join(" ").padEnd(47, " ");
    const ascii = slice.map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : ".")).join("");
    return `0x${off.toString(16).padStart(8, "0")}  ${hex}  ${ascii}`;
}
function Workbench() {
    const [attached, setAttached] = SP_REACT.useState(null);
    const [entries, setEntries] = SP_REACT.useState([]);
    const [values, setValues] = SP_REACT.useState({});
    const [frozen, setFrozen] = SP_REACT.useState(new Set());
    const [modules, setModules] = SP_REACT.useState([]);
    const [maps, setMaps] = SP_REACT.useState([]);
    const [savedExists, setSavedExists] = SP_REACT.useState(false);
    const [edits, setEdits] = SP_REACT.useState({});
    // Add-entry form
    const [addLabel, setAddLabel] = SP_REACT.useState("");
    const [addMode, setAddMode] = SP_REACT.useState("abs");
    const [addAddress, setAddAddress] = SP_REACT.useState("");
    const [addModule, setAddModule] = SP_REACT.useState("");
    const [addOffset, setAddOffset] = SP_REACT.useState("");
    const [addType, setAddType] = SP_REACT.useState("int32");
    // Hex viewer
    const [hexAddr, setHexAddr] = SP_REACT.useState("");
    const [hexLen, setHexLen] = SP_REACT.useState("128");
    const [hexBlock, setHexBlock] = SP_REACT.useState(null);
    const busyRef = SP_REACT.useRef(false);
    const refreshFrozen = async () => {
        try {
            const fr = await getFrozen();
            setFrozen(new Set(fr.map((f) => f.address)));
        }
        catch (e) {
            console.error("memory-editor: getFrozen failed", e);
        }
    };
    // Load everything on mount
    SP_REACT.useEffect(() => {
        (async () => {
            try {
                setAttached(await getAttachedProcess());
            }
            catch {
                /* ignore */
            }
            try {
                const mods = await getModules();
                setModules(mods.modules);
                setMaps(mods.maps);
                if (mods.modules.length)
                    setAddModule(mods.modules[0].name);
            }
            catch (e) {
                console.error("memory-editor: getModules failed", e);
            }
            try {
                const tbl = await loadTable();
                setEntries(tbl.map((e) => ({ ...e, id: newId() })));
                setSavedExists(await hasSavedTable());
            }
            catch (e) {
                console.error("memory-editor: loadTable failed", e);
            }
            refreshFrozen();
        })();
    }, []);
    // Live value refresh while there are entries
    const addrKey = entries.map((e) => e.address).join(",");
    SP_REACT.useEffect(() => {
        if (!entries.length)
            return;
        const items = entries.map((e) => ({
            address: e.address,
            value_type: e.value_type,
            number_of_bytes: TYPE_WIDTHS[e.value_type] || 0,
        }));
        let cancelled = false;
        const id = setInterval(async () => {
            if (busyRef.current)
                return;
            try {
                const live = await readValues(items);
                if (!cancelled)
                    setValues((v) => ({ ...v, ...live }));
            }
            catch {
                /* transient — next tick retries */
            }
        }, 1000);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addrKey]);
    const toStored = (list) => list.map(({ id, ...rest }) => rest); // drop runtime id
    const persist = async (list) => {
        try {
            await saveTable(toStored(list));
            setSavedExists(true);
            toaster.toast({ title: "MemoryEditor", body: "Table saved." });
        }
        catch (e) {
            console.error("memory-editor: saveTable failed", e);
            toaster.toast({ title: "MemoryEditor", body: "Failed to save table." });
        }
    };
    const addEntry = async () => {
        let address = addAddress.trim();
        let module = null;
        let offset = null;
        if (addMode === "mod") {
            if (!addModule)
                return;
            try {
                const resolved = await resolveModuleOffset(addModule, addOffset || "0");
                if (!resolved) {
                    toaster.toast({ title: "MemoryEditor", body: "Could not resolve module + offset." });
                    return;
                }
                address = resolved;
                module = addModule;
                offset = addOffset || "0";
            }
            catch (e) {
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
    const removeEntry = (id) => setEntries((prev) => prev.filter((e) => e.id !== id));
    const applyEdit = async (entry) => {
        const value = edits[entry.id];
        if (value === undefined || value === "")
            return;
        busyRef.current = true;
        try {
            const ok = await writeAddress(entry.address, value, entry.value_type);
            if (!ok) {
                toaster.toast({ title: "MemoryEditor", body: "Failed to write value." });
            }
            else {
                // keep a frozen entry pinned at the new value
                if (frozen.has(entry.address)) {
                    await freezeValue(entry.address, value, entry.value_type).catch(() => { });
                }
                const num = parseFloat(value);
                setValues((v) => ({ ...v, [entry.address]: isNaN(num) ? v[entry.address] : num }));
            }
        }
        catch (e) {
            console.error("memory-editor: write failed", e);
            toaster.toast({ title: "MemoryEditor", body: "Failed to write value." });
        }
        busyRef.current = false;
    };
    const toggleFreeze = async (entry) => {
        try {
            if (frozen.has(entry.address)) {
                await unfreezeValue(entry.address);
            }
            else {
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
        }
        catch (e) {
            console.error("memory-editor: toggle freeze failed", e);
        }
    };
    const readHex = async (addr) => {
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
        }
        catch (e) {
            console.error("memory-editor: readMemory failed", e);
        }
    };
    if (!attached) {
        return (SP_JSX.jsxs("div", { style: { margin: "40px", color: "white" }, children: [SP_JSX.jsx("h1", { children: "MemoryEditor \u2014 Workbench" }), SP_JSX.jsx("p", { children: "No process attached. Open the MemoryEditor Quick Access panel and attach to a game first." }), SP_JSX.jsx(DFL.DialogButton, { onClick: () => DFL.Navigation.NavigateBack(), children: "Back" })] }));
    }
    const rows = hexBlock ? Math.ceil(hexBlock.bytes.length / 16) : 0;
    return (SP_JSX.jsxs("div", { style: { margin: "40px", marginBottom: "80px", color: "white" }, children: [SP_JSX.jsxs(DFL.Focusable, { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [SP_JSX.jsxs("div", { children: [SP_JSX.jsx("h1", { style: { margin: 0 }, children: "MemoryEditor \u2014 Workbench" }), SP_JSX.jsxs("div", { style: { opacity: 0.7 }, children: [attached.name, " (pid ", attached.pid, attached.app_id ? `, app ${attached.app_id}` : "", ")"] })] }), SP_JSX.jsx(DFL.DialogButton, { style: { width: "120px" }, onClick: () => DFL.Navigation.NavigateBack(), children: "Back" })] }), SP_JSX.jsx(DFL.PanelSection, { title: "Cheat Table", children: SP_JSX.jsxs(DFL.Focusable, { style: { display: "flex", gap: "0.5rem" }, children: [SP_JSX.jsx(DFL.DialogButton, { onClick: () => persist(entries), children: "Save Table" }), SP_JSX.jsx(DFL.DialogButton, { onClick: async () => {
                                const tbl = await loadTable().catch(() => []);
                                setEntries(tbl.map((e) => ({ ...e, id: newId() })));
                            }, disabled: !savedExists, children: "Reload Saved" }), SP_JSX.jsx(DFL.DialogButton, { onClick: () => setEntries([]), children: "Clear List" }), SP_JSX.jsx(DFL.DialogButton, { disabled: !savedExists, onClick: async () => {
                                await deleteTable().catch(() => { });
                                setSavedExists(false);
                                toaster.toast({ title: "MemoryEditor", body: "Saved table deleted." });
                            }, children: "Delete Saved" })] }) }), SP_JSX.jsxs(DFL.PanelSection, { title: `Addresses (${entries.length})`, children: [entries.length === 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { opacity: 0.7 }, children: "No addresses yet. Add one below, or use \"Add to Workbench\" from a search result." }) })), entries.map((entry) => {
                        const mod = staticModule(entry.address, maps);
                        const isFrozen = frozen.has(entry.address);
                        return (SP_JSX.jsxs(SP_REACT.Fragment, { children: [SP_JSX.jsx("div", { className: Row, children: SP_JSX.jsxs("div", { className: DFL.gamepadDialogClasses.FieldLabelRow, children: [SP_JSX.jsxs("div", { className: DFL.gamepadDialogClasses.FieldLabel, style: { wordBreak: "break-all" }, children: [isFrozen ? "🔒 " : "", entry.label, SP_JSX.jsxs("div", { style: { fontSize: "0.8em", opacity: 0.7 }, children: [entry.address, " \u00B7 ", entry.value_type, entry.module ? ` · ${entry.module}+${entry.offset}` : mod ? ` · ${mod}` : ""] })] }), SP_JSX.jsx("div", { className: DFL.gamepadDialogClasses.FieldChildrenInner, style: { textAlign: "end", wordBreak: "break-all" }, children: formatValue(values[entry.address] ?? null, entry.value_type) })] }) }), SP_JSX.jsxs(DFL.Focusable, { style: { display: "flex", gap: "0.5rem", padding: "4px 0" }, children: [SP_JSX.jsx("div", { style: { flex: 2 }, children: SP_JSX.jsx(DFL.TextField, { label: "New value", value: edits[entry.id] ?? "", onChange: (e) => setEdits((s) => ({ ...s, [entry.id]: e.target.value })) }) }), SP_JSX.jsx(DFL.DialogButton, { style: { flex: 1 }, onClick: () => applyEdit(entry), children: "Set" }), SP_JSX.jsx(DFL.DialogButton, { style: { flex: 1 }, onClick: () => toggleFreeze(entry), children: isFrozen ? "Unfreeze" : "Freeze" }), SP_JSX.jsx(DFL.DialogButton, { style: { flex: 1 }, onClick: () => readHex(entry.address), children: "Hex" }), SP_JSX.jsx(DFL.DialogButton, { style: { flex: 1 }, onClick: () => removeEntry(entry.id), children: "Remove" })] })] }, entry.id));
                    })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Add Address", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Label", value: addLabel, onChange: (e) => setAddLabel(e.target.value) }) }), SP_JSX.jsx(DFL.DropdownItem, { label: "Entry Type", rgOptions: [
                            { data: "abs", label: "Absolute address" },
                            { data: "mod", label: "Module + offset" },
                        ], selectedOption: addMode, onChange: (o) => setAddMode(o.data) }), addMode === "abs" ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Address (0x\u2026)", value: addAddress, onChange: (e) => setAddAddress(e.target.value) }) })) : (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.DropdownItem, { label: "Module", rgOptions: modules.map((m) => ({ data: m.name, label: m.name })), selectedOption: addModule, onChange: (o) => setAddModule(o.data) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Offset (0x\u2026)", value: addOffset, onChange: (e) => setAddOffset(e.target.value) }) })] })), SP_JSX.jsx(DFL.DropdownItem, { label: "Value Type", rgOptions: typeOptions, selectedOption: addType, onChange: (o) => setAddType(o.data) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => addEntry(), children: "Add to List" }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Memory Viewer", children: [SP_JSX.jsxs(DFL.Focusable, { style: { display: "flex", gap: "0.5rem", alignItems: "end" }, children: [SP_JSX.jsx("div", { style: { flex: 3 }, children: SP_JSX.jsx(DFL.TextField, { label: "Address (0x\u2026)", value: hexAddr, onChange: (e) => setHexAddr(e.target.value) }) }), SP_JSX.jsx("div", { style: { flex: 1 }, children: SP_JSX.jsx(DFL.TextField, { label: "Bytes", value: hexLen, onChange: (e) => setHexLen(e.target.value) }) }), SP_JSX.jsx(DFL.DialogButton, { style: { flex: 1 }, onClick: () => readHex(), children: "Read" })] }), hexBlock && (SP_JSX.jsx("pre", { style: {
                            fontFamily: "monospace",
                            fontSize: "0.85em",
                            whiteSpace: "pre",
                            overflowX: "auto",
                            background: "rgba(0,0,0,0.3)",
                            padding: "8px",
                            marginTop: "8px",
                        }, children: Array.from({ length: rows }, (_, r) => hexRow(hexBlock.start, hexBlock.bytes, r)).join("\n") }))] }), SP_JSX.jsx(DFL.Field, { label: "" })] }));
}

const WORKBENCH_ROUTE = "/memoryeditor/workbench";
const FieldWithSeparator = DFL.joinClassNames(DFL.gamepadDialogClasses.Field, DFL.gamepadDialogClasses.WithBottomSeparatorStandard);
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
function Content() {
    const [processList, setProcessList] = SP_REACT.useState([]);
    const [searchValue, setSearchValue] = SP_REACT.useState("0");
    const [rangeEnd, setRangeEnd] = SP_REACT.useState("0");
    const [searchValueType, setSearchValueType] = SP_REACT.useState("auto");
    const [selectedMode, setSelectedMode] = SP_REACT.useState(1);
    const [selectedProcess, setSelectedProcess] = SP_REACT.useState(null);
    const [numberOfMatches, setNumberOfMatches] = SP_REACT.useState(0);
    const [loading, setLoading] = SP_REACT.useState(false);
    const [scanning, setScanning] = SP_REACT.useState(false);
    const [scanProgress, setScanProgress] = SP_REACT.useState(0);
    const [newValue, setNewValue] = SP_REACT.useState("0");
    const [results, setResults] = SP_REACT.useState([]);
    const [detectedGame, setDetectedGame] = SP_REACT.useState(null);
    const [frozenList, setFrozenList] = SP_REACT.useState([]);
    const [undoStack, setUndoStack] = SP_REACT.useState([]);
    // Ref mirror of `loading` so the refresh interval can skip mid-edit ticks
    // without having to re-subscribe every time loading flips.
    const loadingRef = SP_REACT.useRef(false);
    SP_REACT.useEffect(() => {
        loadingRef.current = loading;
    }, [loading]);
    const isStringSearch = searchValueType === STRING_TYPE;
    const isRangeSearch = selectedMode === MATCH_RANGE && !isStringSearch;
    const frozenAddrs = new Set(frozenList.map((f) => f.address));
    const syncFrozen = async () => {
        try {
            setFrozenList(await getFrozen());
        }
        catch (e) {
            console.error("memory-editor: get_frozen failed", e);
        }
    };
    // When selectedProcess is updated, attach to it on the backend.
    // Attaching to a new process resets the scan and drops frozen values;
    // re-attaching to the same one (e.g. after a frontend reload) keeps them,
    // so sync the freeze state from the backend once the attach settles.
    SP_REACT.useEffect(() => {
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
        }
        catch (e) {
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
        }
        catch (e) {
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
            }
            else {
                setNumberOfMatches(matches);
                if (matches <= RESULTS_LIMIT) {
                    await loadResults();
                }
                else {
                    setResults([]);
                }
            }
        }
        catch (e) {
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
        }
        catch (e) {
            console.error("memory-editor: reset failed", e);
        }
    };
    // Re-freeze any affected addresses at `value` so a frozen entry doesn't
    // immediately revert a change, and keep the panel's shown value in sync.
    const refreezeAffected = (isAffected, value) => {
        const touched = results.filter((r) => isAffected(r) && frozenAddrs.has(r.address));
        for (const r of touched) {
            freezeValue(r.address, value, r.value_type).catch((e) => console.error("memory-editor: refreeze failed", e));
        }
        if (touched.length) {
            const addrs = new Set(touched.map((r) => r.address));
            setFrozenList((prev) => prev.map((f) => (addrs.has(f.address) ? { ...f, value } : f)));
        }
    };
    const applyValue = async (address, match_index, value) => {
        const isAffected = (r) => match_index === CHANGE_ALL || r.match_index === match_index;
        const ok = await setValueAt(address, match_index, value);
        if (!ok) {
            toaster.toast({ title: "MemoryEditor", body: "Failed to set value." });
            return false;
        }
        refreezeAffected(isAffected, value);
        const parsed = parseFloat(value);
        setResults((prev) => prev.map((r) => isAffected(r) ? { ...r, value: isNaN(parsed) ? r.value : parsed } : r));
        return true;
    };
    const setValue = async (address, match_index) => {
        playSound("https://steamloopback.host/sounds/deck_ui_default_activation.wav");
        setLoading(true);
        try {
            // Capture current values for undo before overwriting
            const captured = results
                .filter((r) => match_index === CHANGE_ALL || r.match_index === match_index)
                .map((r) => ({
                address: r.address,
                match_index: r.match_index,
                value_type: r.value_type,
                oldValue: r.value,
            }));
            const ok = await applyValue(address, match_index, newValue);
            if (ok && captured.length) {
                setUndoStack((prev) => [...prev, captured].slice(-20));
            }
        }
        catch (e) {
            console.error("memory-editor: set_value failed", e);
            toaster.toast({ title: "MemoryEditor", body: "Failed to set value." });
        }
        setLoading(false);
    };
    const undo = async () => {
        const op = undoStack[undoStack.length - 1];
        if (!op)
            return;
        setLoading(true);
        try {
            for (const entry of op) {
                if (entry.oldValue === null || typeof entry.oldValue === "string") {
                    continue; // only numeric values can be rewritten
                }
                await applyValue(entry.address, entry.match_index, String(entry.oldValue));
            }
            setUndoStack((prev) => prev.slice(0, -1));
        }
        catch (e) {
            console.error("memory-editor: undo failed", e);
            toaster.toast({ title: "MemoryEditor", body: "Undo failed, check the logs." });
        }
        setLoading(false);
    };
    const toggleFreeze = async (result) => {
        try {
            if (frozenAddrs.has(result.address)) {
                await unfreezeValue(result.address);
                setFrozenList((prev) => prev.filter((f) => f.address !== result.address));
            }
            else {
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
                }
                else {
                    toaster.toast({ title: "MemoryEditor", body: "Failed to freeze value." });
                }
            }
        }
        catch (e) {
            console.error("memory-editor: toggle freeze failed", e);
        }
    };
    const unfreezeAddress = async (address) => {
        try {
            await unfreezeValue(address);
            setFrozenList((prev) => prev.filter((f) => f.address !== address));
        }
        catch (e) {
            console.error("memory-editor: unfreeze failed", e);
        }
    };
    const addToWorkbench = async (result) => {
        try {
            await addTableEntry({
                label: `${result.value_type} @ ${result.address}`,
                address: result.address,
                value_type: result.value_type,
                module: null,
                offset: null,
            });
            toaster.toast({ title: "MemoryEditor", body: "Added to workbench table." });
        }
        catch (e) {
            console.error("memory-editor: addTableEntry failed", e);
            toaster.toast({ title: "MemoryEditor", body: "Failed to add to workbench." });
        }
    };
    const openWorkbench = () => {
        DFL.Navigation.Navigate(WORKBENCH_ROUTE);
        DFL.Navigation.CloseSideMenus();
    };
    const showResults = numberOfMatches > 0 && numberOfMatches <= RESULTS_LIMIT && results.length > 0;
    // Re-subscribe the refresh loop only when the *set* of addresses changes,
    // not on every value tick, so the interval isn't constantly torn down.
    const resultAddrKey = results.map((r) => r.address).join(",");
    // Poll the backend for live values while results are visible
    SP_REACT.useEffect(() => {
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
            if (loadingRef.current)
                return;
            try {
                const live = await readValues(items);
                if (cancelled)
                    return;
                setResults((prev) => prev.map((r) => (r.address in live ? { ...r, value: live[r.address] } : r)));
            }
            catch {
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
    SP_REACT.useEffect(() => {
        const progressListener = addEventListener("scan_progress", (progress) => setScanProgress(progress));
        // Backend drops a freeze after repeated write failures (e.g. game exited)
        const droppedListener = addEventListener("freeze_dropped", (address) => {
            setFrozenList((prev) => prev.filter((f) => f.address !== address));
            toaster.toast({
                title: "MemoryEditor",
                body: `Stopped freezing ${address} (write failed).`,
            });
        });
        loadProcessList();
        loadExistingProcess();
        return () => {
            removeEventListener("scan_progress", progressListener);
            removeEventListener("freeze_dropped", droppedListener);
        };
    }, []);
    const ProcessSelection = (SP_JSX.jsxs(DFL.PanelSection, { title: "Process Selection", children: [detectedGame && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs(DFL.ButtonItem, { layout: "below", bottomSeparator: "thick", onClick: () => setSelectedProcess(detectedGame), children: ["\uD83C\uDFAE Attach to ", detectedGame.name, " (detected game)"] }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => loadProcessList(), children: "Reload Process List" }) }), processList.map((process) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { onClick: () => setSelectedProcess(process), layout: "below", children: process.name }) }, process.pid)))] }));
    const infoRow = (label, value) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { className: FieldWithSeparator, children: SP_JSX.jsxs("div", { className: DFL.gamepadDialogClasses.FieldLabelRow, children: [SP_JSX.jsx("div", { className: DFL.gamepadDialogClasses.FieldLabel, style: { maxWidth: "40%", wordBreak: "break-all" }, children: label }), SP_JSX.jsx("div", { className: DFL.gamepadDialogClasses.FieldChildrenInner, style: { maxWidth: "60%", width: "100%", wordBreak: "break-all", textAlign: "end" }, children: value })] }) }) }));
    const ProcessInfo = (SP_JSX.jsxs(DFL.PanelSection, { title: "Process Info", children: [infoRow("Name", selectedProcess?.name), infoRow("PID", selectedProcess?.pid), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: scanning, onClick: () => setSelectedProcess(null), children: "Choose Another Process" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: scanning, onClick: () => reset(), children: "Reset Search" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => openWorkbench(), children: "Open Memory Workbench" }) })] }));
    const Search = (SP_JSX.jsxs(DFL.PanelSection, { title: "Search", children: [isStringSearch ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Search String", value: searchValue, onChange: (e) => setSearchValue(e.target.value) }) })) : (SP_JSX.jsx(NumpadInput, { label: "Search Value", value: searchValue, onChange: (v) => setSearchValue(v) })), isRangeSearch && (SP_JSX.jsx(NumpadInput, { label: "Range End", value: rangeEnd, onChange: (v) => setRangeEnd(v) })), SP_JSX.jsxs(DFL.PanelSectionRow, { children: [SP_JSX.jsx(DFL.DropdownItem, { label: "Value Type", description: "What type of value to search.", menuLabel: "Value Type", rgOptions: SearchValueTypes.map((o) => ({
                            data: o.value,
                            label: o.label,
                        })), selectedOption: searchValueType, onChange: (newVal) => {
                            setSearchValueType(newVal.data);
                            reset();
                        } }), !isStringSearch && (SP_JSX.jsx(DFL.DropdownItem, { label: "Search Type", description: "What type of search to make.", menuLabel: "Search Type", rgOptions: MatchTypes.map((o) => ({
                            data: o.value,
                            label: o.label,
                        })), selectedOption: selectedMode, onChange: (newVal) => {
                            setSelectedMode(newVal.data);
                        } }))] }), SP_JSX.jsx(DFL.PanelSectionRow, { children: !scanning ? (SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => search(), children: "Search" })) : (SP_JSX.jsx(DFL.ProgressBarWithInfo, { layout: "below", bottomSeparator: "none", nProgress: scanProgress * 100, nTransitionSec: 0.3, sOperationText: `Scanning... ${Math.round(scanProgress * 100)}%` })) }), scanning && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => {
                        stopScan().catch((e) => console.error("memory-editor: stop_scan failed", e));
                    }, children: "Cancel" }) }))] }));
    const Stats = (SP_JSX.jsx(DFL.PanelSection, { title: "Stats", children: infoRow("Number of Matches", numberOfMatches) }));
    const FrozenPanel = frozenList.length > 0 && (SP_JSX.jsx(DFL.PanelSection, { title: "Frozen Values", children: frozenList.map((f) => (SP_JSX.jsxs(SP_REACT.Fragment, { children: [infoRow(`🔒 ${f.address}`, `${formatValue(isNaN(Number(f.value)) ? f.value : Number(f.value), f.value_type)}`), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => unfreezeAddress(f.address), children: "Unfreeze" }) })] }, f.address))) }));
    const Results = (SP_JSX.jsxs(DFL.PanelSection, { title: "Results", children: [results.map((result) => {
                const editable = result.value_type !== STRING_TYPE;
                const isFrozen = frozenAddrs.has(result.address);
                return (SP_JSX.jsxs(SP_REACT.Fragment, { children: [infoRow(`${isFrozen ? "🔒 " : ""}${result.address} (${result.value_type})`, formatValue(result.value, result.value_type)), editable && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: loading, onClick: () => setValue(result.address, result.match_index), children: "Change" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => toggleFreeze(result), children: isFrozen ? "Unfreeze" : "Freeze" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => addToWorkbench(result), children: "Add to Workbench" }) })] }))] }, result.match_index));
            }), SP_JSX.jsx("br", {}), results.some((r) => r.value_type !== STRING_TYPE) && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: loading, onClick: () => setValue("0x0", CHANGE_ALL), children: "Change All" }) })), undoStack.length > 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: loading, onClick: () => undo(), children: "Undo Last Change" }) }))] }));
    // Only numeric results use the numeric Change field
    const Change = results.some((r) => r.value_type !== STRING_TYPE) && (SP_JSX.jsx(DFL.PanelSection, { children: SP_JSX.jsx(NumpadInput, { label: "Change Value", value: newValue, onChange: (v) => setNewValue(v) }) }));
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [selectedProcess && ProcessInfo, selectedProcess && Search, selectedProcess && Stats, selectedProcess && FrozenPanel, selectedProcess && showResults && Change, selectedProcess && showResults && Results, !selectedProcess && ProcessSelection] }));
}
var index = definePlugin(() => {
    routerHook.addRoute(WORKBENCH_ROUTE, Workbench, { exact: true });
    return {
        name: "MemoryEditor",
        titleView: SP_JSX.jsx("div", { className: DFL.staticClasses.Title, children: "MemoryEditor" }),
        content: SP_JSX.jsx(Content, {}),
        icon: SP_JSX.jsx(FaMagic, {}),
        alwaysRender: true,
        onDismount() {
            routerHook.removeRoute(WORKBENCH_ROUTE);
        },
    };
});

export { index as default };
//# sourceMappingURL=index.js.map
