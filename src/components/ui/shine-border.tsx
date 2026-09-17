import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import './shine-border.css';

type ShineColor = string | string[];

/**
 * Reusable, purely decorative border for existing layout elements.
 * Render as an aside to preserve the editor's original grid, scroll areas,
 * keyboard controls and resizable panel widths without an extra wrapper.
 */
export interface ShineBorderProps extends Omit<HTMLAttributes<HTMLElement>, 'color'> {
  as?: 'div' | 'aside' | 'section';
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: ShineColor;
  children: ReactNode;
}

export function ShineBorder({
  as: Element = 'div',
  borderRadius = 12,
  borderWidth = 1,
  duration = 18,
  color = ['#d8ebe8', '#69b8af', '#d8ebe8'],
  className = '',
  style,
  children,
  ...props
}: ShineBorderProps) {
  const colors = Array.isArray(color) ? color : [color];
  const variables = {
    '--bp-shine-radius': `${borderRadius}px`,
    '--bp-shine-width': `${borderWidth}px`,
    '--bp-shine-duration': `${duration}s`,
    '--bp-shine-colors': colors.join(', '),
    ...style,
  } as CSSProperties;

  return (
    <Element className={`bp-shine-border ${className}`.trim()} style={variables} {...props}>
      {children}
    </Element>
  );
}
