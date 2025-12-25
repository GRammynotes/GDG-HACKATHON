import { motion } from 'framer-motion';

interface SummaryPanelProps {
    course: string;
    year: string;
    semester: string;
    aimTitle: string;
    aimRange: string;
    subjects: string[];
}

const SummaryPanel = ({ course, year, semester, aimTitle, aimRange, subjects }: SummaryPanelProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-5 sm:p-6"
        >
            <h2 className="section-title">Landing snapshot</h2>
            <p className="section-subtitle">
                This is exactly what will be stored in your profile and used to seed the AI planner.
            </p>

            <div className="mt-5 space-y-3 rounded-xl border border-border/40 bg-background/40 p-4 text-sm">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Course</span>
                    <span className="font-medium text-foreground">{course}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Year / Semester</span>
                    <span className="font-medium text-foreground">
                        {year} · {semester}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">AIM Level</span>
                    <span className="font-medium text-primary">
                        {aimTitle} <span className="text-xs text-muted-foreground">({aimRange})</span>
                    </span>
                </div>
                <div>
                    <span className="text-muted-foreground">Subjects</span>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {subjects.length > 0 ? (
                            subjects.map((subj) => (
                                <span
                                    key={subj}
                                    className="inline-flex items-center rounded-full bg-secondary/80 px-2.5 py-1 text-[11px] font-medium text-foreground"
                                >
                                    {subj}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-muted-foreground">
                                Configure subjects for this combination.
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <p className="mt-4 text-[11px] text-muted-foreground">
                Next screens in the flow will read this payload to auto-filter study material, generate
                quizzes and drive the prediction engine.
            </p>
        </motion.div>
    );
};

export default SummaryPanel;
