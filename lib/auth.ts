export interface AuthState {
  user: any | null;
  session: any | null;
  tenant: any | null;
  tenants: any[];
  loading: boolean;
  error: string | null;
}

export const initialAuthState: AuthState = {
  user: null,
  session: null,
  tenant: null,
  tenants: [],
  loading: true,
  error: null,
};