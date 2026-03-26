import type { ReactNode } from 'react'
import { useState } from 'react'
import { FaCheck } from 'react-icons/fa'
import { Button } from '@src/components/ui/button'
import { Txt } from '@src/components/util/Txt'
import { useCreateCheckoutSessionVaultMutation } from './Premium.codegen'

function PriceWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="extension-surface self-center rounded-[var(--radius-lg)] border border-[color:var(--color-border)] shadow-md lg:self-start">
      {children}
    </div>
  )
}

function PriceCard({
  children,
  cta,
  name,
  popular,
  price
}: {
  children: ReactNode
  cta: ReactNode
  name: string
  popular?: boolean
  price: string
}) {
  return (
    <PriceWrapper>
      <div className="relative">
        {popular ? (
          <div className="absolute left-1/2 top-[-16px] -translate-x-1/2">
            <Txt
              bg="red.700"
              color="gray.100"
              fontSize="sm"
              fontWeight="600"
              noOfLines={1}
              px={3}
              py={1}
              rounded="xl"
              textTransform="uppercase"
            >
              Most Popular
            </Txt>
          </div>
        ) : null}
        <div className="px-12 py-4 text-center">
          <Txt fontSize="2xl" fontWeight="500">
            {name}
          </Txt>
          <div className="flex items-center justify-center">
            <Txt fontSize="3xl" fontWeight="600">
              $
            </Txt>
            <Txt fontSize="5xl" fontWeight="900">
              {price}
            </Txt>
            <Txt color="gray.500" fontSize="3xl">
              /month
            </Txt>
          </div>
        </div>
        <div className="rounded-b-[var(--radius-lg)] bg-[color:var(--color-surface-muted)] px-12 py-4">
          <ul className="space-y-3 text-left text-sm text-[color:var(--color-foreground)]">
            {children}
          </ul>
          <div className="pt-7 text-center">{cta}</div>
        </div>
      </div>
    </PriceWrapper>
  )
}

export default function Premium() {
  const [loading, setLoading] = useState(false)
  const [createCheckoutSessionMutation] =
    useCreateCheckoutSessionVaultMutation()

  const handleCheckout = async () => {
    setLoading(true)
    await createCheckoutSessionMutation({
      variables: {
        product: '2'
      }
    })
    setLoading(false)
  }

  return (
    <div className="py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold text-[color:var(--color-foreground)]">
          Pay per quantity
        </h1>
        <p className="text-lg text-[color:var(--color-muted)]">
          Start small and pay only when you need to scale up.
        </p>
      </div>
      <div className="flex flex-col justify-center gap-4 py-10 text-center lg:flex-row lg:gap-10">
        <PriceCard cta={<div>Always free</div>} name="Free tier" price="0">
          <li className="flex items-center gap-2">
            <FaCheck className="text-emerald-400" />3 TOTP secrets
          </li>
          <li className="flex items-center gap-2">
            <FaCheck className="text-emerald-400" />
            40 login secrets
          </li>
        </PriceCard>

        <PriceCard
          cta={
            <Button className="w-full" variant="outline">
              Buy
            </Button>
          }
          name="Credentials"
          price="1"
        >
          <li className="flex items-center gap-2">
            <FaCheck className="text-emerald-400" />
            additional 60 login secrets
          </li>
        </PriceCard>

        <PriceCard
          cta={
            <Button className="w-full" variant="outline">
              Buy
            </Button>
          }
          name="TOTP"
          price="1"
        >
          <li className="flex items-center gap-2">
            <FaCheck className="text-emerald-400" />
            additional 20 TOTP secrets
          </li>
        </PriceCard>

        <PriceCard
          cta={
            <Button
              className="w-full"
              disabled={loading}
              onClick={handleCheckout}
            >
              Checkout
            </Button>
          }
          name="TOTP and Credentials"
          popular
          price="2"
        >
          <li className="flex items-center gap-2">
            <FaCheck className="text-emerald-400" />
            additional 60 login secrets
          </li>
          <li className="flex items-center gap-2">
            <FaCheck className="text-emerald-400" />
            additional 20 TOTP secrets
          </li>
        </PriceCard>
      </div>
    </div>
  )
}
