"use client";

import { useState } from "react";
import Head from "next/head";
import { Header } from "@/components/header";
import { StakingTabs } from "@/components/staking-tabs";
import { StakingForm } from "@/components/staking-form";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");

  return (
    <>
      <Head>
        <title>Zest Protocol</title>
        <meta
          name="description"
          content="Spend like it's fiat, stack like it's BTC, program like it's DeFi."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen flex flex-col">
        <Header />
        <div className="border-t border-primary/20" />

        <div className="flex-1 pt-6">
          <StakingTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === "stake" ? (
            <StakingForm />
          ) : (
            <div className="text-center text-gray-500 p-8">
              Unstaking is currently in development. It&apos;s a hackathon
              bro... 🚧
            </div>
          )}
        </div>
      </main>
    </>
  );
}
