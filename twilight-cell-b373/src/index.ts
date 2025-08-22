import { Container, getContainer } from "@cloudflare/containers";

export class MarimoContainer extends Container {
  // Worker will wait until this port is listening
  defaultPort = 2718; // Marimo default
  // Optional: keep warm window for idle editing
  sleepAfter = "2h";
}

export default {
  async fetch(request: Request, env: any) {
    // Forward HTTP and WebSocket to the container
    return getContainer(env.MARIMO).fetch(request);
  },
};
