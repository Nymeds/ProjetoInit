# ELISA - Arquitetura da Assistente

Este documento explica como a assistente ELISA funciona no backend.

O objetivo e permitir que uma pessoa leiga, ou alguem que acabou de entrar no projeto, consiga:

- entender o papel da IA no sistema
- localizar os arquivos mais importantes
- seguir o fluxo de uma requisicao do inicio ao fim
- manter, corrigir ou extender a assistente com seguranca
- criar uma implementacao parecida em outro projeto

---

## 1. Visao geral

A ELISA e uma assistente operacional do sistema.

Ela nao fala direto com o banco de dados nem executa regras de negocio "por conta propria".
Em vez disso, ela funciona como uma camada de orquestracao:

1. recebe a mensagem do usuario
2. entende a intencao com ajuda do modelo de IA
3. escolhe uma ou mais ferramentas disponiveis
4. executa essas ferramentas usando os casos de uso reais do backend
5. devolve uma resposta em linguagem natural
6. registra historico e estado interno para continuar a conversa depois

Em outras palavras:

- o modelo interpreta
- o backend valida
- os casos de uso executam
- a assistente responde

---

## 2. O que existe dentro da pasta `assistant`

Arquivos principais:

- `chat.ts`: endpoint HTTP principal da assistente
- `service.ts`: pipeline central da ELISA
- `tools.ts`: catalogo de ferramentas e executor das acoes
- `history.ts`: endpoint que devolve o historico "limpo" da conversa
- `client.ts`: cliente do provedor de IA
- `config.ts`: prompt, limites e regexes de apoio
- `helpers.ts`: utilitarios de texto, erro e log
- `types.ts`: contratos tipados do modulo
- `use-cases.ts`: fachada de casos de uso reais usados pela IA
- `tools.spec.ts`: testes focados em heuristicas do modulo

---

## 3. Ideia central da arquitetura

A arquitetura da ELISA foi separada em 4 camadas:

### Camada 1 - Entrada

Responsavel por receber requisicoes HTTP ou eventos de grupo.

Exemplos:

- `assistantChat` em `chat.ts`
- `processAssistantMentionInGroup` em `service.ts`

### Camada 2 - Orquestracao

Responsavel por controlar o fluxo completo da conversa.

Exemplos:

- montar historico
- recuperar contexto
- chamar o modelo
- executar ferramentas
- persistir resposta

Arquivo principal:

- `service.ts`

### Camada 3 - Interpretacao e ferramentas

Responsavel por transformar linguagem natural em acoes concretas do sistema.

Exemplos:

- identificar grupos citados
- inferir se a frase e confirmacao
- escolher quais ferramentas expor para o modelo
- executar `criar_tarefa`, `deletar_grupo`, `avisar_no_grupo` etc

Arquivo principal:

- `tools.ts`

### Camada 4 - Regras de negocio

Responsavel por executar o que realmente muda o sistema.

A ELISA nao deve reinventar regra de negocio.
Ela reaproveita os mesmos casos de uso que outras partes do backend ja usam.

Arquivo de acesso:

- `use-cases.ts`

---

## 4. Fluxo completo de uma mensagem

Vamos imaginar a frase:

`"crie uma tarefa chamada fechar escopo no grupo Produto"`

O fluxo e este:

1. O frontend envia `POST /assistant/chat`
2. `chat.ts` valida o body com Zod
3. `chat.ts` chama `processAssistantMessage`
4. `service.ts` valida se o usuario pode usar o grupo informado
5. `service.ts` carrega a thread da conversa
6. `service.ts` busca historico recente da ELISA
7. `service.ts` chama `buildRuntimeContext`
8. `tools.ts` decide quais ferramentas fazem sentido expor ao modelo
9. O modelo recebe:
   - historico compactado
   - prompt de sistema
   - contexto operacional
   - lista curta de ferramentas disponiveis
10. O modelo decide chamar uma ferramenta, por exemplo `criar_tarefa`
11. `runTool` valida os argumentos e chama `assistantUseCases.createTodo.execute(...)`
12. O resultado da ferramenta volta para o modelo
13. O modelo gera a resposta final
14. `service.ts` salva a resposta no historico
15. `service.ts` salva tambem um estado interno da conversa
16. O endpoint devolve a resposta ao frontend

---

## 5. Como o modelo de IA e usado

O modelo nao recebe acesso direto ao banco nem ao codigo.

Ele recebe apenas:

- prompt de sistema
- historico recente compactado
- contexto operacional sintetico
- declaracoes de ferramentas

Isso e importante porque:

- reduz custo de tokens
- reduz risco de hallucination operacional
- limita a area de decisao da IA
- faz a execucao passar por regras reais do backend

---

## 6. O que e o `service.ts`

`service.ts` e o coracao da assistente.

