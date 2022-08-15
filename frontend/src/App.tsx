import { ReactElement } from 'react';
import { ActivateDeactivate } from './components/ActivateDeactivate';
import { Short } from './components/Short';
import { SectionDivider } from './components/SectionDivider';
import { SignMessage } from './components/SignMessage';
import { WalletStatus } from './components/WalletStatus';
import Header from './components/Header';
import Footer from './components/Footer';
import Background from './components/Background';

export function App(): ReactElement {
  return (
    <Background>
      {/* <ActivateDeactivate />
      <SectionDivider />
      <WalletStatus />
      <SectionDivider /> */}
      <Header />
      {/* <SignMessage /> */}
      <Short />
      <Footer />
    </Background>
  );
}
