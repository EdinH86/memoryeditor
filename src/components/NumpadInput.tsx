// Numeric / hexadecimal input pad for controller use.

import { useEffect, useState } from "react";
import { PanelSectionRow, gamepadDialogClasses, joinClassNames, DialogButton, Focusable } from "@decky/ui";

import { playSound } from "../util/util";

const FieldWithSeparator = joinClassNames(gamepadDialogClasses.Field, gamepadDialogClasses.WithBottomSeparatorStandard);

interface NumpadInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

const CLICK = "https://steamloopback.host/sounds/deck_ui_misc_10.wav";
const DENY = "https://steamloopback.host/sounds/deck_ui_default_activation.wav";

export const NumpadInput = (props: NumpadInputProps) => {
  const { label, value, onChange } = props;

  const [inputValue, setInputValue] = useState(value);
  const [hex, setHex] = useState(false);

  // Resync when the parent resets the value externally (e.g. Reset Search)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const commit = (next: string) => {
    setInputValue(next);
    onChange(next);
  };

  const enterDigit = (digit: string) => {
    // Only one decimal point, and no decimals in hex mode
    if (digit === "." && (hex || inputValue.includes("."))) {
      playSound(DENY);
      return;
    }
    playSound(CLICK);

    const negative = inputValue.startsWith("-");
    const body = negative ? inputValue.slice(1) : inputValue;

    let newBody: string;
    if (body === "0" && digit !== ".") {
      // Replace a leading solitary zero
      newBody = digit;
    } else if (body === "0x0") {
      newBody = "0x" + digit;
    } else {
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
    } else {
      // decimal -> hex: drop any fractional part, convert the integer
      const parsed = parseInt(body, 10);
      commit((negative ? "-" : "") + "0x" + (isNaN(parsed) ? "0" : parsed.toString(16)));
    }
    setHex(!hex);
  };

  const hexKeys = ["A", "B", "C", "D", "E", "F"];

  return (
    <>
      <PanelSectionRow>
        <div className={FieldWithSeparator}>
          <div className={gamepadDialogClasses.FieldLabelRow}>
            <div
              className={gamepadDialogClasses.FieldLabel}
              style={{ maxWidth: "50%", wordBreak: "keep-all" }}
            >
              {label}
            </div>
            <div
              className={gamepadDialogClasses.FieldChildrenInner}
              style={{ maxWidth: "50%", width: "100%", wordBreak: "break-all", textAlign: "end" }}
            >
              {inputValue}
            </div>
          </div>
        </div>
      </PanelSectionRow>

      {/* Override min-width for DialogButtons */}
      <style>{`
        .NumpadGrid button {
          min-width: 0 !important;
        }
      `}</style>

      {/* Digit grid: 3 columns, rows 1-3 digits, row 4 [± 0 .], row 5 backspace */}
      <Focusable className="NumpadGrid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridGap: "0.5rem", padding: "8px 0" }}>
        <DialogButton onClick={() => enterDigit("7")}>7</DialogButton>
        <DialogButton onClick={() => enterDigit("8")}>8</DialogButton>
        <DialogButton onClick={() => enterDigit("9")}>9</DialogButton>

        <DialogButton onClick={() => enterDigit("4")}>4</DialogButton>
        <DialogButton onClick={() => enterDigit("5")}>5</DialogButton>
        <DialogButton onClick={() => enterDigit("6")}>6</DialogButton>

        <DialogButton onClick={() => enterDigit("1")}>1</DialogButton>
        <DialogButton onClick={() => enterDigit("2")}>2</DialogButton>
        <DialogButton onClick={() => enterDigit("3")}>3</DialogButton>

        <DialogButton onClick={() => toggleSign()}>&plusmn;</DialogButton>
        <DialogButton onClick={() => enterDigit("0")}>0</DialogButton>
        <DialogButton onClick={() => enterDigit(".")} disabled={hex}>.</DialogButton>

        {/* A-F keys, only usable in hex mode */}
        {hex && hexKeys.map((k) => (
          <DialogButton key={k} onClick={() => enterDigit(k)}>{k}</DialogButton>
        ))}

        <DialogButton onClick={() => backspace()} style={{ gridColumn: "1 / span 2" }}>
          &larr;
        </DialogButton>
        <DialogButton onClick={() => toggleHex()}>{hex ? "hex" : "dec"}</DialogButton>
      </Focusable>
    </>
  );
};
