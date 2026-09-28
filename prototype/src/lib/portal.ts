import { createContext, useContext } from 'react'

/**
 * Destino de portales (hojas, overlays). En la vista del vendedor en computadora es el
 * marco del teléfono, para que las hojas se abran dentro del celular y no sobre la página.
 */
export const PortalCtx = createContext<HTMLElement | null>(null)
export const usePortalTarget = () => useContext(PortalCtx)
