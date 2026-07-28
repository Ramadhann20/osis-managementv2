"use client";

import AppIcon from "@/components/global/AppIcon";

export default function AppNavbar({
  onOpenSidebar,
  pageTitle,
  searchPlaceholder = "Cari...",
  profile,
  onSearch,
}) {
  return (
    <header
      className="
        fixed left-0 right-0 top-0 z-30
        flex h-16 items-center
        border-b border-border
        bg-card/90 px-4
        backdrop-blur-md
        lg:left-[260px] lg:px-8
      "
    >
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            aria-label="Buka sidebar"
            onClick={onOpenSidebar}
            className="rounded-lg p-2 text-text-muted transition hover:bg-input hover:text-text lg:hidden"
          >
            <AppIcon name="menu" size={22} />
          </button>

          <div className="min-w-0 md:hidden">
            <h2 className="truncate text-sm font-semibold text-text">
              {pageTitle}
            </h2>
          </div>

          <div className="relative hidden w-full max-w-sm md:block">
            <AppIcon
              name="search"
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />

            <input
              type="search"
              placeholder={searchPlaceholder}
              onChange={(event) => onSearch?.(event.target.value)}
              className="
                w-full rounded-full
                border border-transparent
                bg-input py-2
                pl-10 pr-4
                text-sm text-text
                outline-none transition
                placeholder:text-text-muted
                focus:border-primary
                focus:ring-2
                focus:ring-primary/20
              "
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <button
            type="button"
            aria-label="Notifikasi"
            className="rounded-full p-2 text-text-muted transition hover:bg-input hover:text-primary"
          >
            <AppIcon name="notifications" size={22} />
          </button>

          <button
            type="button"
            aria-label="Bantuan"
            className="hidden rounded-full p-2 text-text-muted transition hover:bg-input hover:text-primary sm:block"
          >
            <AppIcon name="help_outline" size={22} />
          </button>

          <div className="hidden h-8 w-px bg-border sm:block" />

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {profile.initials}
            </div>

            <div className="hidden sm:block">
              <p className="max-w-36 truncate text-sm font-semibold text-text">
                {profile.name}
              </p>

              <p className="text-[10px] text-text-muted">
                {profile.roleLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}