import { type ReactNode, useEffect, useRef, useState } from "react";
import { LogOut, Menu, Settings, User, UserCog } from "lucide-react";
import { Button } from "../baseComponents/button";
import { Text } from "../baseComponents/text";
import type { User as UserType } from "../../context/AuthContext";
import Card from "../baseComponents/card";
import ThemeToggle from "../buildedComponents/AnimatedThemeToggle";

interface DashboardHeaderProps {
  user: UserType;
  onLogout: () => void;
  statsContent?: ReactNode;
  onSummaryClick?: () => void;
  onToggleSidebar?: () => void;
  onOpenProfileSettings?: () => void;
}

export function DashboardHeader({
  user,
  onLogout,
  statsContent,
  onSummaryClick,
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

  function handleOpenProfileSettings() {
    setIsSettingsOpen(false);
    onOpenProfileSettings?.();
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_auto] xl:items-start">
      <div className="order-1 space-y-4 text-center xl:text-left">
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

      <div className="order-3 space-y-5 xl:order-2">
        {onSummaryClick ? (
          <button
            type="button"
            onClick={onSummaryClick}
            className="w-full rounded-lg p-1 text-center transition-colors hover:bg-background-tertiary/40 xl:text-left"
          >
            <Text variant="heading-medium" className="mb-2 text-heading">
              Resumo das atividades
            </Text>
            <Text variant="paragraph-medium" className="text-accent-paragraph">
              Acompanhe seu progresso e produtividade.
            </Text>
          </button>
        ) : (
          <div className="text-center xl:text-left">
            <Text variant="heading-medium" className="mb-2 text-heading">
              Resumo das atividades
            </Text>
            <Text variant="paragraph-medium" className="text-accent-paragraph">
              Acompanhe seu progresso e produtividade.
            </Text>
          </div>
        )}

        {statsContent}
      </div>

      <div className="order-2 flex flex-col items-center gap-3 xl:order-3 xl:items-end">
        <div className="flex items-center gap-2">
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

                <button
                  type="button"
                  onClick={handleOpenProfileSettings}
                  className="flex w-full items-center gap-2 rounded-lg border border-border-primary px-3 py-2 text-left text-label transition-colors hover:border-accent-brand/40 hover:text-accent-brand"
                >
                  <UserCog className="h-4 w-4" />
                  <Text variant="paragraph-small">Editar conta e amigos</Text>
                </button>
              </div>
            )}
          </div>
        </div>

        <Button variant="danger" className="flex items-center gap-2 px-4 py-2 xl:min-w-[120px]" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </Button>
      </div>
    </div>
  );
}

