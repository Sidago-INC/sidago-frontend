
import { NavigationItem } from "@/lib/navigation";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export type Props = {
  item: NavigationItem;
  isCollapsed: boolean;
  isActive: boolean;
  allowLabelWrap?: boolean;
};

export const SidebarItem = ({
  item,
  isCollapsed,
  isActive,
  allowLabelWrap = false,
}: Props) => {
  const Icon = item.icon;

  return (
    <Link
      to={item.href}
      title={item.label}
      className={`group flex cursor-pointer items-center rounded-xl border p-2 transition-all duration-300 md:w-full ${
        isCollapsed ? "justify-center" : "justify-start"
      } ${
        isActive
          ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:border-indigo-400 dark:bg-indigo-500 dark:shadow-indigo-950/40"
          : "border-transparent text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-300"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3 overflow-hidden">
        <Icon
          size={18}
          className={`shrink-0 ${
            isActive
              ? "text-white"
              : "group-hover:text-indigo-700 dark:group-hover:text-indigo-300"
          }`}
        />
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`min-w-0 font-semibold text-[0.875rem] tracking-wide ${
              allowLabelWrap
                ? "whitespace-normal break-words leading-snug"
                : "truncate"
            }`}
          >
            {item.label}
          </motion.span>
        )}
      </div>
    </Link>
  );
};
