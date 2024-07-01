import React from 'react';
import Header from './Components/Header';
import Footer from './Components/Footer';
import AddUtxo from './Components/AddUtxo';
import { ChoiceProvider } from './Contexts/ChosenUtxo';
import TransactionCanvas from './Components/TransactionCanvas/TransactionCanvas';
import CreateTransaction from './Components/TransactionCanvas/CreateTransaction';

function App() {
  return (
      <React.StrictMode>
        <Header />
        <ChoiceProvider>
            <div className="flex-grow mt-3 mb-1 flex flex-col h-full">
              <AddUtxo />
              <CreateTransaction />
              <TransactionCanvas />
            </div>
        </ChoiceProvider>
        <Footer />
      </React.StrictMode>
  );
}

export default App;