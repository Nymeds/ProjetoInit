import { Text } from './text';
import Card from './card';
import type { ElementType } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ElementType; 
  color?: string;
}

export function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  return (
    <Card className={`bg-background-secondary p-6 border border-border-primary text-center transition-all duration-300 hover:scale-105 hover:border-${color || 'accent-brand'}`}>
      <div className="flex items-center justify-center mb-4">
        <div className={`p-3 rounded-xl ${color ? `bg-${color}/20` : 'bg-accent-brand/20'}`}>
          <Icon className={`w-8 h-8 ${color ? `text-${color}` : 'text-accent-brand'}`} /> 
        </div>
      </div>
      <Text variant="heading-large" className={`mb-2 ${color ? `text-${color}` : 'text-heading'}`}>
        {value}
      </Text>
      <Text variant="label-small" className="text-accent-paragraph">
        {title}
      </Text>
    </Card>
  );
}
