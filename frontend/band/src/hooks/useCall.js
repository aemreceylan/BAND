import * as mediasoup from "mediasoup-client";
import { useCallback, useRef } from "react";

export default function useCall(setConsumingStreams) {
  const deviceRef = useRef();
  const produceTransportRef = useRef();
  const producerRef = useRef(new Map());
  const consumeTransportRef = useRef();
  const consumerRef = useRef(new Map());
  const consumeTransportIdRef = useRef();
  const produceTransportIdRef = useRef();

  const closeProduce = useCallback((key, socket) => {
    return new Promise(async (resolve, reject) => {
      const response = await socket.emitWithAck("msServer", {
        type: "close-producer",
        id: producerRef.current.get(key).id,
      });

      if (response) {
        console.log(
          "Producer Closed :> Type: " +
            producerRef.current.get(key).appData.type
        );
        producerRef.current.delete(key);
      }
      resolve();
    });
  }, []);

  const waitNewProducers = useCallback(
    (() => {
      let isInitialized = false;

      return (socket) => {
        if (isInitialized) return;
        isInitialized = true;
        socket.on("msServer-newProducer", (data) => {
          console.log("New produce:> " + data);
          consumeStream(socket, data);
        });
        socket.on("msServer-producerClosed", (data) => {
          console.log("A user has closed their connection:> " + data.type);
          setConsumingStreams((prev) => ({
            ...prev,
            [data.type]: prev[data.type].filter(
              (element) => element.userId != data.userId
            ),
          }));
        });
      };
    })(),
    []
  );

  const isDisconnect = useCallback(() => {
    return (
      produceTransportRef.current === null ||
      consumeTransportRef.current === null
    );
  });

  const disconnect = useCallback((socket) => {
    return new Promise(async (resolve, reject) => {
      const response = await socket.emitWithAck("msServer", {
        type: "close-transports",
        p_id: produceTransportIdRef.current,
        c_id: consumeTransportIdRef.current,
      });
      produceTransportRef.current?.close();
      consumeTransportRef.current?.close();
      console.log("Disconnect");
      produceTransportRef.current = null;
      consumeTransportRef.current = null;
      consumeTransportIdRef.current = null;
      produceTransportIdRef.current = null;
      producerRef.current.clear();
      consumerRef.current.clear();
      resolve();
    });
  }, []);

  const setupAudio = useCallback((socket, key, userId) => {
    return new Promise(async (resolve, reject) => {
      const { track } = consumerRef.current.get(key);
      const stream = new MediaStream([track]);
      await socket.emitWithAck("msServer", {
        type: "unpause-consumer",
        id: consumerRef.current.get(key).id,
      });
      setConsumingStreams((prev) => ({
        ...prev,
        audio: [...prev.audio, { stream, userId }],
      }));
      resolve();
    });
  }, []);

  const setupCam = useCallback((socket, key, userId) => {
    return new Promise(async (resolve, reject) => {
      const { track } = consumerRef.current.get(key);
      const stream = new MediaStream([track]);
      await socket.emitWithAck("msServer", {
        type: "unpause-consumer",
        id: consumerRef.current.get(key).id,
      });
      setConsumingStreams((prev) => ({
        ...prev,
        cam: [...prev.cam, { stream, userId }],
      }));
      resolve();
    });
  }, []);

  const setConsumers = useCallback((socket) => {
    return new Promise(async (resolve, reject) => {
      const response = await socket.emitWithAck("msServer", {
        type: "get-producer-list",
        produceTransportId: produceTransportIdRef.current,
      });
      response.forEach(async (element) => {
        consumeStream(socket, element);
      });
      resolve();
    });
  }, []);

  const init = useCallback((socket) => {
    return new Promise(async (resolve, reject) => {
      deviceRef.current = new mediasoup.Device();
      const rtpCap = await socket.emitWithAck("msServer", {
        type: "getRtpCap",
      });
      await deviceRef.current.load({ routerRtpCapabilities: rtpCap });
      resolve();
    });
  }, []);

  const getStreams = useCallback((devices, types) => {
    return new Promise(async (resolve, reject) => {
      const streams = {};
      if (devices.mic.id && types.includes("audio")) {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            deviceId: devices.mic.id,
          },
        });
        streams.audio = audioStream;
      }
      if (devices.cam.id && types.includes("cam")) {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: devices.cam.id,
            facingMode: "user",
            frameRate: { ideal: 30, max: 60 },
          },
        });
        streams.cam = camStream;
      }
      if (devices.screen.id && types.includes("screen")) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
            frameRate: { ideal: 30, max: 60 },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
          },
          audio: true,
        });
        streams.screen = screenStream;
      }
      resolve(streams);
    });
  }, []);

  const createProducer = useCallback((socket) => {
    return new Promise(async (resolve, reject) => {
      const transport_params = await socket.emitWithAck("msServer", {
        type: "create-producer-transport",
      });
      produceTransportIdRef.current = transport_params.id;
      produceTransportRef.current =
        deviceRef.current.createSendTransport(transport_params);
      produceTransportRef.current.on(
        "connect",
        async ({ dtlsParameters }, callback, errback) => {
          const response = await socket.emitWithAck("msServer", {
            type: "connect-transport",
            dtlsParameters,
            id: transport_params.id,
          });
          if (response) {
            callback();
            console.log("Producer Connection Success");
          } else {
            errback();
            console.log("Producer Connection Error");
          }
        }
      );
      produceTransportRef.current.on(
        "produce",
        async (params, callback, errback) => {
          const response = await socket.emitWithAck("msServer", {
            type: "start-producing",
            params,
            id: transport_params.id,
          });
          if (response == -1) {
            errback();
            console.log("Producer Produce Error");
          } else {
            callback({ id: response });
            console.log("Producer Produce Success");
          }
        }
      );
      resolve();
    });
  }, []);

  const publish = useCallback((stream, _type) => {
    return new Promise(async (resolve, reject) => {
      const track = stream.getTracks()[0];
      const producer = await produceTransportRef.current.produce({
        track,
        appData: { type: _type },
      });
      producerRef.current.set(producer.id, producer);
      resolve({ type: _type, key: producer.id });
    });
  }, []);

  const createConsumer = useCallback(async (socket) => {
    return new Promise(async (resolve, reject) => {
      const transport_params = await socket.emitWithAck("msServer", {
        type: "create-consumer-transport",
      });
      consumeTransportIdRef.current = transport_params.id;
      consumeTransportRef.current =
        deviceRef.current.createRecvTransport(transport_params);
      consumeTransportRef.current.on(
        "connect",
        async ({ dtlsParameters }, callback, errback) => {
          const response = await socket.emitWithAck("msServer", {
            type: "connect-transport",
            dtlsParameters,
            id: transport_params.id,
          });
          if (response) {
            callback();
            console.log("Consumer Connection Success");
          } else {
            errback();
            console.log("Consumer Connection Error");
          }
        }
      );
      resolve();
    });
  }, []);

  const consumeStream = useCallback((socket, producerId) => {
    return new Promise(async (resolve, reject) => {
      const consumer_params = await socket.emitWithAck("msServer", {
        type: "consume-media",
        rtpCapabilities: deviceRef.current.rtpCapabilities,
        c_id: consumeTransportIdRef.current,
        p_id: producerId,
      });
      if (consumer_params) {
        const consumer = await consumeTransportRef.current.consume(
          consumer_params
        );
        consumerRef.current.set(consumer.id, consumer);
        if (consumer_params.appData.type == "audio")
          setupAudio(socket, consumer.id, consumer_params.appData.userId);
        else if (consumer_params.appData.type == "cam")
          setupCam(socket, consumer.id, consumer_params.appData.userId);
        console.log("Consuming:" + consumerRef.current.get(consumer.id).id);
      }
      resolve();
    });
  }, []);

  return [
    init,
    getStreams,
    createProducer,
    publish,
    createConsumer,
    setConsumers,
    disconnect,
    isDisconnect,
    waitNewProducers,
    closeProduce,
  ];
}
