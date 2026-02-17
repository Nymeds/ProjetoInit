import React from 'react';
import { Text } from '../baseComponents/text';
import Card from '../baseComponents/card';

type StatsCardProps = {
  title: string;
  value: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: React.ComponentType<any>;
  color?: 'accent-brand' | 'accent-red' | 'accent-brand-light';
  onClick?: () => void;
  isActive?: boolean;
};

export function StatsCard({ title, value, icon: Icon, color, onClick, isActive = false }: StatsCardProps) {
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
  const interactive = typeof onClick === 'function';

  const cardContent = (
    <Card
      className={`
        bg-background-secondary p-6 border text-center transition-all duration-300
        ${interactive ? 'hover:scale-105 hover:shadow-xl cursor-pointer' : ''}
        ${isActive
          ? 'border-accent-brand shadow-[0_0_0_1px_rgba(87,157,255,0.45),0_16px_35px_rgba(87,157,255,0.22)]'
          : 'border-border-primary'}
      `}
    >
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

  if (!interactive) return cardContent;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-brand"
      aria-pressed={isActive}
    >
      {cardContent}
    </button>
  );
}
