import { Icons } from "../icons/Icons";

export function Modal({ title, onClose, children }) {
  return (
    <div
      className="ov"
      onClick={e => e.target.classList.contains("ov") && onClose()}
    >
      <div className="mod">
        <div className="mod-hd">
          <h3 className="mod-ti">{title}</h3>
          <button className="ic-btn" onClick={onClose}>
            <Icons.close />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
