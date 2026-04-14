import { useState, useEffect } from "react";
import { Slide } from "../../components/common/Slide";
import { Icons } from "../../components/icons/Icons";
import { getMeds, saveMeds } from "../../services/storage";
import { apiFetch } from "../../services/api";
import { mapMed } from "../../utils/mappers";
import { MedList } from "../medicines/MedList";

export function ExpirySlide({ userId, onBack }) {
  const [meds, setMeds] = useState(() => getMeds(userId));

  useEffect(() => {
    apiFetch(`/medicines.php?patient_id=${userId}`)
      .then(data => {
        const mapped = data.map(mapMed);
        setMeds(mapped);
        saveMeds(userId, mapped);
      })
      .catch(() => { });
  }, [userId]);

  const expired = meds.filter(m => m.expiry && new Date(m.expiry) < new Date());
  const expiring = meds.filter(m => { if (!m.expiry) return false; const d = (new Date(m.expiry) - new Date()) / 86400000; return d >= 0 && d < 30; });
  const [filter, setFilter] = useState(expired.length > 0 ? "expired" : "expiring");
  const list = filter === "expired" ? expired : expiring;
  return (
    <Slide title="Expiry Status" onBack={onBack}>
      <div className="etabs">
        <button
          className={`etab${filter === "expired" ? " a-red" : ""}`}
          onClick={() => setFilter("expired")}>
          Expired ({expired.length})
        </button>
        <button
          className={`etab${filter === "expiring" ? " a-amb" : ""}`}
          onClick={() => setFilter("expiring")}>
          Expiring Soon ({expiring.length})
        </button>
      </div>
      {list.length === 0 ? (
        <div className="empty">
          <Icons.check />
          <p>No medicines in this category.</p>
        </div>
      ) : (
        <MedList meds={list} showActions={false} />
      )}
    </Slide>
  );
}
