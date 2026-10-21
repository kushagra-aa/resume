import { TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'

import { AppDialog } from '#/components/app-dialog'

const DISMISSED_STORAGE_KEY = 'resume:browser-compatibility-notice-dismissed'

type UserAgentData = {
  brands?: ReadonlyArray<{ brand: string }>
}

type BrowserNavigator = Pick<Navigator, 'userAgent'> & {
  userAgentData?: UserAgentData
}

function isChromiumBrowser(browserNavigator: BrowserNavigator) {
  const brands = browserNavigator.userAgentData?.brands ?? []
  if (
    brands.some(({ brand }) =>
      /Chromium|Google Chrome|Microsoft Edge|Opera|Brave/i.test(brand),
    )
  )
    return true

  return /Chrom(?:e|ium)\/|Edg\/|OPR\/|Brave\//i.test(
    browserNavigator.userAgent,
  )
}

function wasDismissed() {
  try {
    return window.sessionStorage.getItem(DISMISSED_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function BrowserCompatibilityNotice() {
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (window.location.pathname.startsWith('/print/')) {
      setReady(true)
      return
    }

    setOpen(!isChromiumBrowser(navigator) && !wasDismissed())
    setReady(true)
  }, [])

  function dismiss() {
    try {
      window.sessionStorage.setItem(DISMISSED_STORAGE_KEY, 'true')
    } catch {
      // Dismissal still applies for the current render if storage is unavailable.
    }
    setOpen(false)
  }

  if (!ready) return null

  return (
    <AppDialog
      open={open}
      title="Best experienced in Chromium"
      description="A quick browser note before you start editing."
      icon={<TriangleAlert size={20} aria-hidden="true" />}
      onClose={dismiss}
      actions={
        <button className="button button-primary" onClick={dismiss}>
          Continue anyway
        </button>
      }
    >
      <p className="browser-compatibility-copy">
        ResuMe is currently optimized for Chromium-based browsers such as
        Chrome, Edge, Brave, and Opera. Some features, especially print and PDF
        output, may not work as expected in Firefox or Safari.
      </p>
      <p className="browser-compatibility-copy">
        We&apos;re working to improve support for other browsers as well.
      </p>
    </AppDialog>
  )
}
