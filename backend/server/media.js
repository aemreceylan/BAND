import mediasoup from "mediasoup";
import os from "os";
import { msDB } from "./mongo.js";

const ms = (() => {
  let workers = [];
  const threadCount = os.cpus().length;

  const msServerDB = msDB();

  const rtcChannelMsData = new Map();

  initMedia();

  function closeTransports(p_id, c_id, inx) {
    return new Promise((resolve, reject) => {
      try {
        console.log(inx);
        if (!p_id || !c_id)
          throw new Error("At least one of the parameters is not defined");
        if (!workers[inx[0]].routers[inx[1]])
          throw new Error("The specified worker or router does not exist.");
        console.log("-----------close1--------------");
        console.log(workers[inx[0]].routers[inx[1]].transports);
        workers[inx[0]].routers[inx[1]].transports = workers[inx[0]].routers[
          inx[1]
        ].transports.filter((element) => {
          if (element.transport.id != p_id && element.transport.id != c_id) {
            return true;
          } else {
            element.transport.close();
            console.log(
              "Transport Closed:> id: " +
                element.transport.id +
                " type: " +
                element.type
            );
            return false;
          }
        });
        console.log("-----------close2--------------");
        console.log(workers[inx[0]].routers[inx[1]].transports);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  function getProducers(produceTransportId, worker_in, router_in) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!workers[worker_in].routers[router_in])
          throw new Error("The specified worker or router does not exist.");

        let list = [];
        workers[worker_in].routers[router_in].transports.forEach((element) => {
          if (
            element.transport.id != produceTransportId &&
            element.type == "produce"
          )
            list.push(...element.list);
        });
        if (list.length != 0) {
          list = list.map((element) => element.id);
        }
        resolve(list);
      } catch (err) {
        reject(err);
      }
    });
  }

  function unpauseConsumer(id) {
    return new Promise(async (resolve, reject) => {
      try {
        let consumer;
        loop: for (const worker of workers) {
          for (const router of worker.routers) {
            for (const transport of router.transports) {
              if (transport.type == "consume")
                for (const element of transport.list) {
                  if (element.id == id) {
                    consumer = element;
                  }
                }
            }
          }
        }
        await consumer.resume();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  function consumeMedia(rtpCapabilities, c_id, p_id) {
    return new Promise(async (resolve, reject) => {
      try {
        let transport;
        let _router;
        let producerId = p_id;
        loop: for (const worker of workers) {
          for (const router of worker.routers) {
            for (const element of router.transports) {
              if (element.transport.id == c_id) {
                transport = element;
                _router = router.router;
                break loop;
              }
            }
          }
        }
        if (
          !_router.canConsume({
            producerId,
            rtpCapabilities,
          })
        ) {
          throw new Error("Cannot be consumed");
        }
        const clientConsumer = await transport.transport.consume({
          producerId,
          rtpCapabilities,
          paused: true,
        });
        clientConsumer.on("transportclose", () => {
          clientConsumer.close();
        });
        transport.list.push(clientConsumer);
        const consumer_params = {
          producerId,
          id: clientConsumer.id,
          kind: clientConsumer.kind,
          rtpParameters: clientConsumer.rtpParameters,
        };
        resolve(consumer_params);
      } catch (err) {
        reject(err);
      }
    });
  }

  function startProducing(socket, params, id) {
    return new Promise(async (resolve, reject) => {
      try {
        let transport;
        let clientProducer;
        loop: for (const worker of workers) {
          for (const router of worker.routers) {
            for (const element of router.transports) {
              if (element.transport.id == id) {
                transport = element.transport;
                clientProducer = await transport.produce(params);
                clientProducer.on("transportclose", () => {
                  clientProducer.close();
                });
                element.list.push(clientProducer);
                socket.emit("msServer-newProducer", clientProducer.id);
                break loop;
              }
            }
          }
        }
        resolve(clientProducer.id);
      } catch (err) {
        reject(err);
      }
    });
  }

  function connectTransport(dtlsParameters, id) {
    return new Promise(async (resolve, reject) => {
      try {
        let transport;
        let transport_type;
        loop: for (const worker of workers) {
          for (const router of worker.routers) {
            for (const element of router.transports) {
              if (element.transport.id == id) {
                transport = element.transport;
                transport_type = element.type;
                break loop;
              }
            }
          }
        }
        await transport.connect({
          dtlsParameters,
        });
        console.log(
          "Transport Connected:> id: " +
            transport.id +
            " type: " +
            transport_type
        );
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  }

  function createTransport(type_data, worker_in, router_in) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!workers[worker_in].routers[router_in])
          throw new Error("The specified worker or router does not exist.");
        if (!(type_data == "produce" || type_data == "consume"))
          throw new Error("Invalid type parameter");
        const transport = await workers[worker_in].routers[
          router_in
        ].router.createWebRtcTransport({
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
        workers[worker_in].routers[router_in].transports.push({
          transport,
          list: [],
          type: type_data,
        });
        const transport_params = {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        };
        console.log(
          "Transport Created:> id: " + transport.id + " type: " + type_data
        );
        console.log("-----------create--------------");
        console.log(workers[worker_in].routers[router_in].transports);
        resolve(transport_params);
      } catch (err) {
        reject(err);
      }
    });
  }

  function getRtpCap(worker_in, router_in) {
    return new Promise(async (resolve, reject) => {
      try {
        if (workers[worker_in].routers[router_in])
          resolve(workers[worker_in].routers[router_in].router.rtpCapabilities);
        else throw new Error("The specified worker or router does not exist.");
      } catch (err) {
        reject(err);
      }
    });
  }

  async function initMedia() {
    try {
      await createWorker();
      const channelList = await msServerDB.getRtcChannelList();
      channelList.forEach(async (element) => {
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
          transports: [],
        });
        rtcChannelMsData.set(element.id, [0, workers[0].routers.length - 1]);
      });
    } catch (err) {
      console.log(err);
    }
  }

  function createWorker() {
    return new Promise(async (resolve, reject) => {
      try {
        if (workers.length == threadCount)
          throw new Error(
            "Number of threads exceeded. New worker not created."
          );
        const worker = await mediasoup.createWorker({
          logLevel: "warn",
          logTags: ["ice", "info", "dtls", "rtcp", "rtp", "srtp"],
        });
        worker.on("died", () => {
          console.log("Worker has died. pid: " + worker.pid);
        });
        workers.push({ worker, routers: [] });
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  function createRouter(worker, codecs) {
    return new Promise(async (resolve, reject) => {
      try {
        const router = await worker.createRouter({
          mediaCodecs: codecs,
        });
        resolve(router);
      } catch (err) {
        reject(err);
      }
    });
  }

  return {
    getRtpCap,
    createTransport,
    connectTransport,
    startProducing,
    consumeMedia,
    unpauseConsumer,
    getProducers,
    closeTransports,
    rtcChannelMsData,
  };
})();

export default ms;
