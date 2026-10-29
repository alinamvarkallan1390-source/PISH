import { assertMember } from "@/lib/queries";
import { markRead } from "@/lib/messaging";
import { withUser } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    await assertMember(id, user.id);
    const seq = await markRead(id, user.id);
    return { ok: true, last_read_seq: seq };
  });
}
