import { Controller, Get, Post, Body, Param } from "@nestjs/common";

interface MentorshipRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

@Controller("mentorship-requests")
export class MentorshipController {
  private requests: MentorshipRequest[] = [];

  @Get()
  getAllRequests() {
    return { data: this.requests };
  }

  @Get(":id")
  getRequest(@Param("id") id: string) {
    const request = this.requests.find((r) => r.id === id);
    if (!request) {
      return { error: "Request not found" };
    }
    return { data: request };
  }

  @Post()
  createRequest(@Body() requestData: any) {
    const newRequest: MentorshipRequest = {
      id: `request_${Date.now()}`,
      ...requestData,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.requests.push(newRequest);
    return { data: newRequest };
  }
}
