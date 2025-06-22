import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false,
    },
  },
});

export const ReactQueryProvider = ({ children }: React.PropsWithChildren) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export const ServerReactQueryProvider = ({
  children,
}: React.PropsWithChildren) => {
  const [clientSideQueryClient] = useState(() => queryClient);
  return (
    <QueryClientProvider client={clientSideQueryClient}>
      {children}
    </QueryClientProvider>
  );
};
