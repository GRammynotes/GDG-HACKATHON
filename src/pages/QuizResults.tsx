import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, Trophy, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const QuizResults = () => {
    const { subjectId } = useParams<{ subjectId: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [quizResult, setQuizResult] = useState<any>(null);

    useEffect(() => {
        if (!currentUser || !subjectId) {
            navigate("/dashboard");
            return;
        }

        const loadQuizResult = async () => {
            try {
                const resultDoc = await getDoc(doc(db, "users", currentUser.uid, "quizResults", subjectId));

                if (resultDoc.exists()) {
                    setQuizResult(resultDoc.data());
                } else {
                    toast.error("Quiz result not found");
                    navigate("/dashboard");
                }
            } catch (error) {
                console.error("Error loading quiz result:", error);
                toast.error("Failed to load quiz result");
                navigate("/dashboard");
            } finally {
                setLoading(false);
            }
        };

        loadQuizResult();
    }, [currentUser, subjectId, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!quizResult) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">Quiz result not found</p>
                        <Button onClick={() => navigate("/dashboard")} className="mt-4">
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const percentage = quizResult.percentage || 0;
    const score = quizResult.score || 0;
    const totalQuestions = quizResult.totalQuestions || 0;
    const timeStarted = quizResult.timeStarted?.toDate?.() || new Date(quizResult.timeStarted);
    const timeCompleted = quizResult.timeCompleted?.toDate?.() || new Date(quizResult.timeCompleted);
    const timeSpent = Math.round((timeCompleted.getTime() - timeStarted.getTime()) / 1000 / 60); // minutes

    const getScoreColor = () => {
        if (percentage >= 80) return "text-green-500";
        if (percentage >= 60) return "text-yellow-500";
        return "text-red-500";
    };

    const getScoreBadge = () => {
        if (percentage >= 90) return { label: "Excellent", variant: "default" as const, color: "bg-green-500" };
        if (percentage >= 80) return { label: "Great", variant: "default" as const, color: "bg-blue-500" };
        if (percentage >= 70) return { label: "Good", variant: "default" as const, color: "bg-yellow-500" };
        if (percentage >= 60) return { label: "Average", variant: "default" as const, color: "bg-orange-500" };
        return { label: "Needs Improvement", variant: "destructive" as const, color: "bg-red-500" };
    };

    const scoreBadge = getScoreBadge();

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-display font-bold">Quiz Results</h1>
                        <p className="text-muted-foreground mt-1">{quizResult.subjectName}</p>
                    </div>
                </div>

                {/* Score Summary */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Your Score</span>
                            <Badge className={scoreBadge.color} variant={scoreBadge.variant}>
                                {scoreBadge.label}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-6">
                            <div className={`text-6xl font-bold mb-2 ${getScoreColor()}`}>
                                {percentage}%
                            </div>
                            <div className="text-2xl text-muted-foreground mb-4">
                                {score} / {totalQuestions} Correct
                            </div>
                            <Progress value={percentage} className="h-3 mb-4" />
                            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>Time: {timeSpent} minutes</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Trophy className="h-4 w-4" />
                                    <span>Completed: {timeCompleted.toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Performance Breakdown</CardTitle>
                        <CardDescription>Detailed analysis of your quiz attempt</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 border rounded-lg text-center">
                                <div className="text-2xl font-bold text-green-500">{score}</div>
                                <div className="text-sm text-muted-foreground">Correct</div>
                            </div>
                            <div className="p-4 border rounded-lg text-center">
                                <div className="text-2xl font-bold text-red-500">{totalQuestions - score}</div>
                                <div className="text-sm text-muted-foreground">Incorrect</div>
                            </div>
                            <div className="p-4 border rounded-lg text-center">
                                <div className="text-2xl font-bold">{totalQuestions}</div>
                                <div className="text-sm text-muted-foreground">Total Questions</div>
                            </div>
                            <div className="p-4 border rounded-lg text-center">
                                <div className="text-2xl font-bold">{timeSpent}</div>
                                <div className="text-sm text-muted-foreground">Minutes</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-4 mt-6">
                    <Button
                        onClick={() => navigate(`/subject/${encodeURIComponent(quizResult.subjectName)}`)}
                        variant="outline"
                        className="flex-1"
                    >
                        Review Study Materials
                    </Button>
                    <Button
                        onClick={() => navigate("/dashboard")}
                        className="flex-1"
                    >
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default QuizResults;

