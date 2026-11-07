import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  children?: ReactNode;
};

export function PageHeader({ eyebrow, title, children }: PageHeaderProps) {
  return (
    <header>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 max-w-3xl text-4xl leading-tight sm:text-6xl">{title}</h1>
      {children && <div className="mt-4 max-w-xl text-muted-foreground">{children}</div>}
    </header>
  );
}
