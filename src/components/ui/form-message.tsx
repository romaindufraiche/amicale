import type { FormState } from '@/lib/form-state'
import { Alert } from './alert'

/** Message global d'un formulaire, annoncé aux lecteurs d'écran à chaque changement. */
export function FormMessage({ state }: { state: FormState }) {
  if (state.status === 'idle' || !state.message) return null
  return state.status === 'success' ? (
    <Alert tone="success" title={state.message} />
  ) : (
    <Alert tone="danger" role="alert" title={state.message} />
  )
}
