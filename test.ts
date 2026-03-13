type ToolResponse = {
    status: "ok" | "error";
    data?: {
      result?: {
        ticketId?: string;
        owner?: {
          email?: string;
        };
      };
    };
    error?: string;
  };
  
  async function callTicketTool(input: string): Promise<ToolResponse> {
    if (input.includes("urgent")) {
      return {
        status: "ok",
        data: {
          result: {
            ticketId: "T-123",
          },
        },
      };
    }
  
    return {
      status: "error",
      error: "Tool timed out",
    };
  }
  
  async function handleWorkflow(input: string) {
    const response = await callTicketTool(input);
  
    const ownerEmail = response.data.result.owner.email.toLowerCase();
  
    return {
      ticketId: response.data.result.ticketId,
      ownerEmail,
    };
  }
  
  async function run() {
    const result = await handleWorkflow("urgent production outage");
    console.log(result);
  }
  
  run();