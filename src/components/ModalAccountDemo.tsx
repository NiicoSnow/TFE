import { useEffect, useState } from 'react'
import { publicAsset } from '../lib/publicPath'

const DEMO_EMAIL = 'admin@heaj.be'
const DEMO_PASSWORD = 'adminheaj'

type CopiedField = 'email' | 'password' | null

export function ModalAccountDemo() {
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState<CopiedField>(null)

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(null), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function copyValue(field: Exclude<CopiedField, null>, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(field)
    } catch {
      //
    }
  }

  if (!open) return null

  function iconMaskStyle(file: string) {
    const url = `url(${publicAsset(file)})`
    return { maskImage: url, WebkitMaskImage: url }
  }

  return (
    <aside
      className="modal-account-demo"
      role="status"
      aria-labelledby="modal-account-demo-title"
    >
      <div className="modal-account-demo__header">
        <h2 id="modal-account-demo-title" className="modal-account-demo__title">
          Compte mis à disposition
        </h2>
        <button
          type="button"
          className="modal-account-demo__close"
          onClick={() => setOpen(false)}
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
      <p className="modal-account-demo__text">
        Un compte de test est disponible à l'adresse suivante&nbsp;:
      </p>
      <dl className="modal-account-demo__creds">
        <div>
          <dt>Email</dt>
          <dd>
            <span>{DEMO_EMAIL}</span>
            <button
              type="button"
              className="modal-account-demo__copy"
              onClick={() => copyValue('email', DEMO_EMAIL)}
              aria-label={copied === 'email' ? 'Email copié' : 'Copier l’email'}
            >
              <span
                className="modal-account-demo__copy-icon"
                style={iconMaskStyle(copied === 'email' ? 'assets/inlist.svg' : 'assets/copy.svg')}
              />
            </button>
          </dd>
        </div>
        <div>
          <dt>Mot de passe</dt>
          <dd>
            <span>{DEMO_PASSWORD}</span>
            <button
              type="button"
              className="modal-account-demo__copy"
              onClick={() => copyValue('password', DEMO_PASSWORD)}
              aria-label={copied === 'password' ? 'Mot de passe copié' : 'Copier le mot de passe'}
            >
              <span
                className="modal-account-demo__copy-icon"
                style={iconMaskStyle(copied === 'password' ? 'assets/inlist.svg' : 'assets/copy.svg')}
              />
            </button>
          </dd>
        </div>
      </dl>
    </aside>
  )
}
