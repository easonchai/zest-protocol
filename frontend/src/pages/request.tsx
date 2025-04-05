import Head from "next/head";
import { Header } from "@/components/header";
import { RequestForm } from "@/components/request-form";

export default function Send() {
  return (
    <>
      <Head>
        <title>Zest Protocol</title>
        <meta name="description" content="Request payments from anyone" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen flex flex-col">
        <Header />
        <div className="border-t border-primary/20" />

        <div className="flex-1 pt-6">
          <RequestForm />
        </div>
      </main>
    </>
  );
}
