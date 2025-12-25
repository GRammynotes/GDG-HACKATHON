import { motion } from "framer-motion";

const SplashScreen = () => {
    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center gap-4"
            >
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl">
                    <span className="text-3xl font-bold text-white">A</span>
                </div>
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight">AimSet</h1>
                    <p className="text-sm text-muted-foreground">Loading your experience...</p>
                </div>

                <motion.div
                    className="h-1 w-32 bg-secondary rounded-full overflow-hidden mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                    />
                </motion.div>
            </motion.div>
        </div>
    );
};

export default SplashScreen;
