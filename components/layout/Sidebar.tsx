"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";

// Full Tailwind class strings — must be static for JIT to include them
const NAV_ACCENT: Record<
  string,
  {
    iconIdle: string;
    iconActive: string;
    bgIdle: string;
    bgActive: string;
    textActive: string;
  }
> = {
  "/dashboard": {
    iconIdle: "text-violet-500 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/40",
    iconActive: "text-white bg-violet-600 dark:bg-violet-500",
    bgIdle: "hover:bg-violet-50 dark:hover:bg-violet-950/30",
    bgActive: "bg-violet-50 dark:bg-violet-950/40",
    textActive: "text-violet-700 dark:text-violet-300",
  },
  "/weight": {
    iconIdle: "text-sky-500 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/40",
    iconActive: "text-white bg-sky-600 dark:bg-sky-500",
    bgIdle: "hover:bg-sky-50 dark:hover:bg-sky-950/30",
    bgActive: "bg-sky-50 dark:bg-sky-950/40",
    textActive: "text-sky-700 dark:text-sky-300",
  },
  "/diet": {
    iconIdle: "text-emerald-500 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40",
    iconActive: "text-white bg-emerald-600 dark:bg-emerald-500",
    bgIdle: "hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
    bgActive: "bg-emerald-50 dark:bg-emerald-950/40",
    textActive: "text-emerald-700 dark:text-emerald-300",
  },
  "/workout": {
    iconIdle: "text-orange-500 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40",
    iconActive: "text-white bg-orange-600 dark:bg-orange-500",
    bgIdle: "hover:bg-orange-50 dark:hover:bg-orange-950/30",
    bgActive: "bg-orange-50 dark:bg-orange-950/40",
    textActive: "text-orange-700 dark:text-orange-300",
  },
  "/products": {
    iconIdle: "text-amber-500 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40",
    iconActive: "text-white bg-amber-600 dark:bg-amber-500",
    bgIdle: "hover:bg-amber-50 dark:hover:bg-amber-950/30",
    bgActive: "bg-amber-50 dark:bg-amber-950/40",
    textActive: "text-amber-700 dark:text-amber-300",
  },
  "/recipes": {
    iconIdle: "text-pink-500 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/40",
    iconActive: "text-white bg-pink-600 dark:bg-pink-500",
    bgIdle: "hover:bg-pink-50 dark:hover:bg-pink-950/30",
    bgActive: "bg-pink-50 dark:bg-pink-950/40",
    textActive: "text-pink-700 dark:text-pink-300",
  },
  "/profile": {
    iconIdle: "text-indigo-500 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40",
    iconActive: "text-white bg-indigo-600 dark:bg-indigo-500",
    bgIdle: "hover:bg-indigo-50 dark:hover:bg-indigo-950/30",
    bgActive: "bg-indigo-50 dark:bg-indigo-950/40",
    textActive: "text-indigo-700 dark:text-indigo-300",
  },
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r bg-card px-3 py-5 gap-1 sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 pb-5">
        <div className="flex size-9 items-center justify-center rounded-xl shrink-0">
          <Image src="/icon.png" alt="Gym Pocket" width={22} height={22} />
        </div>
        <div className="min-w-0">
          <span className="font-bold text-[15px] leading-tight block">
            Gym Pocket
          </span>
          <span className="text-[11px] text-muted-foreground leading-tight">
            Fitness Tracker
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          const accent = NAV_ACCENT[item.href] ?? NAV_ACCENT["/dashboard"];

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150",
                isActive
                  ? cn(accent.bgActive, accent.textActive, "font-semibold")
                  : cn(
                      "text-muted-foreground font-medium",
                      accent.bgIdle,
                      "hover:text-foreground",
                    ),
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg shrink-0 transition-all duration-150",
                  isActive ? accent.iconActive : accent.iconIdle,
                )}
              >
                <Icon className="size-4" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer hint */}
      <p className="px-3 text-[11px] text-muted-foreground/60 select-none">
        © {new Date().getFullYear()} Gym Pocket
      </p>
    </aside>
  );
}
