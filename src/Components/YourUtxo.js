import React from 'react';
import useFetchUtxos from '../Hooks/useFetchUtxos';
import { useChoice } from '../Contexts/ChosenUtxo';

function YourUtxo() {
    const url = 'https://mainnet.sandshrew.io/v1/8f32211e11c25c2f0b5084e41970347d';
    const address = 'bc1pf2am4sfm3ja4tluxxwxzr68s68xg8z8ww5qr4ljrep9vmcwkes6sldjq6h';
    const { loading, fetchUtxos, transactionDetails } = useFetchUtxos(url, address);
    const { choice, addToChoice, removeFromChoice } = useChoice();

    const isChosen = (utxo) => {
        return choice.some(item => item.txid === utxo.txid && item.vout === utxo.vout);
    };

    const handleUtxoClick = (utxo) => {
        const detailedUtxo = {
            ...utxo,
            sat_ranges: transactionDetails[`${utxo.txid}:${utxo.vout}`]?.sat_ranges || 'N/A',
            inscriptions: transactionDetails[`${utxo.txid}:${utxo.vout}`]?.inscriptions || 'N/A'
        };
        if (isChosen(utxo)) {
            removeFromChoice(detailedUtxo);
        } else {
            addToChoice(detailedUtxo);
        }
    };

    return (
        <div>
            <div className='flex items-center border-b p-2 bg-black text-white sticky top-0 z-10 font-black text-xl'>
                <button onClick={fetchUtxos} className="absolute text-xs">refresh</button>
                <div className='w-full text-center'>my UTXOs</div>
            </div>
            <div className="">
                {loading ? (
                    <p>Loading UTXOs...</p>
                ) : (
                    Object.keys(transactionDetails).length > 0 ? (
                        <div>
                            {Object.entries(transactionDetails).map(([key, detail]) => (
                                <div 
                                    key={key} 
                                    className={`border-b p-2 lowercase font-sans text-xs cursor-pointer ${isChosen(detail) ? 'bg-green-100' : ''}`}
                                    onClick={() => handleUtxoClick(detail)}
                                >
                                    <p className='text-xs'>utxo: {key}</p>
                                    <p>Block: {detail.status.block_height}</p>
                                    <p>Confirmed: {detail.status.confirmed ? 'Yes' : 'No'}</p>
                                    <p>Value: {detail.value}</p>
                                    {detail.sat_ranges && Array.isArray(detail.sat_ranges) && (
                                        <div className="mt-2">
                                            <p>Sat Ranges: {detail.sat_ranges.map((range, i) => (
                                                <span key={i}>[{range[0]}, {range[1]}]</span>
                                            ))}</p>
                                            <p>Inscriptions: {detail.inscriptions && Array.isArray(detail.inscriptions) ? detail.inscriptions.map((inscription, i) => (
                                                <li key={i}>[{inscription}]</li>
                                            )) : 'N/A'}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No UTXOs found.</p>
                    )
                )}
            </div>
        </div>
    );
}

export default YourUtxo;