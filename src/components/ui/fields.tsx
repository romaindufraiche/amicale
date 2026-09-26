import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/*
 * Champs de formulaire. Chaque champ associe explicitement son libellé, son aide
 * et son message d'erreur (aria-describedby / aria-invalid) : aucun champ sans label.
 */

const controlBase =
  'block w-full rounded-sm border bg-surface px-3.5 text-base text-ink transition-colors ' +
  'placeholder:text-ink-muted hover:border-ink focus-visible:border-blue-500 focus-visible:outline-offset-0 ' +
  'disabled:cursor-not-allowed disabled:bg-sunken'

function controlClasses(invalid: boolean, extra?: string) {
  return cn(controlBase, invalid ? 'border-danger-700' : 'border-line-strong', extra)
}

type FieldFrameProps = {
  id: string
  label: string
  hint?: ReactNode
  error?: string
  required?: boolean
  optionalLabel?: boolean
  className?: string
  children: ReactNode
}

function FieldFrame({
  id,
  label,
  hint,
  error,
  required,
  optionalLabel = true,
  className,
  children,
}: FieldFrameProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="font-semibold text-ink">
        {label}
        {!required && optionalLabel ? (
          <span className="font-normal text-ink-muted"> (facultatif)</span>
        ) : null}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-semibold text-danger-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function describedBy(id: string, hint: unknown, error: unknown): string | undefined {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined
}

type CommonProps = {
  name: string
  label: string
  hint?: ReactNode
  error?: string
  required?: boolean
  optionalLabel?: boolean
  className?: string
}

export function TextField({
  name,
  label,
  hint,
  error,
  required,
  optionalLabel,
  className,
  id = name,
  ...input
}: CommonProps & Omit<ComponentProps<'input'>, 'name' | 'className'>) {
  return (
    <FieldFrame
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optionalLabel={optionalLabel}
      className={className}
    >
      <input
        id={id}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={controlClasses(Boolean(error), 'h-12')}
        {...input}
      />
    </FieldFrame>
  )
}

export function TextareaField({
  name,
  label,
  hint,
  error,
  required,
  optionalLabel,
  className,
  id = name,
  rows = 5,
  ...textarea
}: CommonProps & Omit<ComponentProps<'textarea'>, 'name' | 'className'>) {
  return (
    <FieldFrame
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optionalLabel={optionalLabel}
      className={className}
    >
      <textarea
        id={id}
        name={name}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={controlClasses(Boolean(error), 'py-3 leading-relaxed')}
        {...textarea}
      />
    </FieldFrame>
  )
}

export function SelectField({
  name,
  label,
  hint,
  error,
  required,
  optionalLabel,
  className,
  id = name,
  options,
  placeholder,
  ...select
}: CommonProps &
  Omit<ComponentProps<'select'>, 'name' | 'className' | 'children'> & {
    options: readonly { value: string; label: string }[]
    placeholder?: string
  }) {
  return (
    <FieldFrame
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optionalLabel={optionalLabel}
      className={className}
    >
      <select
        id={id}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={controlClasses(Boolean(error), 'h-12 pr-10')}
        {...select}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  )
}

export function CheckboxField({
  name,
  label,
  error,
  id = name,
  className,
  ...input
}: { name: string; label: ReactNode; error?: string; className?: string } & Omit<
  ComponentProps<'input'>,
  'name' | 'className' | 'type'
>) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-start gap-3">
        <input
          id={id}
          name={name}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-1 size-5 shrink-0 accent-red-600"
          {...input}
        />
        <label htmlFor={id} className="text-ink">
          {label}
        </label>
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm font-semibold text-danger-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}
