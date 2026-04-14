import { useState } from "react";
import { Icons } from "../icons/Icons";

export function Slide({ title, onBack, action, children }) {
  const [ex, setEx] = useState(false);
  const back = () => {
    setEx(true);
    setTimeout(onBack, 270);
  };

  return (
    <div className={`sl${ex ? " exit" : ""}`}>
      <div className="sl-hd page-hd" style={{ marginBottom: 20 }}>
        <button className="page-bk" onClick={back} title="Go back">
          <Icons.back />
        </button>
        <span className="sl-ti" style={{ flex: 1 }}>{title}</span>
        {action}
      </div>
      <div className="sl-bd">{children}</div>
    </div>
  );
}
