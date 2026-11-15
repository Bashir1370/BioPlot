import type {CSSProperties} from 'react';
import {House,SquaresFour,Graph,Sparkle,Check,Play,Pause,ArrowRight} from '@phosphor-icons/react';

/** Tiny icon subset for Home. The full StudioIcon set remains editor-only. */
const icons={
  home:House,
  templates:SquaresFour,
  figure:Graph,
  sparkle:Sparkle,
  done:Check,
  play:Play,
  pause:Pause,
  arrow:ArrowRight,
} as const;
export type HomeIconName=keyof typeof icons;

export function HomeIcon({name,size=20,style}:{name:HomeIconName;size?:number;style?:CSSProperties}) {
  const Glyph=icons[name];
  return <Glyph className="studio-ui-icon" size={size} aria-hidden="true" focusable="false" style={style}/>;
}
