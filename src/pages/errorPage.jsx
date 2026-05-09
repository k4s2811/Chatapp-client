import React from 'react';


export default function MyFallbackComponent({ error, resetErrorBoundary }) {

  return (
    <div className="min-h-[100dvh] w-full bg-background relative flex items-center justify-center p-4 font-sans selection:bg-destructive/30 overflow-hidden">
      
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <svg className="absolute inset-0 w-full h-full text-foreground" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="120" height="120" patternUnits="userSpaceOnUse">
              <path d="M 120 0 L 0 0 0 120" fill="none" stroke="currentColor" strokeWidth="1"/>
              <path d="M 0 0 L 120 120" fill="none" stroke="currentColor" strokeWidth="1"/>
              <path d="M 120 0 L 0 120" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-foreground/5 to-transparent pointer-events-none" />

      <button 
        className="absolute top-6 right-6 md:top-10 md:right-10 flex items-center gap-2 px-4 py-2.5 border border-border rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-foreground/20 transition-all uppercase tracking-[0.15em] z-20 backdrop-blur-sm"
        onClick={() => {alert("contact us")}}
      >
        Know More
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>

      <div className="relative z-10 w-full max-w-[540px] bg-card text-card-foreground rounded-xl border border-border shadow-2xl p-8 md:p-12 flex flex-col items-center text-center">
        
        <div className="mb-6">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="60" 
            height="60" 
            viewBox="0 0 24 24" 
            fill="none" 
            className="text-destructive drop-shadow-md"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" fill="currentColor" />
            <path d="M12 9v4" stroke="var(--card)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 17h.01" stroke="var(--card)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="text-foreground text-[17px] md:text-lg font-semibold tracking-[0.08em] uppercase mb-4">
          Oops! Something went wrong
        </h1>

        <p className="text-muted-foreground text-[11px] md:text-xs font-medium tracking-[0.05em] uppercase leading-[1.8] max-w-[380px] mb-8">
          We're sorry, but an unexpected error has occurred. You can try recovering the page or going back.
        </p>

        <button 
          onClick={resetErrorBoundary}
          className="bg-destructive hover:opacity-90 text-destructive-foreground text-[11px] md:text-xs font-bold tracking-[0.1em] uppercase px-8 py-3.5 rounded-md transition-all active:scale-[0.98] mb-10 shadow-lg shadow-destructive/20"
        >
          Try Again
        </button>

        <div className="flex flex-col items-center gap-3 w-full">
          <button className="flex items-center gap-1.5 text-muted-foreground text-[13px] hover:text-foreground transition-colors cursor-default">
            Error Details
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 rotate-90">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
          
          <pre className="text-muted-foreground font-mono text-[11px] tracking-wider bg-muted/40 border border-border/50 px-4 py-2.5 rounded-md w-full max-w-full overflow-x-auto whitespace-pre-wrap break-words">
            {error?.message || "Unknown error occurred"}
          </pre>
        </div>

      </div>
    </div>
  );
}