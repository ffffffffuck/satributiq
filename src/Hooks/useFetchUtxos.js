import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Кастомный хук для получения UTXO (Unspent Transaction Outputs)
const useFetchUtxos = (url) => {
    // Состояние для хранения списка UTXO по адресам
    const [utxos, setUtxos] = useState({});
    // Состояние для отслеживания загрузки данных
    const [loading, setLoading] = useState(false);
    // Состояние для хранения деталей транзакций (ordinals и payment)
    const [transactionDetails, setTransactionDetails] = useState({});

    
    // Функция для получения UTXO по адресам
    const fetchUtxos = useCallback(() => {
        setLoading(true); // Устанавливаем состояние загрузки в true

        // Получаем список адресов из localStorage
        const storedAddresses = JSON.parse(localStorage.getItem('walletAddresses')) || {};
        // Извлекаем адреса из объектов в массив
        if (Object.keys(storedAddresses).length === 0) {
            console.log('Нет адресов в localStorage');
            setLoading(false); // Устанавливаем состояние загрузки в false
            return;
        }
    
        // Извлекаем адреса из объектов в массив
        const addresses = Object.values(storedAddresses).map(addr => ({
            purpose: addr.purpose,
            address: addr.address
        }));
        console.log('fetchADDRESSES', addresses);
        console.log('[addr.address]', addresses[0].address);


        // Создаем массив промисов для запросов UTXO по каждому адресу
        const fetchPromises = addresses.map(addr =>
            axios.post(url, {
                jsonrpc: "2.0", // Версия протокола JSON-RPC
                id: 1, // Идентификатор запроса
                method: "esplora_address::utxo", // Метод API для получения UTXO
                params: [addr.address] // Параметры запроса (адрес)
            }, {
                headers: {
                    'Content-Type': 'application/json' // Устанавливаем тип контента
                }
            })
        );

        // Выполняем все запросы и обрабатываем результаты
        Promise.all(fetchPromises)
            .then(responses => {
                const newUtxos = {}; // Создаем объект для новых UTXO
                // Проходим по всем ответам
                responses.forEach((response, index) => {
                    const addressObj = addresses[index]; // Получаем текущий адрес
                    const key = `${addressObj.address}:${addressObj.purpose}`;
                    // Если ответ содержит массив результатов, сохраняем его
                    if (response.data && Array.isArray(response.data.result)) {
                        newUtxos[key] = response.data.result;
                        console.log('newUtxos from fetch',newUtxos)
                    } else {
                        newUtxos[key] = []; // Иначе устанавливаем пустой массив
                    }
                });
                setUtxos(newUtxos); // Обновляем состояние UTXO
                // Логируем новые UTXO для отладки
            })
            .catch(error => {
                // Логируем ошибку если запросы завершились неудачно
                console.error('Error fetching UTXOs:', error);
                setLoading(false); // Останавливаем состояние загрузки в случае ошибки
            });
    }, [url]); // Изменить зависимость для актуализации данных

    const fetchTransactionDetails = useCallback(async (utxos) => {
        // Если нет UTXO, выходим из функции
        if (!utxos || Object.keys(utxos).length === 0) return;
        
        const txidVoutMap = {}; // Мапа для хранения соответствий txid:vout и ключа адреса с типом
        const txidVoutArray = []; // Массив для хранения запросов деталей транзакций
        // Проходим по всем UTXO и формируем массив запросов
        Object.entries(utxos).forEach(([key, utxoList]) => {
            utxoList.forEach(utxo => {
                const txidVoutKey = `${utxo.txid}:${utxo.vout}`;
                txidVoutMap[txidVoutKey] = key;
                txidVoutArray.push(["ord_output", [txidVoutKey]]);
            });
        });
        console.log(`TXADDR`, txidVoutMap)
        
        try {
            // Отправляем запрос на получение деталей транзакций
            const response = await axios.post(url, {
                jsonrpc: "2.0", // Версия протокола JSON-RPC
                id: 1, // Идентификатор запроса
                method: "sandshrew_multicall", // Метод API для получения деталей транзакций
                params: txidVoutArray // Параметры запроса (txid и vout)
            }, {
                headers: {
                    'Content-Type': 'application/json' // Устанавливаем тип контента
                }
            });
            console.log(`responseDATA`, response.data)
            const newTransactionDetails = {};
            // Если ответ содержит массив результатов
            if (response.data && Array.isArray(response.data.result)) {
                // Проходим по результатам запросов
                response.data.result.forEach((res, index) => {
                    if (res.result) {
                        const key = txidVoutArray[index][1][0];
                        const mapValue = txidVoutMap[key];
                        if (!newTransactionDetails[mapValue]) {
                            newTransactionDetails[mapValue] = {};
                        }
                        // Получаем цель адреса из сохраненных адресов
                            // Сохраняем результат в соответствующую цель
                        newTransactionDetails[mapValue][key] = {
                            ...res.result,
                        };
                        
                    }
                });
                setTransactionDetails(newTransactionDetails); // Обновляем состояние деталей транзакций
                // Сохраняем детали транзакций в localStorage
                localStorage.setItem('transactionDetails', JSON.stringify(newTransactionDetails));
                // Логируем детали транзакций для отладки
            }
            console.log(`transDetail`, newTransactionDetails)
            setLoading(false); // Останавливаем состояние загрузки
        } catch (error) {
            // Логируем ошибку если запросы завершились неудачно
            console.error('Error fetching transaction details:', error);
            setLoading(false); // Останавливаем состояние загрузки в случае ошибки
        }
    }, [url]); // Зависимость от url

    // Хук useEffect для получения UTXO при монтировании компонента
    useEffect(() => {
        // Проверяем наличие сохраненных деталей транзакций в localStorage
        const storedDetails = localStorage.getItem('transactionDetails');
        if (storedDetails) {
            try {
                const parsedDetails = JSON.parse(storedDetails); // Парсим сохраненные данные
                // Если данные корректны, устанавливаем состояние
                if (typeof parsedDetails === 'object' && parsedDetails !== null) {
                    setTransactionDetails(parsedDetails);
                } else {
                    fetchUtxos(); // Если данные некорректны, вызываем fetchUtxos
                }
            } catch (error) {
                // Логируем ошибку если данные не удалось распарсить
                console.error('Error parsing stored transaction details:', error);
                fetchUtxos(); // В случае ошибки вызываем fetchUtxos
            }
        } else {
            fetchUtxos(); // Если данных нет, вызываем fetchUtxos
        }
    }, [fetchUtxos]); // Зависимость от fetchUtxos

    // Хук useEffect для получения деталей транзакций при изменении UTXO
    useEffect(() => {
        // Если есть UTXO, вызываем fetchTransactionDetails
        if (Object.values(utxos).flat().length > 0) {
            fetchTransactionDetails(utxos);
        }
    }, [utxos, fetchTransactionDetails]); // Зависимость от utxos и fetchTransactionDetails

    // Возвращаем состояния и функции
    return { utxos, loading, fetchUtxos, transactionDetails };
};

export default useFetchUtxos;