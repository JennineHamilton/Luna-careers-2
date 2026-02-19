// Auth actions (server-side)
export {
  login,
  signup,
  logout,
  requestPasswordReset,
  updatePassword,
  switchContext,
  type AuthResult,
  type SignupData,
  type LoginData,
} from './actions';

// Auth hook (client-side)
export { useAuth, type AuthUser, type UseAuthReturn } from './useAuth';

