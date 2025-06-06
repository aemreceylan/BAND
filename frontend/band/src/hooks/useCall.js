import * as mediasoup from "mediasoup-client";
import { useRef } from "react";

export default function useCall() {
  const deviceRef = useRef(new mediasoup.Device());
  const produceTransportRef = useRef();
  const producerRef = useRef();
  const consumeTransportRef = useRef();
  const consumerRef = useRef();

  const init = async (socket) => {
    const rtpCap = await socket.emitWithAck("msServer", { type: "getRtpCap" });
    await deviceRef.current.load({ routerRtpCapabilities: rtpCap });
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

  const publish = (stream) => {
    return new Promise(async (resolve, reject) => {
      const track = stream.getTracks()[0];
      producerRef.current = await produceTransportRef.current.produce({
        track,
      });
      resolve();
    });
  };

  const createConsumer = async (socket) => {
    return new Promise(async (resolve, reject) => {
      const transport_params = await socket.emitWithAck("msServer", {
        type: "create-consumer-transport",
      });
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

  const consumeStream = async (socket) => {
    return new Promise(async (resolve, reject) => {
      const consumer_params = await socket.emitWithAck("msServer", {
        type: "consume-media",
        rtpCapabilities: deviceRef.current.rtpCapabilities,
      });
      if (consumer_params) {
        consumerRef.current = await consumeTransportRef.current.consume(
          consumer_params
        );
        const { track } = consumerRef.current;
        const stream = new MediaStream([track]);
        await socket.emitWithAck("msServer", { type: "unpause-consumer" });
        document.querySelector("#rtcCallAudio").srcObject = stream;
      }
      resolve();
    });
  };

  return [
    init,
    getStreams,
    createProducer,
    publish,
    createConsumer,
    consumeStream,
  ];
}
