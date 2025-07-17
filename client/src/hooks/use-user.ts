import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type User = {
  id: number;
  username: string;
  userType: 'client' | 'partner';
  createdAt: string;
  updatedAt: string;
};

type LoginCredentials = {
  username: string;
  password: string;
  userType: 'client' | 'partner';
};

type RequestResult = {
  success: boolean;
  message: string;
  user?: User;
};

async function handleRequest(
  url: string,
  method: string,
  body?: LoginCredentials
): Promise<RequestResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include"
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || response.statusText
      };
    }

    return data;
  } catch (e: any) {
    return {
      success: false,
      message: e.message || "Une erreur est survenue"
    };
  }
}

async function fetchUser(): Promise<User | null> {
  const response = await fetch('/api/user', {
    credentials: 'include'
  });

  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.user;
}

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, error, isLoading } = useQuery<User | null, Error>({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: Infinity,
    retry: false
  });

  const loginMutation = useMutation<RequestResult, Error, LoginCredentials>({
    mutationFn: (userData) => handleRequest('/api/login', 'POST', userData),
    onSuccess: (data) => {
      if (data.success && data.user) {
        queryClient.setQueryData(['user'], data.user);
      }
    },
  });

  const logoutMutation = useMutation<RequestResult, Error>({
    mutationFn: () => handleRequest('/api/logout', 'POST'),
    onSuccess: () => {
      queryClient.setQueryData(['user'], null);
    },
  });

  const registerMutation = useMutation<RequestResult, Error, LoginCredentials>({
    mutationFn: (userData) => handleRequest('/api/register', 'POST', userData),
    onSuccess: (data) => {
      if (data.success && data.user) {
        queryClient.setQueryData(['user'], data.user);
      }
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync
  };
}