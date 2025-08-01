import React from 'react'
import { render } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'

// Custom render function that includes all providers
export function renderWithProviders(
  ui: React.ReactElement,
  options = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark">
        {children}
      </ThemeProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

// Re-export everything from testing library
export * from '@testing-library/react'
export { renderWithProviders as render }