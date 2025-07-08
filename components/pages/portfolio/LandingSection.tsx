'use client';

import { GeistMono } from 'geist/font/mono';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton';

export const LandingSection = () => {
  return (
    <div className={cn('min-h-screen flex flex-col', GeistMono.className)}>
      <div className="container-layout pt-6">
        <Header />
      </div>

      <main className="container-layout py-6 flex-1 flex items-center justify-center">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />

        <div className="relative w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
          {/* Left Side - Big Text */}
          <div className="space-y-4 sm:space-y-6 text-center lg:text-left">
            <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
              <span className="block text-primary bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                A Complete
              </span>
              <span className="block text-muted-foreground -mt-1 sm:-mt-2">
                Overview
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0 mb-6 sm:mb-8">
              Track all your assets, DeFi positions, and NFTs in real-time
              across the Aptos ecosystem
            </p>

            {/* CTA Button */}
            <div className="flex justify-center lg:justify-start">
              <WalletConnectButton size="default" />
            </div>
          </div>

          {/* Right Side - Logo with Text */}
          <div className="relative flex justify-center order-first lg:order-last">
            {/* Large APT Logo Background */}
            <div className="relative flex items-center justify-center">
              <div className="w-48 h-48 xs:w-56 xs:h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 opacity-15 dark:opacity-25">
                <Image
                  src="/icons/apt.png"
                  alt="Aptos"
                  width={320}
                  height={320}
                  className="object-contain dark:invert w-full h-full"
                  onError={e => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/placeholder.jpg';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
