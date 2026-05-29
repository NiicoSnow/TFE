import { useState } from 'react'
import { publicAsset } from '../lib/publicPath'

type PasswordFieldProps = {
  id?: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  minLength?: number
  required?: boolean
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  minLength = 6,
  required = true,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="profile-field" htmlFor={id}>
      <span>{label}</span>
      <div className="profile-password">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="profile-password__toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-pressed={visible}
        >
          <img
            src={publicAsset(visible ? 'assets/visible.svg' : 'assets/notvisible.svg')}
            alt=""
            width={24}
            height={24}
          />
        </button>
      </div>
    </label>
  )
}
