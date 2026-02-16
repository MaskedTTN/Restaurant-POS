import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Call your FastAPI backend
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

    if (!API_URL) {
      return NextResponse.json(
        {
          message:
            "API URL not configured. Please set NEXT_PUBLIC_API_URL in your environment variables.",
        },
        { status: 500 },
      );
    }

    const response = await fetch(`${API_URL}/user/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fullname: name, email, password }),
    });

    const data = await response.json();
    console.log("[next api] backend /user/signup response:", data);

    if (!response.ok) {
      return NextResponse.json(
        { message: data.detail || "Signup failed" },
        { status: response.status },
      );
    }

    // Return backend payload and a normalized token field for debugging
    return NextResponse.json(
      {
        ...data,
        token: data.access_token || data.token,
        user: {
          id: data.user_id || data.id,
          email: email,
          name: name,
          role: data.role || "manager",
        },
        backend: data,
      },
      { status: response.status },
    );
  } catch (error) {
    console.error("[v0] Signup error:", error);
    if (error instanceof TypeError && error.message.includes("fetch failed")) {
      return NextResponse.json(
        {
          message:
            "Cannot connect to API server. Please ensure your FastAPI backend is running and NEXT_PUBLIC_API_URL is configured correctly.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
