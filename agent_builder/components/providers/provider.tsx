"use client";

import { TooltipProvider } from "../ui/tooltip";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

export function Provider({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
            <TooltipProvider>
                <QueryProvider>
                {children}
                </QueryProvider>
            </TooltipProvider>
        </ThemeProvider>
    );
}