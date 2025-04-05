import Head from "next/head";
import { Header } from "@/components/header";
import { SendForm } from "@/components/send-form";

export default function Send() {
  return (
    <>
      <Head>
        <title>Zest Protocol</title>
        <meta
          name="description"
          content="Send ZEST tokens to anyone, anywhere"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen flex flex-col">
        <Header />
        <div className="border-t border-primary/20" />

        <div className="flex-1 pt-6">
          <SendForm />
        </div>
      </main>
    </>
  );
}
