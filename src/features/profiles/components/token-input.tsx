import { X } from 'lucide-react'
import { useState } from 'react'

export function splitTokens(value: string) {
  return value
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
}

export function TokenInput({
  label,
  values,
  onChange,
  placeholder = 'Add an item and press Enter',
  className = '',
}: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
}) {
  const [draft, setDraft] = useState('')

  function commit(value = draft) {
    const additions = splitTokens(value)
    if (additions.length) onChange([...values, ...additions])
    setDraft('')
  }

  return (
    <div className={`profile-field ${className}`}>
      <span>{label}</span>
      <div className="profile-token-control" role="group" aria-label={label}>
        {values.map((value, index) => (
          <span className="profile-token" key={index}>
            <input
              aria-label={`Edit ${value}`}
              value={value}
              onChange={(event) =>
                onChange(
                  values.map((token, tokenIndex) =>
                    tokenIndex === index ? event.target.value : token,
                  ),
                )
              }
              onBlur={() =>
                onChange(values.map((token) => token.trim()).filter(Boolean))
              }
            />
            <button
              aria-label={`Remove ${value}`}
              title={`Remove ${value}`}
              className="profile-token-remove"
              type="button"
              onClick={() =>
                onChange(values.filter((_, tokenIndex) => tokenIndex !== index))
              }
            >
              <X size={13} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          aria-label={label}
          value={draft}
          placeholder={placeholder}
          onChange={(event) => {
            const next = event.target.value
            if (next.includes(',')) {
              const parts = next.split(',')
              const complete = parts.slice(0, -1).join(',')
              commit(complete)
              setDraft(parts.at(-1) ?? '')
            } else {
              setDraft(next)
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault()
              commit()
            } else if (event.key === 'Backspace' && !draft && values.length) {
              onChange(values.slice(0, -1))
            }
          }}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData('text')
            if (pasted.includes(',')) {
              event.preventDefault()
              const additions = splitTokens(`${draft}${pasted}`)
              onChange([...values, ...additions])
              setDraft('')
            }
          }}
          onBlur={() => {
            if (draft.trim()) commit()
          }}
        />
      </div>
    </div>
  )
}