Ele nao conhece detalhes profundos de cada ferramenta, mas coordena tudo.

Principais responsabilidades:

- abrir ou criar thread do usuario
- carregar historico
- compactar mensagens antigas
- recuperar estado interno salvo
- montar contexto sintetico da rodada
- chamar o modelo
- processar rodadas de function calling
- transformar falhas de ferramenta em perguntas curtas
- salvar resposta da assistente
- salvar memoria tecnica da conversa
- publicar resposta em grupo quando necessario

Se voce quiser entender a ELISA por apenas um arquivo, comece por `service.ts`.

---

## 7. O que e o `tools.ts`

`tools.ts` e o segundo arquivo mais importante do modulo.

Ele faz 3 trabalhos grandes:

### 7.1. Escolha de ferramentas

Nem toda mensagem precisa ver todas as ferramentas.

Exemplo:

- se o usuario fala "sim", quase nenhuma ferramenta precisa ser exposta
- se ele fala "mova as tarefas pares para Financeiro", faz sentido expor `mover_para_grupo`

Isso reduz tokens e melhora a precisao.

### 7.2. Montagem de contexto de runtime

O arquivo cria um contexto curto com informacoes como:

- grupo preferido da conversa
- mensagens recentes do usuario
- sinais de comportamento
- follow-up pendente
- sugestao de ferramenta para continuacao

### 7.3. Execucao real das ferramentas

Cada ferramenta:

- valida argumentos com Zod
- resolve entidades como grupos e tarefas
- chama casos de uso reais do sistema
- retorna um objeto `ToolResult`

Exemplos de ferramentas:

- `criar_tarefa`
- `buscar_tarefas`
- `marcar_concluida`
- `mover_para_grupo`
- `deletar_tarefa`
- `criar_grupo`
- `listar_grupos`
- `avisar_no_grupo`
- `comentar_tarefa`

---

## 8. Como a ELISA lembra de pendencias

Existe um mecanismo de memoria interna leve.

Ele nao depende apenas do texto visivel do chat.

Quando a ELISA faz uma pergunta como:

`"Deletar tarefa e uma acao sensivel. Confirma?"`

ela salva um estado tecnico com:

- tipo da pendencia
- ferramenta envolvida
- argumentos ja inferidos
- candidatos ambiguos
- grupo de origem

Esse estado e salvo com prefixo:

- `ELISA_STATE|`

Esse registro fica no banco como mensagem tecnica da thread, mas nao aparece no historico mostrado ao usuario.

Vantagem:

- a assistente entende melhor respostas curtas como `sim`, `nao`, `essa`, `a do financeiro`

---

## 9. Historico visivel vs historico interno

No banco, a thread pode guardar mais informacao do que o usuario enxerga.

Temos dois tipos de memoria:

### Historico visivel

Mensagens normais:

- usuario
- assistente

### Historico interno

Mensagens tecnicas:

- estado interno da ELISA
- mensagens de orquestracao de grupo
- registros usados para follow-up

O endpoint `history.ts` filtra isso antes de enviar ao frontend.

---

## 10. Como a ELISA evita agir de forma perigosa

A assistente aplica algumas regras de seguranca importantes:

- acoes sensiveis exigem confirmacao
- grupos e tarefas sao resolvidos antes da acao
- se houver ambiguidade, a ELISA pergunta em vez de assumir
- a execucao passa por casos de uso reais, nao por SQL manual
- o modelo nao recebe acesso direto ao banco
- o usuario precisa pertencer ao grupo para operar nele

Exemplos de acoes sensiveis:

- deletar tarefa
- deletar grupo
- sair do grupo
- deletar comentario
- remover membros

---

## 11. Como funciona a conversa em grupo

A ELISA pode ser acionada dentro de grupos.

Quando uma mensagem contem a mencao `elisa`, o fluxo de grupo:

1. remove a palavra de chamada
2. detecta se e apenas uma saudacao
3. se for saudacao, responde sem chamar modelo
4. se nao for, chama `processAssistantMessage`
5. a resposta pode ser repostada no proprio grupo

Diferenca importante:

- no grupo, normalmente nao usamos a thread privada inteira do usuario
- no chat privado, usamos historico persistido e memoria da conversa

---

## 12. Arquivos e papeis principais

### `client.ts`

Cria a instancia do provedor de IA.

### `config.ts`

Guarda:

- prompt de sistema
- nome do modelo
- limites de contexto
- regexes de confirmacao e saudacao
- prefixos internos

### `helpers.ts`

Fornece utilitarios pequenos:

- normalizacao de texto
- compactacao
- serializacao segura
- detalhamento de erros
- geracao de `errorId`

### `chat.ts`

E a porta HTTP principal.

### `service.ts`

Controla o fluxo ponta a ponta.

