import { motion } from 'framer-motion';

type AimLevel = 'passing' | 'below-average' | 'average' | 'above-average' | 'topper';

interface AimCardProps {
    level: AimLevel;
    title: string;
    range: string;
    description: string;
    color: string;
    isActive: boolean;
    onClick: () => void;
}

const AimCard = ({ level, title, range, description, color, isActive, onClick }: AimCardProps) => {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`aim-card ${isActive ? 'aim-card-active' : 'aim-card-inactive'}`}
        >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                {title}
                {isActive && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex h-1.5 w-1.5 rounded-full bg-primary"
                    />
                )}
            </span>
            <span className="mt-3 text-base font-semibold text-foreground">
                {range} band
            </span>
            <span className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {description}
            </span>
            <span
                className={`mt-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${color} px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-background`}
            >
                AIM filter
            </span>
        </motion.button>
    );
};

export default AimCard;
