import os
import sys
import json
import asyncio
import subprocess
# Little hack to allow importing of files after Decky has loaded the plugin.
sys.path.append(os.path.dirname(__file__))

try:
    # Available when running inside Decky Loader (api_version 1)
    import decky
    logger = decky.logger
except ImportError:
    # Running standalone (CLI testing mode)
    decky = None
    import logging
    logging.basicConfig(level=logging.DEBUG)
    logger = logging.getLogger("memory-editor")

from ctypes import c_uint8
from scanmem import (
    Scanmem, parse_uservalue, UserValue, MatchFlag, ScanMatchType, ScanDataType,
    decode_typed_value, TYPE_WIDTHS,
)

class Plugin:
    search_type = "auto"
    is_scanning = False
    last_scan_was_string = False

    # Send an event to the frontend; no-op when running outside Decky
    async def _emit(self, event, *args):
        if decky is not None:
            await decky.emit(event, *args)

    # System processes we never want to show in the picker. Matched against the
    # executable *basename* (see _is_blacklisted), not the whole command line,
    # so a path or argument that merely contains one of these words can't hide
    # a real game (e.g. a Proton game whose command references .../system32/...).
    _PROC_BLACKLIST = [
        "ps", "systemd", "reaper", "pressure-vessel", "proton",
        "power-button-handler", "ibus", "xbindkeys", "wineserver", "socat",
        "sd-pam", "gamemoded", "sdgyrodsu", "dbus-daemon", "kwalletd5",
        "gamescope", "gamescope-session", "PluginLoader", "pipewire",
        "Xwayland", "wireplumber", "sshd", "mangoapp", "steamwebhelper",
        "steam", "xdg-desktop-portal", "xdg-document-portal",
        "xdg-permission-store", "bash", "steamos-devkit-service",
        "dconf-service", "CrashHandler", "ControllerTools",
    ]

    @classmethod
    def _is_blacklisted(cls, exe):
        # Match an exact executable name or a "<name>-..." family member
        # (systemd -> systemd-journald, ibus -> ibus-daemon, etc.)
        exe = exe.lower()
        for entry in cls._PROC_BLACKLIST:
            entry = entry.lower()
            if exe == entry or exe.startswith(entry + "-"):
                return True
        return False

    # Method to return list of process names and PIDs on the system.
    async def get_processes(self):
        logger.info("Getting processes")

        process_list = []

        # PID and full command line for every process owned by the deck user
        output = subprocess.check_output(
            ["ps", "-u", "1000", "-o", "pid,command"])

        lines = output.decode(errors="replace").splitlines()
        # Drop the "PID COMMAND" header row if present
        if lines and ("COMMAND" in lines[0].upper() or lines[0].strip().upper().startswith("PID")):
            lines = lines[1:]

        for line in lines:
            parts = line.split(None, 1)
            if len(parts) != 2:
                continue
            pid, command = parts

            # Basename of argv[0]; handle both / and \ (wine/Proton paths)
            argv0 = command.split()[0]
            exe = argv0.replace("\\", "/").rsplit("/", 1)[-1]

            if self._is_blacklisted(exe):
                continue

            try:
                process_list.append({"pid": int(pid), "name": command})
            except ValueError:
                continue

        return process_list

    @staticmethod
    def _get_rss(pid):
        # Resident set size in pages; used to pick the "real" game process
        try:
            with open("/proc/%d/statm" % pid) as f:
                return int(f.read().split()[1])
        except (OSError, IndexError, ValueError):
            return 0

    # Best-effort detection of the currently running Steam game. Steam sets
    # SteamAppId in the game's environment; several wrapper processes inherit
    # it, so we take the blacklist-filtered candidate using the most memory.
    async def get_running_game(self):
        best = None
        best_rss = -1

        for proc in await self.get_processes():
            pid = proc["pid"]
            try:
                with open("/proc/%d/environ" % pid, "rb") as f:
                    environ = f.read()
            except (OSError, ProcessLookupError):
                continue

            if b"SteamAppId=" not in environ and b"SteamGameId=" not in environ:
                continue

            rss = self._get_rss(pid)
            if rss > best_rss:
                best_rss = rss
                best = proc

        if best is not None:
            logger.info("Detected running game: %s (pid %s)", best["name"], best["pid"])

        return best

    # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
    async def _main(self):
        logger.info("Starting MemoryEditor")

        # Frozen values: address(str, hex) -> {"value": str, "type": str}
        self.frozen = {}
        self._freeze_task = None
        # Serialises all libscanmem access (scans, freeze writes) since the
        # backend has global state and ptraces a single target
        self._scanmem_lock = asyncio.Lock()

        self.scanmem = Scanmem()
        self.scanmem.init()
        self.scanmem.set_backend()

    # Called by Decky when the plugin is unloaded
    async def _unload(self):
        logger.info("Unloading MemoryEditor")
        self.frozen = {}
        task = getattr(self, '_freeze_task', None)
        if task is not None:
            task.cancel()
            self._freeze_task = None
        if hasattr(self, 'scanmem'):
            self.scanmem.cleanup()

    async def get_num_matches(self):
        return self.scanmem.get_num_matches()

    async def get_scan_progress(self):
        return self.scanmem.get_scan_progress()

    async def get_match_list(self):
        async with self._scanmem_lock:
            return self.scanmem.exec_command("list")

    async def get_matches(self):
        # The match array is reallocated while a scan runs; don't walk it
        if self.is_scanning:
            return []

        return self.scanmem.get_matches(is_string=self.last_scan_was_string)

    # Re-read the current live value at each result address. `items` is a list
    # of {"address": "0x..", "value_type": str, "number_of_bytes": int}. Used
    # to keep the results list ticking without re-scanning.
    async def read_values(self, items):
        if self.is_scanning or not getattr(self, 'pid', None) or not items:
            return {}

        result = {}
        async with self._scanmem_lock:
            for item in items:
                try:
                    address = int(item["address"], 16)
                except (KeyError, ValueError):
                    continue

                value_type = item.get("value_type", "")
                if value_type == "string":
                    width = int(item.get("number_of_bytes") or 0)
                else:
                    width = TYPE_WIDTHS.get(value_type, 0)
                if width <= 0:
                    continue

                buf = (c_uint8 * width)()
                ok = await asyncio.to_thread(
                    self.scanmem.read_array, self.pid, address, buf, width)
                if ok:
                    decoded = decode_typed_value(bytes(buf), value_type)
                    if decoded is not None:
                        result[item["address"]] = decoded

        return result

    # ---- Workbench: arbitrary addresses, modules, cheat tables ----------

    @staticmethod
    def _parse_app_id(environ_bytes):
        for kv in environ_bytes.split(b"\x00"):
            if kv.startswith(b"SteamAppId="):
                return kv.split(b"=", 1)[1].decode(errors="replace")
        return None

    @classmethod
    def _read_app_id(cls, pid):
        # SteamAppId from the process environment; keys the saved cheat table
        try:
            with open("/proc/%d/environ" % pid, "rb") as f:
                return cls._parse_app_id(f.read())
        except OSError:
            return None

    @staticmethod
    def _parse_maps(text):
        module_base = {}
        maps = []
        for line in text.splitlines():
            parts = line.split(None, 5)
            if len(parts) < 6:
                continue
            path = parts[5].strip()
            if not path.startswith("/"):
                continue  # skip anonymous / special mappings
            start_s, _, end_s = parts[0].partition("-")
            try:
                start = int(start_s, 16)
                end = int(end_s, 16)
            except ValueError:
                continue
            name = os.path.basename(path)
            maps.append([start, end, name])
            if name not in module_base or start < module_base[name]:
                module_base[name] = start

        modules = [{"name": n, "base": b} for n, b in
                   sorted(module_base.items(), key=lambda kv: kv[1])]
        return {"modules": modules, "maps": maps}

    async def get_modules(self):
        '''
            File-backed mappings of the target, from /proc/<pid>/maps.
            `modules` lists one entry per file at its lowest load address (for
            the module+offset picker); `maps` is every file-backed range so the
            UI can tag "static" addresses that live inside a loaded module.
        '''
        pid = getattr(self, 'pid', None)
        if not pid:
            return {"modules": [], "maps": []}
        try:
            with open("/proc/%d/maps" % pid) as f:
                text = f.read()
        except OSError:
            return {"modules": [], "maps": []}
        return self._parse_maps(text)

    async def resolve_module_offset(self, module, offset):
        # Absolute address (hex string) for module_base + offset, or None
        try:
            off = int(str(offset), 0)
        except ValueError:
            return None
        for m in (await self.get_modules())["modules"]:
            if m["name"] == module:
                return hex(m["base"] + off)
        return None

    async def read_memory(self, address, length):
        # Raw bytes for the hex viewer (capped at 4 KiB)
        if self.is_scanning or not getattr(self, 'pid', None):
            return None
        try:
            addr = int(str(address), 0)
        except ValueError:
            return None
        length = max(1, min(int(length), 4096))
        buf = (c_uint8 * length)()
        async with self._scanmem_lock:
            ok = await asyncio.to_thread(
                self.scanmem.read_array, self.pid, addr, buf, length)
        if not ok:
            return None
        return {"address": hex(addr), "start": addr, "bytes": list(bytes(buf))}

    async def write_address(self, address, value, value_type):
        # Write a value to an arbitrary address (workbench edit)
        if self.is_scanning:
            return False
        write_type = self._WRITE_TYPES.get(value_type)
        if write_type is None:
            logger.error("Cannot write unsupported type: %s", value_type)
            return False
        async with self._scanmem_lock:
            return self.scanmem.exec_command(
                "write %s %s %s" % (write_type, address, value))

    def _tables_path(self):
        base = decky.DECKY_PLUGIN_SETTINGS_DIR if decky is not None \
            else os.path.dirname(__file__)
        return os.path.join(base, "tables.json")

    def _table_key(self):
        # Prefer SteamAppId; fall back to process name so non-Steam apps work
        return (getattr(self, 'app_id', None)
                or getattr(self, 'process_name', None) or "default")

    def _load_all_tables(self):
        try:
            with open(self._tables_path(), "r") as f:
                return json.load(f)
        except (OSError, ValueError):
            return {}

    def _save_all_tables(self, data):
        path = self._tables_path()
        os.makedirs(os.path.dirname(path), exist_ok=True)
        tmp = path + ".tmp"
        with open(tmp, "w") as f:
            json.dump(data, f, indent=2)
        os.replace(tmp, path)  # atomic on POSIX

    async def save_table(self, entries):
        data = self._load_all_tables()
        data[self._table_key()] = {
            "name": getattr(self, 'process_name', None),
            "app_id": getattr(self, 'app_id', None),
            "entries": entries,
        }
        self._save_all_tables(data)
        return True

    async def load_table(self):
        return self._load_all_tables().get(self._table_key(), {}).get("entries", [])

    async def add_table_entry(self, entry):
        # Append one entry to the saved table (used by "Add to Workbench")
        entries = await self.load_table()
        entries.append(entry)
        await self.save_table(entries)
        return True

    async def has_saved_table(self):
        return self._table_key() in self._load_all_tables()

    async def delete_table(self):
        data = self._load_all_tables()
        if self._table_key() in data:
            del data[self._table_key()]
            self._save_all_tables(data)
        return True

    async def get_attached_process(self):
        # If self.pid and self.process_name exist
        if hasattr(self, 'pid') and hasattr(self, 'process_name'):
            return {
                "pid": self.pid,
                "name": self.process_name,
                "app_id": getattr(self, 'app_id', None),
            }
        # If they don't exist, return None
        return None

    async def reset_scanmem(self):
        if self.is_scanning:
            return False

        async with self._scanmem_lock:
            self.scanmem.reset()
        self.last_scan_was_string = False
        return True

    # Method to attach to a process
    async def attach(self, pid, name):
        if self.is_scanning:
            return False

        pid = int(pid)

        # Re-attaching to the same process (e.g. after a frontend reload)
        # must not wipe the current scan and frozen values
        if getattr(self, 'pid', None) == pid:
            return True

        logger.info("Attaching to process %s", pid)
        self.pid = pid
        self.process_name = name
        self.app_id = self._read_app_id(pid)

        # Frozen addresses belong to the previous process; empty the dict
        # first so the freeze loop starts no new write batches, then switch
        # the target under the lock so no in-flight batch hits the new pid
        self.frozen = {}

        async with self._scanmem_lock:
            self.scanmem.globals.target = self.pid
            self.scanmem.reset()
        self.last_scan_was_string = False

        return True

    @staticmethod
    def _parse_int(value_str):
        # Accept 0x.. / 0o.. / 0b.. and plain decimal (including leading zeros),
        # so hex entry works for every integer type, signed or unsigned.
        try:
            return int(value_str, 0)
        except ValueError:
            return int(value_str)  # ValueError here is handled by the caller

    @classmethod
    def _build_uservalue(cls, value_str, value_type):
        '''
            Build a UserValue from a search string, either auto-detected or
            forced to a concrete c-type. Returns the UserValue, or None if the
            string can't be parsed as the requested type.
        '''
        if value_type == "auto":
            return parse_uservalue(value_str)

        val = UserValue()
        try:
            match value_type:
                case "c_int8":
                    val.flags |= MatchFlag.FLAG_S8B
                    val.int8_value = cls._parse_int(value_str)
                case "c_uint8":
                    val.flags |= MatchFlag.FLAG_U8B
                    val.uint8_value = cls._parse_int(value_str)
                case "c_int16":
                    val.flags |= MatchFlag.FLAG_S16B
                    val.int16_value = cls._parse_int(value_str)
                case "c_uint16":
                    val.flags |= MatchFlag.FLAG_U16B
                    val.uint16_value = cls._parse_int(value_str)
                case "c_int32":
                    val.flags |= MatchFlag.FLAG_S32B
                    val.int32_value = cls._parse_int(value_str)
                case "c_uint32":
                    val.flags |= MatchFlag.FLAG_U32B
                    val.uint32_value = cls._parse_int(value_str)
                case "c_int64":
                    val.flags |= MatchFlag.FLAG_S64B
                    val.int64_value = cls._parse_int(value_str)
                case "c_uint64":
                    val.flags |= MatchFlag.FLAG_U64B
                    val.uint64_value = cls._parse_int(value_str)
                case "c_float":
                    val.flags |= MatchFlag.FLAG_F32B
                    val.float32_value = float(value_str)
                case "c_double":
                    val.flags |= MatchFlag.FLAG_F64B
                    val.float64_value = float(value_str)
                case _:
                    logger.error("Unknown search value type: %s", value_type)
                    return None
        except ValueError:
            logger.error("Unable to parse value [%s]: %s", value_type, value_str)
            return None
        return val

    def _apply_scan_data_type(self, flags):
        int_flags = flags & MatchFlag.FLAGS_INTEGER
        float_flags = flags & MatchFlag.FLAGS_FLOAT
        if int_flags and float_flags:
            self.scanmem.globals.options.scan_data_type = ScanDataType.ANYNUMBER
        elif float_flags:
            self.scanmem.globals.options.scan_data_type = ScanDataType.ANYFLOAT
        else:
            self.scanmem.globals.options.scan_data_type = ScanDataType.ANYINTEGER

    async def _run_scan(self, scan_call):
        '''
            Run a blocking libscanmem scan in a worker thread (ctypes releases
            the GIL) while the event loop keeps emitting progress. Serialised
            against freeze writes by _scanmem_lock. Returns num_matches.
        '''
        self.is_scanning = True
        try:
            async with self._scanmem_lock:
                task = asyncio.create_task(asyncio.to_thread(scan_call))

                while True:
                    done, _ = await asyncio.wait({task}, timeout=0.25)
                    if done:
                        break
                    await self._emit("scan_progress", self.scanmem.get_scan_progress())

                await task
        finally:
            self.is_scanning = False
            await self._emit("scan_progress", 1.0)

        return self.scanmem.get_num_matches()

    async def search_regions(self, match_type, searchValue, searchValueType, rangeEnd=None):
        if self.is_scanning:
            logger.warning("Search requested while a scan is already running")
            return False

        val = self._build_uservalue(searchValue, searchValueType)
        if val is None:
            return False

        is_first_scan = self.scanmem.globals.matches is None

        if match_type == ScanMatchType.MATCH_RANGE:
            # Range needs a second bound; scanmem reads a 2-element uservalue
            # array and ANDs the flags into the first (handlers.c: handler__default)
            if rangeEnd is None:
                logger.error("Range search requires an upper bound")
                return False
            val_hi = self._build_uservalue(rangeEnd, searchValueType)
            if val_hi is None:
                return False

            pair = (UserValue * 2)()
            pair[0] = val
            pair[1] = val_hi
            pair[0].flags &= pair[1].flags
            self._apply_scan_data_type(pair[0].flags)

            self.last_scan_was_string = False
            scan_ptr = self.scanmem.search_regions_ptr if is_first_scan \
                else self.scanmem.check_matches_ptr
            logger.info("Range search %s..%s", searchValue, rangeEnd)
            return await self._run_scan(
                lambda: scan_ptr(ScanMatchType.MATCH_RANGE, pair))

        self._apply_scan_data_type(val.flags)
        self.last_scan_was_string = False

        scan = self.scanmem.search_regions if is_first_scan else self.scanmem.check_matches
        logger.info("Search %s (type %s, op %s)", searchValue, searchValueType, match_type)
        return await self._run_scan(lambda: scan(match_type, val))

    async def search_string(self, searchValue):
        if self.is_scanning:
            logger.warning("Search requested while a scan is already running")
            return False

        # Strip CR/LF so the value can't inject a second scanmem command
        searchValue = searchValue.replace("\r", "").replace("\n", "")
        if not searchValue:
            return False

        self.scanmem.globals.options.scan_data_type = ScanDataType.STRING
        self.last_scan_was_string = True
        logger.info("String search: %s", searchValue)

        # The `"` command takes the raw text after `" ` (handler__string)
        return await self._run_scan(
            lambda: self.scanmem.exec_command('" ' + searchValue))

    # Ask a running scan to stop; matches found so far are kept
    async def stop_scan(self):
        if self.is_scanning:
            logger.info("Stopping scan")
            self.scanmem.set_stop_flag(True)
            return True
        return False

    async def set_value(self, address, match_index, value):
        if self.is_scanning:
            return False

        if match_index != 999:
            logger.info("Setting match %s (%s) to %s", match_index, address, value)
            command = "set " + str(match_index) + "=" + value
        else:
            logger.info("Setting all matched addresses to %s", value)
            command = "set " + value

        async with self._scanmem_lock:
            return self.scanmem.exec_command(command)

    # scanmem's `write` command only accepts signed/float type names; the
    # byte width is what matters, so map unsigned types to same-width signed.
    _WRITE_TYPES = {
        "int8": "int8", "uint8": "int8",
        "int16": "int16", "uint16": "int16",
        "int32": "int32", "uint32": "int32",
        "int64": "int64", "uint64": "int64",
        "float32": "float32", "float64": "float64",
    }

    # Consecutive failed writes before a frozen entry is dropped (~2 seconds)
    _FREEZE_MAX_FAILURES = 10

    def _write_frozen(self, entries):
        # Runs in a worker thread under _scanmem_lock; entries is a snapshot
        # taken on the event loop so the dict can't change under us
        failed = []
        for address, entry in entries:
            ok = self.scanmem.exec_command(
                "write %s %s %s" % (entry["type"], address, entry["value"]))
            if not ok:
                failed.append(address)
        return failed

    async def _freeze_loop(self):
        logger.info("Freeze loop started")
        try:
            while self.frozen:
                if not self.is_scanning:
                    entries = list(self.frozen.items())
                    async with self._scanmem_lock:
                        failed = await asyncio.to_thread(self._write_frozen, entries)

                    for address, entry in entries:
                        # Skip entries unfrozen/replaced while we were writing
                        if self.frozen.get(address) is not entry:
                            continue
                        if address in failed:
                            entry["failures"] = entry.get("failures", 0) + 1
                            if entry["failures"] >= self._FREEZE_MAX_FAILURES:
                                logger.warning(
                                    "Freezing %s keeps failing, dropping it", address)
                                del self.frozen[address]
                                await self._emit("freeze_dropped", address)
                        else:
                            entry["failures"] = 0
                await asyncio.sleep(0.2)
        finally:
            logger.info("Freeze loop stopped")
            self._freeze_task = None

    # Continuously hold `address` at `value`, interpreting it as `value_type`
    # (one of the type names returned by get_matches).
    async def freeze(self, address, value, value_type):
        write_type = self._WRITE_TYPES.get(value_type)
        if write_type is None:
            logger.error("Cannot freeze unsupported type: %s", value_type)
            return False

        self.frozen[address] = {"value": str(value), "type": write_type}

        if self._freeze_task is None or self._freeze_task.done():
            self._freeze_task = asyncio.create_task(self._freeze_loop())

        return True

    async def unfreeze(self, address):
        self.frozen.pop(address, None)
        return True

    async def get_frozen(self):
        # Full entries so the frontend can render a standalone frozen panel
        return [
            {"address": address, "value": entry["value"], "value_type": entry["type"]}
            for address, entry in self.frozen.items()
        ]

