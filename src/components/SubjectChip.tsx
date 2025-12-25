import { motion } from 'framer-motion';

interface SubjectChipProps {
    subject: string;
    isActive: boolean;
    onClick: () => void;
}

const SubjectChip = ({ subject, isActive, onClick }: SubjectChipProps) => {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`subject-chip ${isActive ? 'subject-chip-active' : 'subject-chip-inactive'}`}
        >
            <span>{subject}</span>
        </motion.button>
    );
};

export default SubjectChip;
