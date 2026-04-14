import { useEffect } from "react";
import { Icons } from "../icons/Icons";

export function Toast({ msg, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`toast ${type}`}>
      {type === "ok" ? <Icons.check /> : <Icons.warn />} {msg}
    </div>
  );
}
