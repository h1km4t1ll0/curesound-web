import {useCallback, useEffect, useRef, useState} from "react";
import {CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";

import {processPacket, saveBinaryFile} from "./utils.ts";
import axios from "axios";
import {useNavigate} from "react-router-dom";

type DataPoint = { timestamp: number; value: number };

const HEART_RATE_UUID = "0000ffb1-0000-1000-8000-00805f9b34fb";
const HEART_RATE_CHARACTERISTIC = "0000ffb2-0000-1000-8000-00805f9b34fb";
const API_URL = import.meta.env.VITE_API_URL;

const BluetoothHeartRateMonitor = () => {
  const [device, setDevice] = useState(null);
  const [isSampling, setIsIsSampling] = useState<boolean>(false);
  const [data, setData] = useState<DataPoint[]>([]);

  const navigate = useNavigate();

  const rawData = useRef<DataPoint[]>([]);
  const dataToSend = useRef<DataPoint[]>([]);
  const curTimestamp = useRef<number>(Date.now());
  const elapsedTime = useRef<number>(0);
  const veryRawData = useRef<Uint8Array[]>([]);

  const getStressIndex = useCallback(async () => {
    try {
      const stressIndexData = await axios.post(API_URL, dataToSend.current);
      navigate(`/checkup-result/${stressIndexData.data?.stressIndex ?? -1}`);
    } catch (e) {
      console.error('debug data:', API_URL, dataToSend.current);
      console.error(e);
    }
  }, [navigate]);

  const onGattServerDisconnected = useCallback(async () => {
    // elapsedTime.current = 0;
    try {
      // @ts-expect-error TS2339
      await device.gatt.disconnect();
    } catch (e) {
      console.error(e);
    }
    // rawData.current = [];
    // setData([]);
    await getStressIndex();

    const totalLength = veryRawData.current.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);

    let offset = 0;
    for (const arr of veryRawData.current) {
      result.set(arr, offset);
      offset += arr.length;
    }

    saveBinaryFile(result, 'data.bin')
    setIsIsSampling(false);
    // dataToSend.current = [];
  }, [device, getStressIndex]);

  const disconnectDevice = useCallback(async () => {
    if (device) {

      // await device.gatt.disconnect();
      await onGattServerDisconnected();
      // @ts-expect-error TS2339
      console.log('Disconnected from', device.name);
    }
  }, [device, onGattServerDisconnected]);

  const connectToDevice = useCallback(async () => {
    if (isSampling) {
      await disconnectDevice();
    } else {
      try {
        // @ts-expect-error TS2339
        const device = await navigator.bluetooth.requestDevice({
          filters: [{namePrefix: 'We',}],
          optionalServices: [HEART_RATE_CHARACTERISTIC, HEART_RATE_UUID]
        });
        // await device.gatt.disconnect();
        const server = await device.gatt.connect();
        setDevice(device);
        console.log('Connected to', device.name);

        const service = await server.getPrimaryService(HEART_RATE_UUID);
        const characteristic = await service.getCharacteristic(HEART_RATE_CHARACTERISTIC);

        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
        device.addEventListener("gattserverdisconnected", onGattServerDisconnected);

        console.log('Listening for heart rate notifications...');
        setIsIsSampling(true)
      } catch (err) {
        console.error('Connection failed', err);
      }
    }
  }, [disconnectDevice, onGattServerDisconnected, isSampling]);

  const handleCharacteristicValueChanged = (event: { target: { value: { buffer: ArrayBufferLike } } }) => {
    veryRawData.current.push(new Uint8Array(event.target.value.buffer));
    const value = processPacket(new Uint8Array(event.target.value.buffer))?.[0];
    if (!value) {
      return
    }

    dataToSend.current = [...dataToSend.current, ...value.map((e) => {
      curTimestamp.current += 2.5;
      return {
        timestamp: curTimestamp.current,
        value: e,
      }
    })];
    rawData.current = [...rawData.current, ...value.map((e) => {
      curTimestamp.current += 2.5;
      return {
        timestamp: curTimestamp.current,
        value: e,
      }
    })];
  };

  useEffect(() => {
    if (isSampling) {
      const interval = setInterval(() => {
        setData(rawData.current.slice(-1000));
      }, 1000 / 30);

      return () => clearInterval(interval);
    }
  }, [isSampling]);

  useEffect(() => {
    if (isSampling) {
      const interval = setInterval(() => {
        elapsedTime.current += 1;
        rawData.current = rawData.current.slice(-1000);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isSampling]);

  return (
    <div>
      <h1>Fast CureSound checkup</h1>
      <div>
        <button onClick={connectToDevice}>{isSampling ? 'Disconnect' : 'Connect'}</button>
      </div>
      {
        isSampling && (
          <>
            <h2>Elapsed time: {elapsedTime.current}</h2>
            <ResponsiveContainer width="100%" height={400} style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginLeft: '-5%',
            }}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="timestamp" tickFormatter={time => new Date(time).toLocaleTimeString()} tick={false}/>
                <YAxis tick={false}/>
                <Tooltip/>
                <Line type="monotone" dataKey="value" stroke="#8884d8" dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </>
        )
      }
    </div>
  );
};

export default BluetoothHeartRateMonitor;