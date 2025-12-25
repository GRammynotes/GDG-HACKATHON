import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import styles from "./dashboard.module.css";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ProfileState {
  name: string;
  email: string;
  department: string;
  year: string;
  semester: string;
  subjectsLabel: string;
  targetDate: string;
}

interface ProfileSectionProps {
  state: {
    profile: ProfileState;
    subjects: any[];
  };
  setState: React.Dispatch<React.SetStateAction<any>>;
}

const ProfileSection = ({ state, setState }: ProfileSectionProps) => {
  const { currentUser, userData } = useAuth();

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileState>({
    name: "",
    email: "",
    department: "",
    year: "",
    semester: "",
    subjectsLabel: "",
    targetDate: "",
  });

  /* 🔹 Hydrate profile from Firestore when user loads */
  useEffect(() => {
    if (!currentUser || !userData) return;

    const hydratedProfile: ProfileState = {
      name: userData.fullName || "",
      email: currentUser.email || "",
      department: userData.department || "COMPS",
      year: userData.year || "3rd Year",
      semester: userData.semester || "Sem 5",
      subjectsLabel:
        "3rd Year PCE subjects based on chosen department (Comps / IT)",
      targetDate: userData.targetDate || "",
    };

    setFormData(hydratedProfile);

    // Keep dashboard state in sync
    setState((prev: any) => ({
      ...prev,
      profile: hydratedProfile,
    }));
  }, [currentUser, userData, setState]);

  const handleEdit = () => {
    if (editing) {
      setFormData(state.profile);
    }
    setEditing(!editing);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Update local dashboard state
    setState((prev: any) => ({
      ...prev,
      profile: formData,
    }));

    // Persist to Firestore
    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        fullName: formData.name,
        department: formData.department,
        year: formData.year,
        semester: formData.semester,
        targetDate: formData.targetDate,
      },
      { merge: true }
    );

    setEditing(false);
  };

  const handleResetProgress = () => {
    if (!confirm("This will reset all topic progress. Continue?")) return;

    setState((prev: any) => ({
      ...prev,
      subjects: prev.subjects.map((s: any) => ({
        ...s,
        topics: s.topics.map((t: any) => ({ ...t, completed: false })),
      })),
    }));
  };

  const initial =
    (formData.name || currentUser?.email || "S")
      .trim()
      .charAt(0)
      .toUpperCase() || "S";

  return (
    <>
      <div className={styles.profileHeader}>
        <div className={styles.avatar}>{initial}</div>
        <div>
          <h2>{formData.name || "Student"}</h2>
          <p className={styles.muted}>{formData.email}</p>
          <span className={styles.pill}>
            {formData.year} • {formData.semester}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className={styles.profileForm}>
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>Name</label>
            <input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={!editing}
            />
          </div>

          <div className={styles.formField}>
            <label>Email (fixed)</label>
            <input value={formData.email} disabled />
          </div>
        </div>

        <div className={`${styles.formRow} ${styles.formRowThree}`}>
          <div className={styles.formField}>
            <label>Department</label>
            <select
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
              disabled={!editing}
            >
              <option value="COMPS">Computer Engineering</option>
              <option value="IT">Information Technology</option>
            </select>
          </div>

          <div className={styles.formField}>
            <label>Academic Year</label>
            <select
              value={formData.year}
              onChange={(e) =>
                setFormData({ ...formData, year: e.target.value })
              }
              disabled={!editing}
            >
              <option value="3rd Year">3rd Year</option>
            </select>
          </div>

          <div className={styles.formField}>
            <label>Semester</label>
            <select
              value={formData.semester}
              onChange={(e) =>
                setFormData({ ...formData, semester: e.target.value })
              }
              disabled={!editing}
            >
              <option value="Sem 5">Sem 5</option>
              <option value="Sem 6">Sem 6</option>
            </select>
          </div>
        </div>

        <div className={styles.formField}>
          <label>Selected Subjects</label>
          <textarea value={formData.subjectsLabel} disabled rows={2} />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>Target Completion Date</label>
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) =>
                setFormData({ ...formData, targetDate: e.target.value })
              }
              disabled={!editing}
            />
          </div>
        </div>

        <div className={styles.profileActions}>
          <button
            type="button"
            onClick={handleEdit}
            className={`${styles.btn} ${styles.secondary}`}
          >
            {editing ? "Cancel" : "Edit"}
          </button>

          <button
            type="submit"
            disabled={!editing}
            className={`${styles.btn} ${styles.primary}`}
          >
            Save Changes
          </button>

          <button
            type="button"
            onClick={handleResetProgress}
            className={`${styles.btn} ${styles.danger} ${styles.ghost}`}
          >
            Reset Progress
          </button>
        </div>
      </form>
    </>
  );
};

export default ProfileSection;
