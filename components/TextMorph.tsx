import { AnimatePresence, motion } from 'framer-motion';

type TextMorphProps = {
  children: string;
  className?: string;
};

export function TextMorph({ children, className }: TextMorphProps) {
  return (
    <span className={className} aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={children}
          className="torphText"
          initial={{ opacity: 0, y: 3, filter: 'blur(3px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -3, filter: 'blur(3px)' }}
          transition={{ duration: 0.2, ease: [0.19, 1, 0.22, 1] }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
