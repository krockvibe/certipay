import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react";
import type { User, AuthState, SignUpData, SignInData } from "@/types/auth";

interface AuthContextType extends AuthState {
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  signIn: (data: SignInData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  updateUser: (user: Partial<User>) => void;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

type AuthAction =
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SIGN_OUT" }
  | { type: "UPDATE_USER"; payload: Partial<User> };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SIGN_OUT":
      return { ...state, user: null, isAuthenticated: false, isLoading: false };
    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users storage key
const USERS_STORAGE_KEY = "certipay_users";
const CURRENT_USER_KEY = "certipay_current_user";

// Helper functions for user management
function getStoredUsers(): Record<string, { user: User; password: string }> {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, { user: User; password: string }>) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function getCurrentUser(): User | null {
  try {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function setCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on mount
  useEffect(() => {
    const user = getCurrentUser();
    dispatch({ type: "SET_USER", payload: user });
  }, []);

  const signUp = async (data: SignUpData): Promise<{ success: boolean; error?: string }> => {
    if (data.password !== data.confirmPassword) {
      return { success: false, error: "Passwords do not match" };
    }

    if (data.password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }

    const users = getStoredUsers();

    if (users[data.email]) {
      return { success: false, error: "Email already registered" };
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      email: data.email,
      name: data.name,
      createdAt: new Date().toISOString(),
    };

    users[data.email] = { user: newUser, password: data.password };
    saveUsers(users);

    // Auto sign in after signup
    setCurrentUser(newUser);
    dispatch({ type: "SET_USER", payload: newUser });

    return { success: true };
  };

  const signIn = async (data: SignInData): Promise<{ success: boolean; error?: string }> => {
    const users = getStoredUsers();
    const userRecord = users[data.email];

    if (!userRecord) {
      return { success: false, error: "Invalid email or password" };
    }

    if (userRecord.password !== data.password) {
      return { success: false, error: "Invalid email or password" };
    }

    setCurrentUser(userRecord.user);
    dispatch({ type: "SET_USER", payload: userRecord.user });

    return { success: true };
  };

  const signOut = () => {
    setCurrentUser(null);
    dispatch({ type: "SIGN_OUT" });
  };

  const updateUser = (userData: Partial<User>) => {
    if (!state.user) return;

    const updatedUser = { ...state.user, ...userData };
    
    // Update in users storage
    const users = getStoredUsers();
    if (users[state.user.email]) {
      users[state.user.email] = { ...users[state.user.email], user: updatedUser };
      saveUsers(users);
    }
    
    setCurrentUser(updatedUser);
    dispatch({ type: "UPDATE_USER", payload: userData });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signUp,
        signIn,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}