import { useState, useEffect } from "react";
import { X, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateQuiz, QuizQuestion } from "@/lib/gemini";
import { toast } from "sonner";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface QuizModalProps {
  open: boolean;
  onClose: () => void;
  subjectId: string;
  subjectName: string;
  topics: string[];
}

interface QuizState {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  selectedAnswers: (number | null)[];
  showResults: boolean;
  score: number;
  timeStarted: Date;
  timeCompleted?: Date;
}

export default function QuizModal({
  open,
  onClose,
  subjectId,
  subjectName,
  topics,
}: QuizModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizState, setQuizState] = useState<QuizState | null>(null);

  // Load or generate quiz when modal opens
  useEffect(() => {
    if (!open || !subjectId) return;

    const loadQuiz = async () => {
      setLoading(true);
      setError(null);

      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error("User not authenticated");
        }

        // Check if quiz exists in Firestore (using user subcollection for better security)
        const quizDocRef = doc(db, "users", user.uid, "quizzes", subjectId);
        let quizDoc;
        let questions: QuizQuestion[];

        try {
          quizDoc = await getDoc(quizDocRef);
        } catch (firestoreError) {
          console.warn("Firestore read failed, will generate new quiz:", firestoreError);
          quizDoc = null;
        }

        if (quizDoc?.exists() && quizDoc.data().questions) {
          // Use existing quiz
          questions = quizDoc.data().questions;
          toast.success("Loaded saved quiz");
        } else {
          // Generate new quiz
          toast.loading("Generating quiz with AI...", { id: "quiz-gen" });
          const quizData = await generateQuiz(subjectName, topics);
          questions = quizData.questions;

          // Try to save to Firestore (non-blocking)
          try {
            await setDoc(quizDocRef, {
              subjectId,
              subjectName,
              topics,
              questions,
              generatedAt: quizData.generatedAt,
              userId: user.uid,
              createdAt: new Date(),
            }, { merge: true });
          } catch (saveError) {
            console.warn("Failed to save quiz to Firestore (continuing anyway):", saveError);
            // Continue even if save fails - quiz is still usable
          }

          toast.success("Quiz generated successfully!", { id: "quiz-gen" });
        }

        setQuizState({
          questions,
          currentQuestionIndex: 0,
          selectedAnswers: new Array(questions.length).fill(null),
          showResults: false,
          score: 0,
          timeStarted: new Date(),
        });
      } catch (err: any) {
        console.error("Error loading quiz:", err);
        setError(err.message || "Failed to load quiz. Please try again.");
        toast.error("Failed to load quiz", {
          description: err.message || "Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [open, subjectId, subjectName, topics]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (!quizState || quizState.showResults) return;

    setQuizState((prev) => {
      if (!prev) return prev;
      const newAnswers = [...prev.selectedAnswers];
      newAnswers[prev.currentQuestionIndex] = answerIndex;
      return { ...prev, selectedAnswers: newAnswers };
    });
  };

  const handleNext = () => {
    if (!quizState) return;

    if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
      setQuizState({
        ...quizState,
        currentQuestionIndex: quizState.currentQuestionIndex + 1,
      });
    }
  };

  const handlePrevious = () => {
    if (!quizState) return;

    if (quizState.currentQuestionIndex > 0) {
      setQuizState({
        ...quizState,
        currentQuestionIndex: quizState.currentQuestionIndex - 1,
      });
    }
  };

  const handleSubmit = async () => {
    if (!quizState) return;

    // Calculate score
    let score = 0;
    quizState.questions.forEach((q, index) => {
      if (quizState.selectedAnswers[index] === q.correctAnswer) {
        score++;
      }
    });

    const percentage = Math.round((score / quizState.questions.length) * 100);
    const timeCompleted = new Date();

    setQuizState({
      ...quizState,
      showResults: true,
      score,
      timeCompleted,
    });

    // Save quiz results to Firestore
    try {
      const user = auth.currentUser;
      if (user) {
        await setDoc(
          doc(db, "users", user.uid, "quizResults", subjectId),
          {
            subjectId,
            subjectName,
            score,
            totalQuestions: quizState.questions.length,
            percentage,
            answers: quizState.selectedAnswers,
            timeStarted: quizState.timeStarted,
            timeCompleted,
            completedAt: new Date(),
          },
          { merge: true }
        );

        // Update user progress
        await setDoc(
          doc(db, "users", user.uid, "quizzes", subjectId),
          {
            subjectId,
            subjectName,
            lastScore: percentage,
            lastAttempt: timeCompleted,
            status: "completed",
          },
          { merge: true }
        );
      }

      toast.success("Quiz completed!", {
        description: `You scored ${score}/${quizState.questions.length} (${percentage}%)`,
      });
    } catch (error) {
      console.error("Error saving quiz results:", error);
    }
  };

  const handleClose = () => {
    if (quizState && !quizState.showResults) {
      if (!confirm("Are you sure you want to close? Your progress will be saved.")) {
        return;
      }
    }
    setQuizState(null);
    setError(null);
    onClose();
  };

  if (!open) return null;

  const currentQuestion = quizState?.questions[quizState.currentQuestionIndex];
  const progress = quizState
    ? ((quizState.currentQuestionIndex + 1) / quizState.questions.length) * 100
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Quiz: {subjectName}</span>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Generating quiz questions...</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {quizState && !loading && !error && (
          <>
            {!quizState.showResults ? (
              <>
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      Question {quizState.currentQuestionIndex + 1} of {quizState.questions.length}
                    </span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>

                {/* Question Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {currentQuestion?.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={
                        quizState.selectedAnswers[quizState.currentQuestionIndex] !== null
                          ? String(quizState.selectedAnswers[quizState.currentQuestionIndex])
                          : undefined
                      }
                      onValueChange={(value) => handleAnswerSelect(parseInt(value))}
                    >
                      {currentQuestion?.options.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                        >
                          <RadioGroupItem value={String(index)} id={`option-${index}`} />
                          <Label
                            htmlFor={`option-${index}`}
                            className="flex-1 cursor-pointer"
                          >
                            {String.fromCharCode(65 + index)}. {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={quizState.currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>
                  <div className="flex gap-2">
                    {quizState.currentQuestionIndex === quizState.questions.length - 1 ? (
                      <Button
                        onClick={handleSubmit}
                        disabled={quizState.selectedAnswers[quizState.currentQuestionIndex] === null}
                      >
                        Submit Quiz
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNext}
                        disabled={quizState.selectedAnswers[quizState.currentQuestionIndex] === null}
                      >
                        Next
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Results View */
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl text-center">
                      Quiz Results
                    </CardTitle>
                    <CardDescription className="text-center">
                      {subjectName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <div className="text-5xl font-bold text-primary mb-2">
                        {quizState.score}/{quizState.questions.length}
                      </div>
                      <div className="text-2xl text-muted-foreground">
                        {Math.round((quizState.score / quizState.questions.length) * 100)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Question Review */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Question Review</h3>
                  {quizState.questions.map((question, qIndex) => {
                    const selectedAnswer = quizState.selectedAnswers[qIndex];
                    const isCorrect = selectedAnswer === question.correctAnswer;

                    return (
                      <Card key={qIndex}>
                        <CardHeader>
                          <div className="flex items-start gap-2">
                            {isCorrect ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                            )}
                            <CardTitle className="text-base">
                              Question {qIndex + 1}: {question.question}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {question.options.map((option, oIndex) => {
                            const isSelected = selectedAnswer === oIndex;
                            const isCorrectOption = oIndex === question.correctAnswer;

                            return (
                              <div
                                key={oIndex}
                                className={`p-2 rounded ${isCorrectOption
                                  ? "bg-green-100 dark:bg-green-900/20 border-green-500"
                                  : isSelected && !isCorrect
                                    ? "bg-red-100 dark:bg-red-900/20 border-red-500"
                                    : "bg-muted"
                                  } border`}
                              >
                                {String.fromCharCode(65 + oIndex)}. {option}
                                {isCorrectOption && (
                                  <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">
                                    ✓ Correct
                                  </span>
                                )}
                                {isSelected && !isCorrectOption && (
                                  <span className="ml-2 text-red-600 dark:text-red-400 font-semibold">
                                    ✗ Your Answer
                                  </span>
                                )}
                              </div>
                            );
                          })}
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                              Explanation:
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              {question.explanation}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleClose}>Close</Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

