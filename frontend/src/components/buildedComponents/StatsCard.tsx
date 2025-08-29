import React from 'react';
import { Text } from '../baseComponents/text';
import Card from '../baseComponents/card';

type StatsCardProps = {
  title: string;
  value: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: React.ComponentType<any>;
  color?: 'accent-brand' | 'accent-red' | 'accent-brand-light';
};

export function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  const colorMap: Record<
    string,
    { bgClass: string; textClass: string; gradientClass: string }
  > = {
    'accent-brand': {
      bgClass: 'bg-accent-brand/20',
      textClass: 'text-accent-brand',
      gradientClass: 'bg-[linear-gradient(135deg,#1ccfc3,#66eae1)]',
    },
    'accent-red': {
      bgClass: 'bg-accent-red/20',
      textClass: 'text-accent-red',
      gradientClass: 'bg-[linear-gradient(135deg,#f54a26,#ff8a5b)]',
    },
    'accent-brand-light': {
      bgClass: 'bg-accent-brand-light/20',
      textClass: 'text-accent-brand-light',
      gradientClass: 'bg-[linear-gradient(135deg,#66eae1,#bff7f3)]',
    },
  };

  const chosen = color ? colorMap[color] : colorMap['accent-brand'];

  return (
    <Card className="bg-background-secondary p-6 border border-border-primary text-center transition-all duration-300 hover:scale-105">
      <div className="flex items-center justify-center mb-4">
        <div className={`p-3 rounded-xl ${chosen.bgClass}`}>
          {Icon ? (
            <div className="w-10 h-10 flex items-center justify-center rounded-md">
              <Icon className="text-[var(--text)]" size={20} />
            </div>
          ) : null}
        </div>
      </div>
      <Text variant="heading-large" className={`mb-2 ${chosen.textClass}`}>
        {value}
      </Text>
      <Text variant="label-small" className="text-accent-paragraph">
        {title}
      </Text>
    </Card>
  );
}
