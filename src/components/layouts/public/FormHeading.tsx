import React from "react";

export type Props = {
  title: string;
  subtitle: string;
};

export default function FormHeading({ title, subtitle }: Props) {
  return (
    <div className="mb-10 text-center md:text-left">
      <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        {title}
      </h2>

      <p className="text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  );
}
