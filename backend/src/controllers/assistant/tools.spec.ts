import { afterEach, describe, expect, it, vi } from "vitest";
import { buildRuntimeContext, getToolDeclarations } from "./tools.js";
import type { AssistantConversationState } from "./types.js";
import { assistantUseCases } from "./use-cases.js";

describe("getToolDeclarations", () => {
  it("seleciona apenas ferramentas relevantes para mover tarefas em lote", () => {
    const declarations = getToolDeclarations({
      message: "mova as tarefas pares para o grupo Financeiro",
    });
    const names = declarations.map((item: { name: string }) => item.name);

    expect(names).toContain("mover_para_grupo");
    expect(names).toContain("buscar_tarefas");
    expect(names).toContain("listar_grupos");
    expect(names).not.toContain("deletar_grupo");
    expect(names).not.toContain("sair_do_grupo");
  });

  it("mantem o catalogo enxuto em continuacoes curtas com ferramenta sugerida", () => {
    const declarations = getToolDeclarations({
      message: "sim",
      preferredToolNames: ["deletar_tarefa"],
    });
    const names = declarations.map((item: { name: string }) => item.name);

    expect(names).toEqual(["deletar_tarefa"]);
  });

  it("nao expoe ferramentas quando o pedido e apenas de planejamento", () => {
    const declarations = getToolDeclarations({
      message: "me ajude a organizar as prioridades do projeto dessa semana",
    });

    expect(declarations).toHaveLength(0);
  });
});

describe("buildRuntimeContext", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("cria contexto compacto para confirmacao pendente", async () => {
    vi.spyOn(assistantUseCases.listGroups, "execute").mockResolvedValue({
      groups: [{ id: "group-1", name: "Financeiro" }],
    } as any);

    const assistantState: AssistantConversationState = {
      status: "pending",
      kind: "confirmation",
      toolNames: ["deletar_tarefa"],
      assistantPrompt: "Deletar tarefa e uma acao sensivel. Confirma?",
      previousUserMessage: "apaga a tarefa orcamento do grupo Financeiro",
      args: {
        title: "orcamento",
        groupName: "Financeiro",
      },
      createdAt: "2026-04-14T12:00:00.000Z",
    };

    const runtime = await buildRuntimeContext({
      userId: "user-1",
      message: "sim",
      sourceGroupId: "group-1",
      recentUserMessages: [
        "apaga a tarefa orcamento do grupo Financeiro",
        "sim",
      ],
      assistantState,
    });

    expect(runtime.suggestedToolNames).toContain("deletar_tarefa");
    expect(runtime.followUpHint).toContain("confirmou");
    expect(runtime.contextSummary).toContain("grupo atual: Financeiro");
    expect(runtime.interactionSignals).toContain("foco_em_equipe_e_grupos");
  });
});
