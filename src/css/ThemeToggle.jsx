import { useTheme } from "../context/ThemeContext.jsx";
import { Button } from "../components/ui/button.jsx";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion"


export const ThemeToggle = () => {
    const { toggleDark } = useTheme();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
        >
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleDark}
                className="h-9 w-9 rounded-full bg-card shadow-sm border border-border"
                data-testid="theme-toggle-button"
            >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
            </Button>
        </motion.div>
    )
}

export const ThemeToggle_Lite = () => {
    const { toggleDark } = useTheme();
    return (
        <div className="absolute right-4 top-4 z-50">
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleDark}
                className="h-9 w-9 rounded-full bg-card "
                data-testid="theme-toggle-button"
            >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
            </Button>
        </div>
    )
}