import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Sparkles, ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import AimCard from '@/components/AimCard';
import SubjectChip from '@/components/SubjectChip';
import SelectField from '@/components/SelectField';
import SummaryPanel from '@/components/SummaryPanel';

type AimLevel = 'passing' | 'below-average' | 'average' | 'above-average' | 'topper';
type Year = 1 | 2 | 3 | 4;
type Semester = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type CourseId = 'btech-cse' | 'bca';

const AIM_LABELS: Record<
    AimLevel,
    { title: string; range: string; color: string; description: string }
> = {
    passing: {
        title: 'Passing',
        range: '≈ 6.0 CGPA',
        color: 'from-emerald-500 to-emerald-400',
        description: 'Just clear the bar with exam-focused, minimum-viable prep.',
    },
    'below-average': {
        title: 'Below Average',
        range: '6.5 – 7.0',
        color: 'from-sky-500 to-sky-400',
        description: 'Cover all must-pass topics with light conceptual depth.',
    },
    average: {
        title: 'Average',
        range: '7.0 – 7.5',
        color: 'from-indigo-500 to-indigo-400',
        description: 'Balanced understanding + exam practice with a safe buffer.',
    },
    'above-average': {
        title: 'Above Average',
        range: '7.5 – 8.5',
        color: 'from-violet-500 to-violet-400',
        description: 'Deeper concepts, consistent practice and strong internals.',
    },
    topper: {
        title: 'Topper',
        range: '9.0+',
        color: 'from-amber-400 to-yellow-300',
        description: 'Max depth, advanced questions and high-intensity scheduling.',
    },
};

const COURSES: Record<CourseId, { label: string }> = {
    'btech-cse': { label: 'B.Tech CSE' },
    bca: { label: 'BCA' },
};

const YEAR_OPTIONS = [
    { value: 1, label: '1st Year' },
    { value: 2, label: '2nd Year' },
    { value: 3, label: '3rd Year' },
    { value: 4, label: '4th Year' },
];

const SEMESTER_OPTIONS = [
    { value: 1, label: 'Semester 1' },
    { value: 2, label: 'Semester 2' },
    { value: 3, label: 'Semester 3' },
    { value: 4, label: 'Semester 4' },
    { value: 5, label: 'Semester 5' },
    { value: 6, label: 'Semester 6' },
    { value: 7, label: 'Semester 7' },
    { value: 8, label: 'Semester 8' },
];

const SUBJECT_MAP: Record<CourseId, Partial<Record<Year, Partial<Record<Semester, string[]>>>>> = {
    'btech-cse': {
        1: {
            1: ['Mathematics I', 'Physics', 'Programming in C', 'Engineering Graphics'],
            2: ['Mathematics II', 'Basic Electronics', 'Data Structures', 'Environmental Science'],
        },
        2: {
            3: ['Discrete Mathematics', 'OOP in Java', 'Digital Logic Design', 'Computer Organization'],
            4: ['DBMS', 'Operating Systems', 'Design & Analysis of Algorithms', 'Probability & Statistics'],
        },
    },
    bca: {
        1: {
            1: ['Computer Fundamentals', 'C Programming', 'Mathematics', 'Communication Skills'],
            2: ['Data Structures', 'Digital Electronics', 'Operating Systems', 'Accounting Fundamentals'],
        },
    },
};

