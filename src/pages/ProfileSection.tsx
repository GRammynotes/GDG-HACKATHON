import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import styles from "./dashboard.module.css";
import { doc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
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

    // Validate and fix targetDate if it's invalid (e.g., 1978)
    let targetDate = userData.targetDate || "";
    if (targetDate) {
      const date = new Date(targetDate);
      const currentYear = new Date().getFullYear();
      // If date is before 2000, it's likely invalid, reset it
      if (date.getFullYear() < 2000) {
        targetDate = "";
      }
    }

    // Get data from academicProfile if available
    const academicProfile = userData.academicProfile;
    let year = userData.year || "3rd Year";
    let semester = userData.semester || "Sem 5";
    let subjectsLabel = "3rd Year PCE subjects based on chosen department (Comps / IT)";
    let department = userData.department || "COMPS";

    if (academicProfile) {
      import("@/lib/subjectMapper").then(({ getYearLabel, getSemesterLabel }) => {
        year = getYearLabel(academicProfile.year);
        semester = getSemesterLabel(academicProfile.semester);
        subjectsLabel = academicProfile.subjects?.join(", ") || subjectsLabel;
        department = academicProfile.course === "btech-cse" ? "COMPS" : "IT";

        const updatedProfile: ProfileState = {
          name: userData.fullName || "",
          email: currentUser.email || "",
          department: department,
          year: year,
          semester: semester,
          subjectsLabel: subjectsLabel,
          targetDate: targetDate,
        };

        setFormData(updatedProfile);
        setState((prev: any) => ({
          ...prev,
          profile: updatedProfile,
        }));
      });
      return; // Exit early, will update in promise
    }

    const hydratedProfile: ProfileState = {
      name: userData.fullName || "",
      email: currentUser.email || "",
      department: department,
      year: year,
      semester: semester,
      subjectsLabel: subjectsLabel,
      targetDate: targetDate,
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
      // Cancel - reset to original state
      setFormData(state.profile);
    } else {
      // Start editing - populate form with current state
      setFormData(state.profile);
    }
    setEditing(!editing);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Validate target date (must be future date)
    if (formData.targetDate) {
      const targetDate = new Date(formData.targetDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);

      if (targetDate <= today) {
        toast.error("Target completion date must be in the future");
        return;
      }
    }

    try {
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
          updatedAt: new Date(),
        },
        { merge: true }
      );

      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile. Please try again.");
    }
  };

  const handleResetProgress = async () => {
    if (!confirm("This will reset all topic progress. Continue?")) return;
    if (!currentUser) return;

    try {
      // Reset local state
      setState((prev: any) => ({
        ...prev,
        subjects: prev.subjects.map((s: any) => ({
          ...s,
          topics: s.topics.map((t: any) => ({ ...t, completed: false })),
        })),
      }));

      // Reset in Firestore - delete all progress documents
      const progressCollection = collection(db, "users", currentUser.uid, "progress");
      const progressSnapshot = await getDocs(progressCollection);

      const deletePromises = progressSnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      toast.success("Progress reset successfully");
    } catch (error) {
      console.error("Error resetting progress:", error);
      toast.error("Failed to reset progress. Please try again.");
    }
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
          <h2 className="font-display">{formData.name || "Student"}</h2>
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
              value={
                formData.targetDate
                  ? (() => {
                    try {
                      const date = new Date(formData.targetDate);
                      if (isNaN(date.getTime()) || date.getFullYear() < 2000) return "";
                      return date.toISOString().split("T")[0];
                    } catch {
                      return "";
                    }
                  })()
                  : ""
              }
              onChange={(e) =>
                setFormData({ ...formData, targetDate: e.target.value })
              }
              disabled={!editing}
              min={new Date().toISOString().split("T")[0]}
            />
            {formData.targetDate && (() => {
              try {
                const date = new Date(formData.targetDate);
                if (isNaN(date.getTime()) || date.getFullYear() < 2000) return null;
                return (
                  <p className="text-xs text-muted-foreground mt-1">
                    {date.toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                );
              } catch {
                return null;
              }
            })()}
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
