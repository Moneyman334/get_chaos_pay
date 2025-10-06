import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { fetchWithRetry } from "./api-retry";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const shouldIncludeBody = method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD';
  
  const options: RequestInit = {
    method,
    credentials: "include",
  };

  if (shouldIncludeBody && data) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(data);
  }
  
  const res = await fetchWithRetry(url, options, {
    maxRetries: 2,
    initialDelay: 1000,
    retryableStatuses: [408, 429, 500, 502, 503, 504]
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetchWithRetry(queryKey.join("/") as string, {
      credentials: "include",
    }, {
      maxRetries: 3,
      initialDelay: 1000,
      retryableStatuses: [408, 429, 500, 502, 503, 504]
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: Infinity,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: {
      retry: 2,
      retryDelay: 1000,
    },
  },
});
