import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUp,
  SignUpButton,
  UserButton
} from '@clerk/nextjs'
import './globals.css'

import { Suspense } from 'react'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>

          <header>
            <Suspense>
              <Show when="signed-out">
                <SignUp/>
              </Show>

              <Show when="signed-in">
          {children}
                
              </Show>
            </Suspense>
          </header>


        </ClerkProvider>
      </body>
    </html>
  )
}