### `tools.ts`

Interpreta a intencao e executa as ferramentas.

### `history.ts`

Limpa o historico antes de enviar ao frontend.

### `use-cases.ts`

Conecta a IA aos casos de uso reais do backend.

### `types.ts`

Define contratos internos do modulo.

---

## 13. Principais metodos e por que eles existem

### `assistantChat`

Recebe o request HTTP e delega para o pipeline principal.

### `processAssistantMessage`

E o metodo mais importante do modulo.
Se algo "misterioso" estiver acontecendo na ELISA, quase sempre o diagnostico comeca aqui.

### `buildRuntimeContext`

Resume a rodada atual para o modelo e para as ferramentas.

### `getToolDeclarations`

Escolhe quais ferramentas realmente valem a pena expor.

### `runTool`

Executa a ferramenta selecionada.

### `buildRetryQuestion`

Traduz falhas tecnicas em perguntas curtas para o usuario.

### `assistantHistory`

Entrega o historico limpo para o frontend.

---

## 14. Como adicionar uma nova ferramenta

Exemplo: voce quer criar a ferramenta `arquivar_tarefa`.

Passo a passo:

1. Crie ou reutilize um caso de uso real no backend
2. Adicione schema Zod dos argumentos em `tools.ts`
3. Adicione a declaracao da ferramenta em `allToolDeclarations`
4. Ensine `inferToolNamesFromMessage` a expor a ferramenta quando fizer sentido
5. Adicione o branch da execucao dentro de `runTool`
6. Padronize o retorno com `ToolResult`
7. Se a ferramenta for sensivel, use confirmacao explicita
8. Crie ou atualize testes em `tools.spec.ts`
9. Documente a ferramenta neste README, se ela for importante

Regra de ouro:

- a ferramenta nao deve implementar regra de negocio do zero
- ela deve reaproveitar um caso de uso do dominio

---

## 15. Como trocar o modelo

Para trocar o modelo principal:

1. altere `MODEL_NAME` em `config.ts`
2. valide se o provedor ainda suporta o mesmo formato de function calling
3. teste mensagens simples, ambiguas e sensiveis
4. confirme se o formato da resposta ainda entrega texto e `functionCalls`

Se o provedor mudar por completo:

1. ajuste `client.ts`
2. revise `extractTextFromResponse`
3. revise o formato das chamadas de ferramenta em `service.ts`

---

## 16. Como manter a assistente sem quebrar comportamento

Checklist seguro de manutencao:

- primeiro leia `service.ts`
- depois leia `tools.ts`
- so entao altere prompt ou heuristicas
- mantenha validacao com Zod
- nao mova regra de negocio para dentro da IA
- nao deixe ferramenta escrever no sistema sem passar por use-case
- preserve as confirmacoes de acoes sensiveis
- preserve a filtragem do historico em `history.ts`

---

## 17. Erros comuns de manutencao

### Erro 1: expor ferramentas demais

Problema:

- o modelo fica com ruido e toma decisoes piores

Solucao:

- refine `getToolDeclarations`

### Erro 2: fazer a IA decidir sem validar

Problema:

- risco de agir em grupo errado ou tarefa errada

Solucao:

- valide com Zod e resolva entidades antes da acao

### Erro 3: confiar demais no texto visivel da conversa

Problema:

- respostas curtas perdem contexto

Solucao:

- preserve e evolua `AssistantConversationState`

### Erro 4: pular os use-cases

Problema:

- regras do sistema ficam duplicadas e inconsistentes

Solucao:

- mantenha a ELISA como orquestradora, nao como camada de dominio

---

## 18. Exemplo mental simples para um leigo

Pense na ELISA como uma secretaria digital:

- o modelo de IA entende o pedido em linguagem humana
- as ferramentas sao os formularios internos que ela pode preencher
- os casos de uso sao os departamentos oficiais da empresa
- o banco e o arquivo central
- o historico e a memoria da conversa

A secretaria nao pode inventar aprovacoes.
Ela precisa encaminhar para o departamento certo.

Esse e exatamente o papel da ELISA no sistema.

---

## 19. Se voce quer estudar o modulo em ordem

Ordem recomendada de leitura:

1. `README.md`
2. `types.ts`
3. `config.ts`
4. `chat.ts`
5. `service.ts`
6. `tools.ts`
7. `use-cases.ts`
8. `history.ts`
9. `tools.spec.ts`

---

## 20. Resumo final

A ELISA funciona bem porque separa claramente:

- interpretacao de linguagem natural
- selecao de ferramentas
- execucao real das regras do sistema
- memoria da conversa
- exibicao limpa para o usuario

Se essa separacao for mantida, a assistente pode crescer com seguranca.
Se essa separacao for quebrada, a manutencao rapidamente fica confusa e fragil.
