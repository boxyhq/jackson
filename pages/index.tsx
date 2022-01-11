import type { NextPage } from 'next';
import { signIn, signOut, useSession } from "next-auth/react";

const Home: NextPage = () => {
  const email = 'kiran@boxyhq.com';
  const { data: session, status } = useSession()

  if (session) {
    return (
      <>
        Signed in as {session?.user?.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }

  return (
    <>
      Not signed in <br />
      <button onClick={() => signIn('kiran@boxyhq.com')}>Sign in</button>
    </>
  );
};

export default Home;
