// Import supprimé car non utilisé
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "./button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";

export function ThemeToggle() { 
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark: -rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Basculer le thème</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={ () => setTheme('light') }
          className={ `flex items-center space-x-2 ${theme === 'light' ? 'bg-accent' : '' }`}
        >
          <Sun className="h-4 w-4" />
          <span>Clair</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={ () => setTheme('dark') }
          className={ `flex items-center space-x-2 ${theme === 'dark' ? 'bg-accent' : '' }`}
        >
          <Moon className="h-4 w-4" />
          <span>Sombre</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={ () => setTheme('system') }
          className={ `flex items-center space-x-2 ${theme === 'system' ? 'bg-accent' : '' }`}
        >
          <Monitor className="h-4 w-4" />
          <span>Système</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 