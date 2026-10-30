import { assertMember } from "@/lib/queries";
import { setTyping } from "@/lib/messaging";
import { withUser } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    await assertMember(id, user.id);
    await setTyping(id, user.id);
    return { ok: true };
  });
}
