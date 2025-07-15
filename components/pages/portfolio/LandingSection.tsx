'use client';

import { GeistMono } from 'geist/font/mono';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton';

export const LandingSection = () => {
  return (
    <div
      className={cn('min-h-screen flex flex-col relative', GeistMono.className)}
    >
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />

      <div className="container-layout pt-6 relative z-10">
        <Header />
      </div>

      <main className="container-layout py-6 md:py-12 flex-1 flex flex-col relative z-10">
        {/* Main content container */}
        <div className="flex-1 flex items-center">
          <div className="relative w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
            {/* Left Side - Big Text */}
            <div className="space-y-4 md:space-y-6 text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                <span className="block text-primary bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                  A Complete
                </span>
                <span className="block text-muted-foreground -mt-1 sm:-mt-2">
                  Overview
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-muted-foreground leading-relaxed max-w-lg mx-auto md:mx-0 mb-6 md:mb-8">
                Track all your assets, DeFi positions, and NFTs in real-time
                across the Aptos ecosystem
              </p>

              {/* CTA Button */}
              <div className="flex justify-center md:justify-start">
                <WalletConnectButton size="default" />
              </div>
            </div>

            {/* Right Side - Logo */}
            <div className="relative flex items-center justify-center order-first md:order-last w-full">
              {/* Large APT Logo Background */}
              <div className="relative flex items-center justify-center">
                <div className="w-32 h-32 xs:w-40 xs:h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 xl:w-72 xl:h-72 opacity-15 dark:opacity-25">
                  <Image
                    src="/icons/apt.png"
                    alt="Aptos"
                    width={448}
                    height={448}
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
        </div>
      </main>

      <Footer className="relative z-10" />
    </div>
  );
};
