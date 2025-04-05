import Head from "next/head";
import { Header } from "@/components/header";
import { BorrowForm } from "@/components/borrow-form";

export default function Borrow() {
  return (
    <>
      <Head>
        <title>Zest Protocol</title>
        <meta
          name="description"
          content="Borrow against your BTC to mint Zest"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen flex flex-col">
        <Header />
        <div className="border-t border-primary/20" />

        <div className="flex-1 pt-6">
          <BorrowForm />
        </div>
      </main>
    </>
  );
}
