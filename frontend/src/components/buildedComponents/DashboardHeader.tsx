import { User, LogOut } from 'lucide-react';
import { Button } from './baseComponents/button';
import { Text } from './text';
import type { User as UserType } from '../context/AuthContext';
import Card from './baseComponents/card';

interface DashboardHeaderProps {
  user: UserType;
  onLogout: () => void;
}

export function DashboardHeader({ user, onLogout }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-center mb-12 space-y-6 lg:space-y-0">
      <div className="text-center lg:text-left space-y-4">
        <div className="flex items-center justify-center lg:justify-start space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-accent-brand to-accent-brand-light rounded-2xl flex items-center justify-center shadow-lg">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <Text variant="heading-large" className="text-heading mb-2">
              Olá, {user.name}! 👋
            </Text>
            <Text variant="label-small" className="px-4 py-2 bg-background-tertiary rounded-full border border-border-primary text-accent-brand">
              {user.role}
            </Text>
          </div>
          
        </div>
        <hr></hr>
       <Card className="w-56 bg-background-tertiary p-4 flex flex-col items-center justify-center border border-border-primary rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
            <Text variant="heading-small" className="text-heading mb-1 text-center">
                Hoje é
            </Text>
            <Text variant="paragraph-small" className="text-accent-paragraph text-center">
                {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
                })}
            </Text>
            </Card>


      </div>
      
      <Button 
        variant="danger" 
        className="flex items-center space-x-3 px-6 py-3" 
        onClick={onLogout}
      >
        <LogOut className="w-5 h-5" />
        <span>Sair</span>
      </Button>
    </div>
  );
}
