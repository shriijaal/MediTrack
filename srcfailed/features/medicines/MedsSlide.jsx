import { useState, useEffect } from "react";
import { Slide } from "../../components/common/Slide";
import { Modal } from "../../components/common/Modal";
import { Icons } from "../../components/icons/Icons";
import { getMeds, saveMeds } from "../../services/storage";
import { apiFetch } from "../../services/api";
import { mapMed } from "../../utils/mappers";
import { uid } from "../../utils/constants";
import { MedForm } from "./MedForm";
import { MedList } from "./MedList";
import { ConfirmDel } from "./ConfirmDel";

export function MedsSlide({ userId, toast, onBack, caretakerPatientId }) {
  const writeId = caretakerPatientId || userId;
  const patientQs = caretakerPatientId ? `?patient_id=${caretakerPatientId}` : "";

  const [meds, setMeds] = useState(() => getMeds(writeId));
  const [modal, setM] = useState(null);

  // Try to load from backend, fall back to localStorage
  const loadMeds = async () => {
    try {
      const data = await apiFetch(`/medicines.php${patientQs}`);
      const mapped = data.map(mapMed);
      setMeds(mapped);
      saveMeds(writeId, mapped);
    } catch { /* backend offline — already loaded from localStorage */ }
  };

  useEffect(() => { loadMeds(); }, [writeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save to backend + localStorage
  const apiSave = async (method, body, medId) => {
    const qs = medId ? `?id=${medId}${caretakerPatientId ? `&patient_id=${caretakerPatientId}` : ""}` : patientQs;
    const payload = caretakerPatientId ? { ...body, patient_id: caretakerPatientId } : body;
    try {
      await apiFetch(`/medicines.php${qs}`, { method, body: JSON.stringify(payload) });
      return true;
    } catch (e) {
      console.warn("Medicine API save failed:", e.message);
      return false;
    }
  };

  const add = async f => {
    const newMed = { ...f, id: uid(), createdAt: Date.now() };
    const updated = [...meds, newMed];
    setMeds(updated); saveMeds(writeId, updated);
    setM(null);
    const saved = await apiSave("POST", f);
    toast(saved ? "Added!" : "Added locally (offline)", saved ? "ok" : "warn");
    if (saved) await loadMeds();
  };

  const edit = async f => {
    const medId = modal.data.id;
    const updated = meds.map(m => m.id === medId ? { ...m, ...f } : m);
    setMeds(updated); saveMeds(writeId, updated);
    setM(null); toast("Updated!", "ok");
    await apiSave("PUT", f, medId);
  };

  const del = async () => {
    const medId = modal.data.id;
    const updated = meds.filter(m => m.id !== medId);
    setMeds(updated); saveMeds(writeId, updated);
    setM(null); toast("Removed.", "ok");
    try {
      const qs = `?id=${medId}${caretakerPatientId ? `&patient_id=${caretakerPatientId}` : ""}`;
      await apiFetch(`/medicines.php${qs}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Medicine delete API failed:", e.message);
    }
  };

  return (
    <Slide title="All Medicines" onBack={onBack}
      action={<button className="btn btn-p btn-sm" style={{ width: "auto" }} onClick={() => setM({ type: "add" })}><Icons.plus /> Add</button>}>
      <MedList meds={meds} showActions onEdit={m => setM({ type: "edit", data: m })} onDelete={m => setM({ type: "del", data: m })} />
      {modal?.type === "add" && <Modal title="Add Medicine" onClose={() => setM(null)}><MedForm onSave={add} onClose={() => setM(null)} /></Modal>}
      {modal?.type === "edit" && <Modal title="Edit Medicine" onClose={() => setM(null)}><MedForm initial={modal.data} onSave={edit} onClose={() => setM(null)} /></Modal>}
      {modal?.type === "del" && <ConfirmDel name={modal.data.name} onConfirm={del} onClose={() => setM(null)} />}
    </Slide>
  );
}

