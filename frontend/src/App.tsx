import { ReactElement } from 'react';
import { Short } from './components/Short';
import Header from './components/Header';
import Footer from './components/Footer';
import Background from './components/Background';

export function App(): ReactElement {
  return (
    <>
      <Background>
        <Header />
        <Short />
        <Footer />
      </Background>
    </>
  );
}
