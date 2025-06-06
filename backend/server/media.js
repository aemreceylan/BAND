import mediasoup from "mediasoup";
import os from "os";

const ms = (() => {
  let workers = [];
  const threadCount = os.cpus().length;

  initMedia();

  function unpauseConsumer() {
    return new Promise(async (resolve, reject) => {
      await workers[0].routers[0].transports.consume[0].list[0].resume();
      resolve();
    });
  }

  function consumeMedia(rtpCapabilities) {
    return new Promise(async (resolve, reject) => {
      const producerId = workers[0].routers[0].transports.produce[0].list[0].id;
      if (
        !workers[0].routers[0].router.canConsume({
          producerId,
          rtpCapabilities,
        })
      ) {
        resolve(false);
        return;
      }
      const clientConsumer =
        await workers[0].routers[0].transports.consume[0].transport.consume({
          producerId,
          rtpCapabilities,
          paused: true,
        });
      workers[0].routers[0].transports.consume[0].list.push(clientConsumer);
      const consumer_params = {
        producerId,
        id: clientConsumer.id,
        kind: clientConsumer.kind,
        rtpParameters: clientConsumer.rtpParameters,
      };
      resolve(consumer_params);
    });
  }

  function startProducing(params) {
    return new Promise(async (resolve, reject) => {
      try {
        const clientProducer =
          await workers[0].routers[0].transports.produce[0].transport.produce(
            params
          );
        workers[0].routers[0].transports.produce[0].list.push(clientProducer);
        resolve(clientProducer.id);
      } catch (err) {
        console.log(err);
        resolve(-1);
      }
    });
  }

  function connectTransport(dtlsParameters, id) {
    return new Promise(async (resolve, reject) => {
      try {
        const transport = [
          ...workers[0].routers[0].transports.produce,
          ...workers[0].routers[0].transports.consume,
        ].find((element) => element.transport.id == id).transport;
        await transport.connect({
          dtlsParameters,
        });
        resolve(true);
      } catch (error) {
        console.log(error);
        resolve(false);
      }
    });
  }

  function createTransport(type) {
    return new Promise(async (resolve, reject) => {
      const transport =
        await workers[0].routers[0].router.createWebRtcTransport({
          enableUdp: true,
          enableTcp: true,
          preferUdp: true,
          listenInfos: [
            {
              protocol: "udp",
              ip: "127.0.0.1",
            },
            {
              protocol: "tcp",
              ip: "127.0.0.1",
            },
          ],
        });
      if (type == "produce") {
        workers[0].routers[0].transports.produce.push({ transport, list: [] });
      } else if (type == "consume") {
        workers[0].routers[0].transports.consume.push({ transport, list: [] });
      }
      const transport_params = {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      };
      resolve(transport_params);
    });
  }

  function getRtpCap() {
    return new Promise(async (resolve, reject) => {
      resolve(workers[0].routers[0].router.rtpCapabilities);
    });
  }

  async function initMedia() {
    workers.push(await createWorker());
    workers[0].routers.push({
      router: await createRouter(workers[0].worker, [
        {
          kind: "audio",
          mimeType: "audio/opus",
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: "video",
          mimeType: "video/VP8",
          clockRate: 90000,
          parameters: {
            "x-google-start-bitrate": 1000,
          },
        },
        {
          kind: "video",
          mimeType: "video/H264",
          clockRate: 90000,
          parameters: {
            "packetization-mode": 1,
            "profile-level-id": "42e01f",
            "level-asymmetry-allowed": 1,
          },
        },
      ]),
      transports: { produce: [], consume: [] },
    });
  }

  function createWorker() {
    return new Promise(async (resolve, reject) => {
      const worker = await mediasoup.createWorker({
        logLevel: "warn",
        logTags: ["ice", "info", "dtls", "rtcp", "rtp", "srtp"],
      });
      worker.on("died", () => {
        console.log("Worker has died. pid: " + worker.pid);
      });
      resolve({ worker, routers: [] });
    });
  }

  function createRouter(worker, codecs) {
    return new Promise(async (resolve, reject) => {
      const router = await worker.createRouter({
        mediaCodecs: codecs,
      });
      resolve(router);
    });
  }

  return {
    getRtpCap,
    createTransport,
    connectTransport,
    startProducing,
    consumeMedia,
    unpauseConsumer,
  };
})();

export default ms;
