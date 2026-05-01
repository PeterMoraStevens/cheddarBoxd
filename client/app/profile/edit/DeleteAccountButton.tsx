'use client'

import { useState, useTransition } from 'react'
import { deleteAccount } from './actions'

export function DeleteAccountButton() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      await deleteAccount()
    })
  }

  if (showConfirm) {
    return (
      <div className="neo-card p-4 flex flex-col gap-4 border-2 border-red-500">
        <p className="text-sm font-semibold text-[color:var(--text)]">
          This will permanently delete your account and all your data. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirm(false)}
            disabled={isPending}
            className="neo-btn bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold border-2 border-[color:var(--border)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="neo-btn bg-red-500 text-white px-4 py-2 text-sm font-semibold border-2 border-red-500 hover:bg-red-600 hover:border-red-600 disabled:opacity-50"
          >
            {isPending ? 'Deleting…' : 'Yes, delete my account'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="neo-btn px-4 py-2 text-sm font-semibold border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
    >
      Delete Account
    </button>
  )
}
