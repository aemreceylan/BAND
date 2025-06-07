import * as mediasoup from "mediasoup-client";
import { useRef, useState } from "react";

export default function useCall() {
  const deviceRef = useRef();
  const produceTransportRef = useRef();
  const producerRef = useRef([]);
  const consumeTransportRef = useRef();
  const consumerRef = useRef([]);
  const consumeTransportIdRef = useRef();
  const produceTransportIdRef = useRef();

  const isDisconnect = () => {
    return (
      produceTransportRef.current === null ||
      consumeTransportRef.current === null
    );
  };

  const disconnect = (socket) => {
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
      producerRef.current = [];
      consumerRef.current = [];
      resolve();
    });
  };

  const setupAudio = (socket, index) => {
    return new Promise(async (resolve, reject) => {
      const { track } = consumerRef.current[index];
      const stream = new MediaStream([track]);
      await socket.emitWithAck("msServer", {
        type: "unpause-consumer",
        id: consumerRef.current[index].id,
      });
      const audioElement = document.createElement("audio");
      audioElement.srcObject = stream;
      audioElement.autoplay = true;
      audioElement.className = "rtcCallAudio";
      document.getElementById("hubRtcAudioDiv")?.appendChild(audioElement);
      resolve();
    });
  };

  const setConsumers = (socket) => {
    socket.on("msServer-newProducer", (data) => {
      console.log("User joined:> " + data);
      consumeStream(socket, data);
    });
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
  };

  const init = (socket) => {
    return new Promise(async (resolve, reject) => {
      deviceRef.current = new mediasoup.Device();
      const rtpCap = await socket.emitWithAck("msServer", {
        type: "getRtpCap",
      });
      await deviceRef.current.load({ routerRtpCapabilities: rtpCap });
      resolve();
    });
  };

  const getStreams = (devices) => {
    return new Promise(async (resolve, reject) => {
      const streams = {};
      if (devices.mic.id) {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            deviceId: devices.mic.id,
          },
        });
        streams.audio = audioStream;
      }
      resolve(streams);
    });
  };

  const createProducer = (socket) => {
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
  };

  const publish = (stream, type) => {
    return new Promise(async (resolve, reject) => {
      const track = stream.getTracks()[0];
      producerRef.current.push([
        await produceTransportRef.current.produce({
          track,
        }),
        ,
        type,
      ]);
      resolve();
    });
  };

  const createConsumer = async (socket) => {
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
  };

  const consumeStream = async (socket, producerId) => {
    return new Promise(async (resolve, reject) => {
      const consumer_params = await socket.emitWithAck("msServer", {
        type: "consume-media",
        rtpCapabilities: deviceRef.current.rtpCapabilities,
        c_id: consumeTransportIdRef.current,
        p_id: producerId,
      });
      if (consumer_params) {
        consumerRef.current.push(
          await consumeTransportRef.current.consume(consumer_params)
        );
        setupAudio(socket, consumerRef.current.length - 1);
      }
      console.log(
        "Consuming:" + consumerRef.current[consumerRef.current.length - 1].id
      );
      resolve();
    });
  };

  return [
    init,
    getStreams,
    createProducer,
    publish,
    createConsumer,
    setConsumers,
    disconnect,
    isDisconnect,
  ];
}
