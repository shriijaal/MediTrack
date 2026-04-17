import { Modal } from "../../components/common/Modal";

export function ConfirmDel({ name, onConfirm, onClose }) {
  return (
    <Modal title="Remove Medicine" onClose={onClose}>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--t2)" }}>
        Remove <strong>{name}</strong>?
      </p>
      <div className="mod-ac">
        <button className="btn btn-o" onClick={onClose}>Cancel</button>
        <button className="btn btn-d" onClick={onConfirm}>Remove</button>
      </div>
    </Modal>
  );
}
