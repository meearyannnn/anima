import type { Metadata } from "next";
import { PartyClient } from "./PartyClient";

interface Props {
  params: Promise<{ roomId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { roomId } = await params;
  return {
    title: `Party Room #${roomId} | KuroSync`,
    description: "Watch anime together in synchronized real-time on Anima Stream.",
  };
}

export default async function PartyRoomPage({ params }: Props) {
  const { roomId } = await params;
  return <PartyClient roomId={roomId} />;
}
