import { useNavigate } from "react-router";
import { MessageSquare, User, Users, LogOut, Sun, Moon } from "lucide-react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command.tsx";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog.tsx";
import { useAuthStore } from "@/store/auth.ts";

interface NavMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NavMenu({ open, onOpenChange }: NavMenuProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function run(action: () => void) {
    onOpenChange(false);
    setTimeout(action, 50);
  }

  function handleLogout() {
    run(() => {
      logout();
      navigate("/auth");
    });
  }

  function toggleTheme() {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem(
      "theme",
      document.documentElement.classList.contains("dark") ? "dark" : "light"
    );
    onOpenChange(false);
  }

  const isDark = document.documentElement.classList.contains("dark");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-1/3 -translate-y-0 overflow-hidden p-0 gap-0 max-w-sm rounded-xl"
        showCloseButton={false}
        aria-label="Navigation menu"
      >
        <Command>
          <CommandInput placeholder="Where to?" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>

            <CommandGroup heading="Navigate">
              <CommandItem onSelect={() => run(() => navigate("/chat"))}>
                <MessageSquare />
                Chat
                <CommandShortcut>C</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  run(() => navigate(`/profile/${user?.username ?? ""}`))
                }
              >
                <User />
                Profile
                <CommandShortcut>P</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => run(() => navigate("/users"))}>
                <Users />
                Users
                <CommandShortcut>U</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Account">
              <CommandItem onSelect={toggleTheme}>
                {isDark ? <Sun /> : <Moon />}
                {isDark ? "Light mode" : "Dark mode"}
                <CommandShortcut>Ctrl D</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={handleLogout}
                className="text-destructive data-selected:text-destructive"
              >
                <LogOut />
                Sign out
              </CommandItem>
            </CommandGroup>
          </CommandList>

          {/* Hint bar */}
          <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center gap-3">
            <span><kbd className="font-mono">↑↓</kbd> navigate</span>
            <span><kbd className="font-mono">↵</kbd> select</span>
            <span><kbd className="font-mono">Esc</kbd> close</span>
            <span className="ml-auto opacity-60">{user?.username}</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
