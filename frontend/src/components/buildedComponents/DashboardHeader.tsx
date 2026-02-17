import { useEffect, useRef, useState } from "react";
import { LogOut, Menu, Settings, User, UserCog } from "lucide-react";
import { Button } from "../baseComponents/button";
import { Text } from "../baseComponents/text";
import type { User as UserType } from "../../context/AuthContext";
import type { DashboardLayoutMode } from "../../types/dashboard-layout";
import Card from "../baseComponents/card";
import ThemeToggle from "../buildedComponents/AnimatedThemeToggle";

interface DashboardHeaderProps {
  user: UserType;
  onLogout: () => void;
  layoutMode: DashboardLayoutMode;
  onChangeLayout: (layout: DashboardLayoutMode) => void;
  onToggleSidebar?: () => void;
  onOpenProfileSettings?: () => void;
}

export function DashboardHeader({
  user,
  onLogout,
  layoutMode,
  onChangeLayout,
  onToggleSidebar,
  onOpenProfileSettings,
}: DashboardHeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isSettingsOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSettingsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isSettingsOpen]);

  function handleLayoutSelection(nextLayout: DashboardLayoutMode) {
    onChangeLayout(nextLayout);
    setIsSettingsOpen(false);
  }

  function handleOpenProfileSettings() {
    setIsSettingsOpen(false);
    onOpenProfileSettings?.();
  }

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
      <div className="space-y-4 text-center xl:text-left">
        <div className="flex items-center justify-center gap-4 xl:justify-start">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-brand to-accent-brand-light shadow-lg">
            <User className="h-8 w-8 text-white" />
          </div>
          <div>
            <Text variant="heading-large" className="mb-2 text-heading">
              Ola, {user.name}!
            </Text>
            <Text
              variant="label-small"
              className="rounded-full border border-border-primary bg-background-tertiary px-4 py-2 text-accent-brand"
            >
              {user.role}
            </Text>
          </div>
        </div>

        <Card className="mx-auto w-56 border border-border-primary bg-background-tertiary p-4 shadow-md xl:mx-0">
          <Text variant="heading-small" className="mb-1 text-center text-heading">
            Hoje e
          </Text>
          <Text variant="paragraph-small" className="text-center text-accent-paragraph">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 xl:justify-end">
        {onToggleSidebar && (
          <Button variant="ghost" onClick={onToggleSidebar} className="p-2" title="Mostrar ou ocultar grupos">
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <ThemeToggle />

        <div className="relative" ref={settingsRef}>
          <Button
            variant="ghost"
            className="p-2"
            onClick={() => setIsSettingsOpen((open) => !open)}
            title="Configuracoes do dashboard"
          >
            <Settings className="h-5 w-5" />
          </Button>

          {isSettingsOpen && (
            <div className="absolute right-0 top-12 z-40 w-72 rounded-xl border border-border-primary bg-background-secondary p-3 shadow-xl">
              <Text variant="label-small" className="mb-2 block text-heading">
                Configuracoes
              </Text>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleLayoutSelection("comfortable")}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                    layoutMode === "comfortable"
                      ? "border-accent-brand bg-accent-brand/10 text-accent-brand"
                      : "border-border-primary text-label hover:border-accent-brand/40"
                  }`}
                >
                  <Text variant="paragraph-small" className="font-semibold">
                    Layout confortavel (padrao)
                  </Text>
                  <Text variant="paragraph-small" className="text-accent-paragraph">
                    Mais espaco de tela e cards mais amplos.
                  </Text>
                </button>

                <button
                  type="button"
                  onClick={() => handleLayoutSelection("classic")}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                    layoutMode === "classic"
                      ? "border-accent-brand bg-accent-brand/10 text-accent-brand"
                      : "border-border-primary text-label hover:border-accent-brand/40"
                  }`}
                >
                  <Text variant="paragraph-small" className="font-semibold">
                    Layout classico
                  </Text>
                  <Text variant="paragraph-small" className="text-accent-paragraph">
                    Visual anterior com estrutura compacta.
                  </Text>
                </button>
              </div>

              <button
                type="button"
                onClick={handleOpenProfileSettings}
                className="mt-3 flex w-full items-center gap-2 rounded-lg border border-border-primary px-3 py-2 text-left text-label transition-colors hover:border-accent-brand/40 hover:text-accent-brand"
              >
                <UserCog className="h-4 w-4" />
                <Text variant="paragraph-small">Editar conta e amigos</Text>
              </button>
            </div>
          )}
        </div>

        <Button variant="danger" className="flex items-center gap-2 px-4 py-2" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </Button>
      </div>
    </div>
  );
}
