import { Menu } from "lucide-react";
import { Button } from "@/components/ui";
import Notification from "./Notification";
import Profile from "./Profile";
import ThemeToggle from "./ThemeToggle";
import { useRouteMeta } from "@/hooks/useRouteMeta";

export type Props = {
  onMenuClick: () => void;
};

export const Header = ({ onMenuClick }: Props) => {
  const { meta } = useRouteMeta();
  const Icon = meta.icon;

  return (
    <header className="sticky top-0 z-40 flex py-2 items-center justify-between border-b border-slate-200/80 bg-white/75 px-4 backdrop-blur-md transition-colors dark:border-slate-600 dark:bg-slate-950/70 md:px-8">
      <Button
        className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
        onClick={onMenuClick}
      >
        <Menu size={22} />
      </Button>

      <div className="hidden md:flex items-center gap-2">
        {Icon && (
          <Icon size={24} className="text-white rounded bg-indigo-600 p-1" />
        )}

        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-800 dark:text-slate-100">
          {meta.label}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <Notification />
        <Profile />
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
