import { ZestLogo } from "./zest-logo";
import { Menu } from "lucide-react";

export function Header() {
  return (
    <header className="flex justify-between items-center p-4">
      <ZestLogo />
      <button className="text-primary">
        <Menu className="h-6 w-6" />
      </button>
    </header>
  );
}
