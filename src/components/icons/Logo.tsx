import { BookOpenCheck } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

export function Logo(props: LucideProps) {
  return (
    <div className="flex items-center gap-2">
      <BookOpenCheck {...props} className={props.className || "h-7 w-7 text-primary"} />
      <span className="font-headline text-xl font-semibold text-foreground">Course Compass</span>
    </div>
  );
}
