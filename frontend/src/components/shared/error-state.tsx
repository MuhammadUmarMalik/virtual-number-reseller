import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 px-6 py-16 text-center dark:border-red-500/20 dark:bg-red-500/10">
      <h3 className="text-base font-medium text-red-800 dark:text-red-300">
        Something went wrong
      </h3>
      <p className="mt-1 max-w-md text-sm text-red-700 dark:text-red-400">
        {message}
      </p>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          className="mt-4 border-red-300 bg-white text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:bg-transparent dark:text-red-300 dark:hover:bg-red-500/10"
          onClick={onRetry}
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  );
}
