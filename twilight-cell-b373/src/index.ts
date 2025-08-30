import { Container, getContainer } from "@cloudflare/containers";

export class MarimoContainer extends Container {
  // Worker will wait until this port is listening
  defaultPort = 2718; // Marimo default
  // Optional: keep warm window for idle editing
  sleepAfter = "2h";
}

export class MarimoContainerV2 extends Container {
  // Worker will wait until this port is listening
  defaultPort = 2718; // Marimo default
  // Optional: keep warm window for idle editing
  sleepAfter = "2h";
}

export default {
  async fetch(request: Request, env: any) {
    // Get the container instance
    const container = getContainer(env.MARIMO);
    
    // Ensure container is started
    console.log("Starting Marimo container...");
    await container.start();
    console.log("Container started successfully");
    
    // Forward ALL requests to the Marimo container
    // This ensures the notebook interface is properly served
    return container.fetch(request);
  },
};

