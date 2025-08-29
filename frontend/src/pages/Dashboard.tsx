/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTodos } from '../hooks/useTodos';
import { DashboardHeader } from '../components/DashboardHeader';
import { StatsCard } from '../components/StatsCard';
import { TaskList } from '../components/TaskList';
// import NewTaskForm from '../components/NewTaskForm';
import NewTaskModal from '../components/NewTaskModal';
import { BarChart3, CheckCircle, Clock, TrendingUp, Plus } from 'lucide-react';

import { Text } from '../components/text';
import Card from '../components/card';
import { Button } from '../components/button';

export function Dashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { data: todos, isLoading: todosLoading, refetch } = useTodos();
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // Estatísticas
  const completedTasks = todos?.filter((todo: { completed: any }) => todo.completed).length || 0;
  const pendingTasks = todos?.filter((todo: { completed: any }) => !todo.completed).length || 0;
  const totalTasks = todos?.length || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-primary">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-accent-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
          <Text variant="heading-medium" className="text-heading">
            Carregando usuário...
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary text-label font-sans">
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-12 lg:py-12">
        <Card className="bg-background-quaternary p-6 border-b-2 border-border-primary ">
          <DashboardHeader user={user} onLogout={handleLogout} />

          <div className="mb-16 text-center">
            <div>
              <Text variant="heading-medium" className="text-heading mb-3">
                Resumo das Atividades
              </Text>
            </div>
            <div>
              <Text variant="paragraph-medium" className="text-accent-paragraph">
                Acompanhe seu progresso e produtividade
              </Text>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <StatsCard title="Total de Tarefas" value={totalTasks} icon={BarChart3} />
            <StatsCard title="Concluídas" value={completedTasks} icon={CheckCircle} color="accent-brand" />
            <StatsCard title="Pendentes" value={pendingTasks} icon={Clock} color="accent-red" />
            <StatsCard title="Taxa de Conclusão" value={`${completionRate}%`} icon={TrendingUp} color="accent-brand-light" />
          </div>

          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <Text variant="heading-medium" className="text-heading mb-2">
                Suas Tarefas
              </Text>

              <div>
                <Button onClick={() => setIsCreateOpen(true)} variant="primary" className="flex items-center gap-2">
                  <Plus size={16} /> Nova Tarefa
                </Button>
              </div>
            </div>

            {/* Se não tiver tarefas, mostra CTA com botão */}
            {totalTasks === 0 ? (
              <Card className="p-8 text-center" floating>
                <Text variant="heading-small" className="mb-2">Você ainda não tem tarefas</Text>
                <Text variant="paragraph-small" className="text-accent-paragraph mb-4">Crie sua primeira tarefa para começar a organizar suas atividades.</Text>
                <div className="flex justify-center">
                  <Button onClick={() => setIsCreateOpen(true)} variant="primary">Criar primeira tarefa</Button>
                </div>
              </Card>
            ) : null}

            {/* Modal de criação */}
            <NewTaskModal
              open={isCreateOpen}
              onClose={() => setIsCreateOpen(false)}
              onCreated={() => {
                // atualiza a lista sem reload quando possível
                refetch?.();
                setIsCreateOpen(false);
              }}
            />

            <TaskList todos={todos} isLoading={todosLoading} />
          </div>
        </Card>
      </div>
    </div>
  );
}
