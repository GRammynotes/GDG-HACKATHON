import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, FileText, Download, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";

interface Subject {
    id: string;
    name: string;
    topics: string[];
}

const StudyMaterials = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSubjects = async () => {
            if (!currentUser) {
                navigate("/");
                return;
            }

            try {
                // Load user's subjects from their profile
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    // Try to get subjects from dashboard state or use default
                    if (userData.dashboardState?.subjects) {
                        const userSubjects = userData.dashboardState.subjects.map((s: any) => ({
                            id: s.id,
                            name: s.name,
                            topics: s.topics.map((t: any) => t.title),
                        }));
                        setSubjects(userSubjects);
                        if (userSubjects.length > 0) {
                            setSelectedSubject(userSubjects[0].id);
                        }
                    } else {
                        // Default subjects if not found
                        const defaultSubjects: Subject[] = [
                            { id: "mi", name: "Machine Intelligence", topics: [] },
                            { id: "mpmc", name: "Microprocessor and Microcontroller", topics: [] },
                            { id: "ivp", name: "Image and Video Processing", topics: [] },
                            { id: "crypto-sec", name: "Cryptography and Security", topics: [] },
                            { id: "daa", name: "Design & Analysis of Algorithms", topics: [] },
                            { id: "toc", name: "Theory of Computation", topics: [] },
                            { id: "se", name: "Software Engineering", topics: [] },
                            { id: "cn", name: "Computer Networks", topics: [] },
                        ];
                        setSubjects(defaultSubjects);
                        setSelectedSubject(defaultSubjects[0].id);
                    }
                }
            } catch (error) {
                console.error("Error loading subjects:", error);
                toast.error("Failed to load subjects");
            } finally {
                setLoading(false);
            }
        };

        loadSubjects();
    }, [currentUser, navigate]);

    const currentSubject = subjects.find((s) => s.id === selectedSubject);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/dashboard")}
                        className="shrink-0"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-display font-bold">Study Materials</h1>
                        <p className="text-muted-foreground mt-1">
                            Access study resources and materials for your subjects
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading subjects...</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Subject List Sidebar */}
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Subjects</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {subjects.map((subject) => (
                                            <button
                                                key={subject.id}
                                                onClick={() => setSelectedSubject(subject.id)}
                                                className={`w-full text-left p-3 rounded-lg transition-colors ${selectedSubject === subject.id
                                                        ? "bg-primary text-primary-foreground"
                                                        : "hover:bg-muted"
                                                    }`}
                                            >
                                                <div className="font-medium">{subject.name}</div>
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Materials Content */}
                        <div className="lg:col-span-3">
                            {currentSubject ? (
                                <Tabs defaultValue="resources" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="resources">Resources</TabsTrigger>
                                        <TabsTrigger value="notes">AI Notes</TabsTrigger>
                                        <TabsTrigger value="links">External Links</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="resources" className="mt-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <FileText className="h-5 w-5" />
                                                    Study Resources
                                                </CardTitle>
                                                <CardDescription>
                                                    Materials for {currentSubject.name}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {currentSubject.topics.length > 0 ? (
                                                        currentSubject.topics.map((topic, index) => (
                                                            <div
                                                                key={index}
                                                                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                                            >
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1">
                                                                        <h3 className="font-semibold mb-2">{topic}</h3>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            Study materials for this topic will be available soon.
                                                                        </p>
                                                                    </div>
                                                                    <Badge variant="outline">Coming Soon</Badge>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-12">
                                                            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                            <p className="text-muted-foreground">
                                                                No topics available for this subject yet.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="notes" className="mt-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <BookOpen className="h-5 w-5" />
                                                    AI-Generated Study Notes
                                                </CardTitle>
                                                <CardDescription>
                                                    AI-powered study notes for {currentSubject.name}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    <div className="p-6 border rounded-lg bg-muted/30">
                                                        <p className="text-muted-foreground text-center">
                                                            AI-generated study notes feature is coming soon. This will provide
                                                            personalized study materials based on your progress and learning style.
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="links" className="mt-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <ExternalLink className="h-5 w-5" />
                                                    External Resources
                                                </CardTitle>
                                                <CardDescription>
                                                    Useful links and references for {currentSubject.name}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    <div className="p-4 border rounded-lg">
                                                        <h3 className="font-semibold mb-2">Recommended Resources</h3>
                                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                                            <li>• Course textbooks and reference materials</li>
                                                            <li>• Online tutorials and video lectures</li>
                                                            <li>• Practice problems and solutions</li>
                                                            <li>• Research papers and articles</li>
                                                        </ul>
                                                        <p className="text-xs text-muted-foreground mt-4">
                                                            External links will be added by your instructors.
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            ) : (
                                <Card>
                                    <CardContent className="py-12 text-center">
                                        <p className="text-muted-foreground">Select a subject to view materials</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudyMaterials;
