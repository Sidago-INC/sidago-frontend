import React from "react";
import Heading from "./Heading";
import Branding from "./Branding";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Heading />
      <main className="grow flex flex-col md:flex-row pt-16">
        <Branding />
        {children}
      </main>
    </div>
  );
}