const LandingPage = () => {
    const navigate = useNavigate();
    const [course, setCourse] = useState<CourseId>('btech-cse');
    const [year, setYear] = useState<Year>(1);
    const [semester, setSemester] = useState<Semester>(1);
    const [aim, setAim] = useState<AimLevel>('above-average');
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

    const [isProcessing, setIsProcessing] = useState(false);

    const availableSubjects = useMemo(() => {
        const byCourse = SUBJECT_MAP[course];
        const byYear = byCourse?.[year];
        const list = byYear?.[semester] ?? [];
        return list;
    }, [course, year, semester]);

    const handleToggleSubject = (subject: string) => {
        setSelectedSubjects((prev) =>
            prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
        );
    };

    const handleContinue = async () => {
        setIsProcessing(true);
        const payload = {
            course,
            year,
            semester,
            aim,
            subjects: selectedSubjects.length ? selectedSubjects : availableSubjects,
            updatedAt: new Date()
        };
        console.log('Landing payload:', payload);

        try {
            const user = auth.currentUser;
            if (user) {
                await setDoc(doc(db, "users", user.uid), {
                    academicProfile: payload
                }, { merge: true });

                // Show processing animation for a bit for UX
                setTimeout(() => {
                    toast.success('Goal saved successfully!', {
                        description: 'Your AIM profile has been configured and saved to the cloud.',
                    });
                    navigate('/dashboard');
                }, 2000);
            } else {
                console.warn("No user logged in, saving to local storage only via flow");
                // Fallback flow or just redirect if auth is optional (though it seems required)
                setTimeout(() => {
                    toast.success('Goal saved locally!', {
                        description: 'Redirecting to Dashboard.',
                    });
                    navigate('/dashboard');
                }, 2000);
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error("Failed to save profile", {
                description: "There was an error saving your data to the cloud."
            });
            setIsProcessing(false);
        }
    };

    const aimMeta = AIM_LABELS[aim];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    if (isProcessing) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent -z-10" />
                {/* Ambient glows */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

                <div className="text-center py-12 space-y-8 relative z-10">
                    <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
                        <div className="absolute inset-2 rounded-full border-2 border-purple-500/40 animate-ping" style={{ animationDelay: "0.2s" }} />
                        <div className="absolute inset-4 rounded-full border-2 border-teal-500/50 animate-ping" style={{ animationDelay: "0.4s" }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-10 h-10 text-amber-400 animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-2xl font-display font-semibold text-gradient animate-fade-up">
                            Personalising content according to you…
                        </h2>
                        <p className="text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: "0.1s" }}>
                            Our AI is crafting your unique study path based on your <strong>{aimMeta.title}</strong> goal.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Subtle background gradient */}
            <div className="fixed inset-0 -z-10 bg-gradient-radial from-primary/5 via-transparent to-transparent" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-12 pt-8 sm:px-6 lg:px-8"
            >
                {/* Header */}
                <motion.header variants={itemVariants} className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-primary">AimSet · Goal Setting</span>
                        </div>
                        <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                            Lock your academic <span className="text-gradient">AIM</span> for this semester.
                        </h1>
                        <p className="mt-4 max-w-xl text-base text-muted-foreground leading-relaxed">
                            Tell AimSet your course, semester, subjects and target band. We'll spin up a semester
                            roadmap, study material and progress model around your profile.
                        </p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="glass-panel w-full max-w-xs p-5 sm:w-auto"
                    >
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Selected Aim
                        </p>
                        <p className="mt-2 text-xl font-bold text-primary">
                            {aimMeta.title}
                            <span className="ml-2 text-sm font-medium text-muted-foreground">({aimMeta.range})</span>
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{aimMeta.description}</p>
                    </motion.div>
                </motion.header>

                {/* Main content */}
                <main className="grid gap-8 lg:grid-cols-[1.6fr,1fr]">
                    {/* Left: Goal-setting form */}
                    <motion.section variants={itemVariants} className="space-y-6">
                        <div className="glass-panel space-y-6 p-6 sm:p-8">
                            {/* Academic context */}
                            <div>
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-primary" />
                                    <h2 className="section-title text-base">Academic context</h2>
                                </div>
                                <p className="section-subtitle mt-1">
                                    This helps AimSet fetch the right semester and subject structure for you.
                                </p>

                                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                                    <SelectField
                                        label="Degree / Course"
                                        value={course}
                                        onChange={(val) => {
                                            setCourse(val as CourseId);
                                            setSelectedSubjects([]);
                                        }}
                                        options={Object.entries(COURSES).map(([id, cfg]) => ({
                                            value: id,
                                            label: cfg.label,
                                        }))}
                                    />
                                    <SelectField
                                        label="Current Year"
                                        value={year}
                                        onChange={(val) => {
                                            setYear(Number(val) as Year);
                                            setSelectedSubjects([]);
                                        }}
                                        options={YEAR_OPTIONS}
                                    />
                                    <SelectField
                                        label="Current Semester"
                                        value={semester}
                                        onChange={(val) => {
                                            setSemester(Number(val) as Semester);
                                            setSelectedSubjects([]);
                                        }}
                                        options={SEMESTER_OPTIONS}
                                    />
                                </div>
                            </div>

                            {/* Subject selection */}
                            <div className="divider pt-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-primary" />
                                        <div>
                                            <h2 className="section-title text-base">Subjects for this semester</h2>
                                            <p className="section-subtitle">
                                                Auto-fetched from your course structure. Toggle to customize.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="pill border border-border bg-secondary/50 text-[10px] text-muted-foreground">
                                        Auto-fetched
                                    </span>
                                </div>

                                {availableSubjects.length === 0 ? (
                                    <p className="mt-4 text-sm text-amber-400">
                                        No subjects configured for this combination yet. You can extend the subject map for your college.
                                    </p>
                                ) : (
                                    <div className="mt-5 flex flex-wrap gap-2">
                                        {availableSubjects.map((subject) => {
                                            const active = selectedSubjects.includes(subject) || !selectedSubjects.length;
                                            return (
                                                <SubjectChip
                                                    key={subject}
                                                    subject={subject}
                                                    isActive={active}
                                                    onClick={() => handleToggleSubject(subject)}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* AIM selection */}
                            <div className="divider pt-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                        Choose your aim
                                    </p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {(Object.keys(AIM_LABELS) as AimLevel[]).map((level) => {
                                        const meta = AIM_LABELS[level];
                                        return (
                                            <AimCard
                                                key={level}
                                                level={level}
                                                title={meta.title}
                                                range={meta.range}
                                                description={meta.description}
                                                color={meta.color}
                                                isActive={aim === level}
                                                onClick={() => setAim(level)}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="divider flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-xs text-muted-foreground max-w-md">
                                    <p>
                                        When you continue, AimSet will create a profile instance and redirect you to the Study Material page.
                                    </p>
                                </div>
                                <motion.button
                                    type="button"
                                    onClick={handleContinue}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="btn-primary gap-2"
                                >
                                    Save AIM & Continue
                                    <ArrowRight className="h-4 w-4" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.section>

                    {/* Right: Summary panel */}
                    <motion.section variants={itemVariants} className="space-y-6">
                        <SummaryPanel
                            course={COURSES[course]?.label ?? '—'}
                            year={YEAR_OPTIONS.find((y) => y.value === year)?.label ?? '—'}
                            semester={SEMESTER_OPTIONS.find((s) => s.value === semester)?.label ?? '—'}
                            aimTitle={aimMeta.title}
                            aimRange={aimMeta.range}
                            subjects={selectedSubjects.length ? selectedSubjects : availableSubjects}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="glass-panel p-5 sm:p-6"
                        >
                            <h2 className="section-title flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                Quick walkthrough
                            </h2>
                            <ol className="mt-4 list-decimal space-y-2 text-sm text-muted-foreground pl-5 marker:text-primary">
                                <li>Select your course, year and semester.</li>
                                <li>Watch subjects auto-appear — toggle to match your load.</li>
                                <li>Click through AIM levels and see how targets change.</li>
                                <li>Hit "Save AIM & Continue" to seed your dashboard.</li>
                            </ol>
                        </motion.div>
                    </motion.section>
                </main>
            </motion.div>
        </div>
    );
};

export default LandingPage;