async def main():
    # This is only executed when the plugin is run directly
    print("Slimmed down version of memory-editor for cli testing purposes")

    # Create an instance of the plugin
    plugin = Plugin()
    await plugin._main()
    pids = await plugin.get_processes()

    for pid in pids: print(pid)

    # Read PID from stdin
    print("Enter PID: ")
    selected_pid = int(input('> '))

    await plugin.attach(selected_pid, "Test")
    print("PID " + str(selected_pid) + " selected.")

    def help():
        print("########################################################################################################")
        print("Enter value to search for within PID, or enter one of the following commands: ")
        print("help")
        print("     prints this help menu")
        print("")
        print("type <ctype>")
        print("     example: type c_double")
        print("")
        print("setNewValue <newValue> [OPTIONAL* <memoryAddress>]")
        print("     Set a new value for a given memory address. If no memory address is provided, update all matches")
        print("")
        print("pid <newPID>")
        print("     attach to new PID")
        print("")
        print("list")
        print("     prints current matches")
        print("")
        print("set <arguments>")
        print("     set specific index to value")
        print("     example: write new value to match_index 1:")
        print("         set 1=999999")
        print("")        
        print("exit")
        print("     exits memory-deck cli")
        print("")
        print("reset")
        print("     resets current memory-deck cli progress")
        print("########################################################################################################")
        print("")

    help()

    matches = -1;

    # Until matches is exactly 1, request a new value
    while True:
        # Get the new value
        newValue = input("> ")

        if newValue == "exit":
            return

        if newValue == "reset":
            plugin.scanmem.reset()
            print("Scanmem has been reset.")
            help()
            continue

        if newValue == "list":
            # plugin.scanmem.exec_command("list")
            print(await plugin.get_match_list())
            continue

        if newValue.startswith("dump "):
            addressToDump = str(newValue.split(" ")[1])
            lengthToDump = str(newValue.split(" ")[2])
            plugin.scanmem.exec_command("dump " + addressToDump + " " + lengthToDump)
            continue

        if newValue == "help":
            help()
            continue

        if newValue.startswith("setNewValue "):
            newValueToSet = str(newValue.split(" ")[1])
            if len(newValue.split(' ')) < 3:
                print("updating all matches with new value")
                plugin.scanmem.exec_command("set " + newValueToSet)
            else:
                print('updating specified memory address with new value')
                mem_address = str(newValue.split(" ")[2])
                plugin.scanmem.exec_command("write i32 " + mem_address + " " + newValueToSet)
            print("New value set.")
            continue

        # If newValue starts with 'pid ' then we need to attach to a new process
        if newValue.startswith("pid "):
            selected_pid = int(newValue.split(" ")[1])
            await plugin.attach(selected_pid, "Test")
            help()
            continue
        
        if newValue.startswith("set "):
            print("Executing scanmem command - " + str(newValue))
            set_arguments = newValue.split("set ")[1]
            plugin.scanmem.exec_command("set " + str(set_arguments))
            continue

        if newValue.startswith("type "):
            plugin.search_type = newValue.split(" ")[1]
            print("Search type set to: "+ plugin.search_type)
            continue

        if plugin.search_type != "auto":
            matches = await plugin.search_regions(ScanMatchType.MATCH_EQUAL_TO, newValue, plugin.search_type)
        else:
            plugin.scanmem.exec_command("= " + newValue)
            matches = await plugin.get_num_matches()
            
        if matches < 50:
            matched_addresses = await plugin.get_matches()
            for matched_address in matched_addresses: print(matched_address)

        print("Finished")


if __name__ == "__main__":
    asyncio.run(main())
