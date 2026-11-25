import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";

export async function POST() {
  await deleteSession();
  return NextResponse.json({ message: "Logout berhasil" });
}

// Dipakai ketika cookie masih ada tetapi akunnya sudah dihapus dari database.
export async function GET(request) {
  await deleteSession();
  return NextResponse.redirect(new URL("/login", request.url));
}
