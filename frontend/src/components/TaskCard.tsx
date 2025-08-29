import { CheckCircle, Clock, Calendar } from 'lucide-react';
import Card from './card';
import { Text } from './text';

interface TaskCardProps {
  title: string;
  completed: boolean;
  createdAt: string;
}

export function TaskCard({ title, completed, createdAt }: TaskCardProps) {
  return (
    
    <Card className="bg-background-secondary p-6 border border-border-primary hover:border-accent-brand transition-all duration-300 hover:scale-105 hover:shadow-lg">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Text variant="heading-small" className="text-heading flex-1 pr-3 leading-relaxed">
            {title}
          </Text>
          <div className="flex-shrink-0">
            {completed ? (
              <CheckCircle className="w-6 h-6 text-accent-brand" />
            ) : (
              <Clock className="w-6 h-6 text-accent-red" />
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            completed 
              ? "bg-accent-brand/20 text-accent-brand border border-accent-brand/30" 
              : "bg-accent-red/20 text-accent-red border border-accent-red/30"
          }`}>
            {completed ? "✅ Concluída" : "⏳ Pendente"}
          </span>
        </div>
        
        <div className="flex items-center pt-3 border-t border-border-primary space-x-2">
        
          <Calendar className="w-4 h-4 text-accent-span" />
          <Text variant="paragraph-small" className="text-accent-span">
            {new Date(createdAt).toLocaleDateString('pt-BR')}
          </Text>
        </div>
      </div>
    </Card>
  );
}
