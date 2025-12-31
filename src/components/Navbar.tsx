import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, BookOpen, User, LogOut, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

const Navbar = () => {
    const { currentUser, userData, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    if (!currentUser) return null;

    const handleLogout = async () => {
        try {
            await logout();
            toast.success("Logged out successfully");
            navigate("/");
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Failed to logout");
        }
    };

    const getInitials = () => {
        const name = userData?.fullName || currentUser?.displayName || currentUser?.email || "U";
        return name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo/Brand */}
                    <Link to="/dashboard" className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                            SS
                        </div>
                        <span className="font-display font-bold text-lg">Smart Study Planner</span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-1">
                        <Link
                            to="/dashboard"
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive("/dashboard")
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Home className="h-4 w-4" />
                                Dashboard
                            </div>
                        </Link>
                        <Link
                            to="/materials"
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive("/materials")
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                Materials
                            </div>
                        </Link>
                        <Link
                            to="/landing"
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive("/landing")
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4" />
                                Goals
                            </div>
                        </Link>
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                            {getInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {userData?.fullName || currentUser?.displayName || "User"}
                                        </p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {currentUser?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                                        <Home className="h-4 w-4" />
                                        Dashboard
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/materials" className="flex items-center gap-2 cursor-pointer">
                                        <BookOpen className="h-4 w-4" />
                                        Study Materials
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/dashboard?view=profile" className="flex items-center gap-2 cursor-pointer">
                                        <User className="h-4 w-4" />
                                        Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/landing" className="flex items-center gap-2 cursor-pointer">
                                        <GraduationCap className="h-4 w-4" />
                                        Edit Goals
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="text-red-600 focus:text-red-600 cursor-pointer"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

