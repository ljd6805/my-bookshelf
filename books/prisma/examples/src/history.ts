import type { PrismaClient } from "../generated/prisma/client.ts";
export async function recordRun(db: PrismaClient, taskId: number, requestKey: string, success: boolean) {
  if (!Number.isSafeInteger(taskId) || taskId < 1 || !requestKey.trim()) throw new Error("작업 ID와 요청 키가 필요합니다.");
  return db.$transaction(async tx => {
    const previous = await tx.run.findUnique({ where: { requestKey } });
    if (previous) {
      if (previous.taskId !== taskId || previous.success !== success) throw new Error("같은 요청 키에 서로 다른 결과를 보낼 수 없습니다.");
      return previous;
    }
    const run = await tx.run.create({ data: { taskId, requestKey, success } });
    await tx.task.update({ where: { id: taskId }, data: { status: success ? "DONE" : "FAILED" } });
    return run;
  });
}
