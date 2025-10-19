import { cn } from '@/lib/utils';
import { HTMLMotionProps, motion } from 'framer-motion';

export const GRADIENT_ANGLES = {
  top: 0,
  right: 90,
  bottom: 180,
  left: 270,
};

export type ProgressiveBlurProps = {
  direction?: keyof typeof GRADIENT_ANGLES;
  blurLayers?: number;
  className?: string;
  blurIntensity?: number;
} & HTMLMotionProps<'div'>;

export function ProgressiveBlur({
  direction = 'bottom',
  blurLayers = 8,
  className,
  blurIntensity = 0.25,
  ...props
}: ProgressiveBlurProps) {
  const layers = Math.max(blurLayers, 2);
  const segmentSize = 1 / (blurLayers + 1);

  return (
    <div className={cn('relative', className)}>
      {Array.from({ length: layers }).map((_, index) => {
        const angle = GRADIENT_ANGLES[direction];
        const gradientStops = [
          index * segmentSize * 100,
          (index + 1) * segmentSize * 100,
        ];
        const blur = blurIntensity * (index + 1);

        return (
          <motion.div
            key={index}
            className='absolute inset-0'
            style={{
              maskImage: `linear-gradient(${angle}deg, transparent ${gradientStops[0]}%, black ${gradientStops[1]}%)`,
              WebkitMaskImage: `linear-gradient(${angle}deg, transparent ${gradientStops[0]}%, black ${gradientStops[1]}%)`,
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
            }}
            {...props}
          />
        );
      })}
    </div>
  );
}
